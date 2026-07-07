'use strict';
'use server';

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { validateRUT, cleanRUT } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { sendAutomaticReferralEmail } from '@/lib/mail';
import { headers } from 'next/headers';
import { logAuditAction } from '@/app/actions/auditActions';
import {
  checkDentalinkPatientAction,
  getDentalinkPatientTreatmentsAction,
  getDentalinkTreatmentEvolutionsAction,
  getDentalinkTreatmentAppointmentsAction,
  getDentalinkPatientAppointmentsAction,
  getDentalinkPatientEvolutionsAction,
  getDentalinkTreatmentDetailsAction
} from '@/app/actions/dentalinkActions';

// Memory-based rate limiting map to prevent brute-forcing
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_COUNT = 30; // Max 30 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window

export async function registerPersonAndCaseAction(formData: FormData) {
  const session = await getSession();
  
  if (!session || (session.role !== 'admin' && session.role !== 'external')) {
    return { error: 'No autorizado para registrar casos' };
  }

  const rutRaw = formData.get('rut') as string;
  const firstNames = formData.get('first_names') as string;
  const lastNames = formData.get('last_names') as string;
  const nationality = formData.get('nationality') as string;
  const birthDate = formData.get('birth_date') as string;
  const commune = formData.get('commune') as string;
  const email = formData.get('email') as string;
  const mobile = formData.get('mobile') as string;
  const description = formData.get('description') as string;
  const medicalCenter = formData.get('medical_center') as string;
  const agreementType = formData.get('agreement_type') as string;
  const dentalDiagnosis = formData.get('dental_diagnosis') as string;
  const treatmentNeeded = formData.get('treatment_needed') as string;
  const professionalName = formData.get('professional_name') as string;
  const professionalTitle = formData.get('professional_title') as string;
  const professionalPosition = formData.get('professional_position') as string;
  const professionalEmail = formData.get('professional_email') as string;
  const professionalPhone = formData.get('professional_phone') as string;
  const professionalWebsite = formData.get('professional_website') as string;
  const professionalAddress = formData.get('professional_address') as string;

  // Simple validation
  if (!rutRaw || !firstNames || !lastNames || !nationality || !birthDate || !commune || !mobile || !description) {
    return { error: 'Por favor complete todos los campos obligatorios' };
  }

  // Validate RUT
  const cleanedRUT = cleanRUT(rutRaw);
  if (!validateRUT(cleanedRUT)) {
    return { error: 'El RUT ingresado no es válido' };
  }

  try {
    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Calculate dental and xray counts from selected treatment ids
      const selectedTreatmentIdsStr = formData.get('selected_treatment_ids') as string || '';
      const treatmentIds = selectedTreatmentIdsStr.split(',').filter(Boolean).map(Number);
      
      let dentalCount = 0;
      let xrayCount = 0;

      if (treatmentIds.length > 0) {
        const arancelesRes = await client.query(
          'SELECT id, category FROM arancel WHERE id = ANY($1)',
          [treatmentIds]
        );
        
        const idToCategory = new Map<number, string>();
        arancelesRes.rows.forEach((row: any) => {
          idToCategory.set(row.id, row.category);
        });

        treatmentIds.forEach((tid) => {
          const cat = idToCategory.get(tid) || '';
          if (cat === 'Radiología') {
            xrayCount++;
          } else {
            dentalCount++;
          }
        });
      }

      // Validate and deduct institution quotas based on the professional email of the case
      const profEmailRaw = formData.get('professional_email') as string || '';
      const profEmail = profEmailRaw.trim().toLowerCase();
      
      let targetProfessionalUser: any = null;
      
      if (profEmail) {
        const userLookup = await client.query(
          'SELECT id, role, institution_id FROM users WHERE LOWER(email) = $1',
          [profEmail]
        );
        if (userLookup.rows.length > 0 && userLookup.rows[0].role === 'external') {
          targetProfessionalUser = userLookup.rows[0];
        }
      }
 
      if (targetProfessionalUser) {
        const { institution_id } = targetProfessionalUser;
 
        if (institution_id) {
          const instLookup = await client.query(
            'SELECT id, name, quota_dental, quota_xray, used_dental, used_xray FROM institutions WHERE id = $1',
            [institution_id]
          );
 
          if (instLookup.rows.length > 0) {
            const institution = instLookup.rows[0];
            const remainingDental = institution.quota_dental - institution.used_dental;
            const remainingXray = institution.quota_xray - institution.used_xray;
 
            if (dentalCount > 0 && remainingDental < dentalCount) {
              await client.query('ROLLBACK');
              return { error: `Cupo insuficiente para Procedimientos Dentales. A la institución ${institution.name} le quedan ${remainingDental} cupos e intentó registrar ${dentalCount}.` };
            }
            if (xrayCount > 0 && remainingXray < xrayCount) {
              await client.query('ROLLBACK');
              return { error: `Cupo insuficiente para Radiología (Rayos X). A la institución ${institution.name} le quedan ${remainingXray} cupos e intentó registrar ${xrayCount}.` };
            }
 
            if (dentalCount > 0 || xrayCount > 0) {
              await client.query(
                `UPDATE institutions 
                 SET used_dental = used_dental + $1, used_xray = used_xray + $2, updated_at = NOW() 
                 WHERE id = $3`,
                [dentalCount, xrayCount, institution.id]
              );
            }
          }
        }
      }

      // 1. Check if person already exists by RUT
      let personId: string;
      const personCheck = await client.query('SELECT id FROM persons WHERE rut = $1', [cleanedRUT]);
      
      if (personCheck.rows.length > 0) {
        personId = personCheck.rows[0].id;
        
        // Optionally update person details with latest inputs
        await client.query(`
          UPDATE persons 
          SET first_names = $1, last_names = $2, nationality = $3, birth_date = $4, commune = $5, email = $6, mobile = $7, updated_at = NOW()
          WHERE id = $8
        `, [
          firstNames.trim(), 
          lastNames.trim(), 
          nationality.trim(), 
          birthDate, 
          commune.trim(), 
          email ? email.toLowerCase().trim() : null, 
          mobile.trim(),
          personId
        ]);
      } else {
        // Create new person
        const personInsert = await client.query(`
          INSERT INTO persons (rut, first_names, last_names, nationality, birth_date, commune, email, mobile, registered_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `, [
          cleanedRUT, 
          firstNames.trim(), 
          lastNames.trim(), 
          nationality.trim(), 
          birthDate, 
          commune.trim(), 
          email ? email.toLowerCase().trim() : null, 
          mobile.trim(),
          session.id
        ]);
        personId = personInsert.rows[0].id;
      }

      // 2. Create the case linked to the person
      await client.query(`
        INSERT INTO cases (
          person_id, description, status, observations,
          medical_center, agreement_type, dental_diagnosis, treatment_needed,
          professional_name, professional_title, professional_position,
          professional_email, professional_phone, professional_website, professional_address,
          registered_by, dental_count, xray_count, status_history
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `, [
        personId, 
        description ? description.trim() : '', 
        'ingresado', 
        '',
        medicalCenter?.trim() || null,
        agreementType?.trim() || null,
        dentalDiagnosis?.trim() || null,
        treatmentNeeded?.trim() || null,
        professionalName?.trim() || null,
        professionalTitle?.trim() || null,
        professionalPosition?.trim() || null,
        professionalEmail?.trim() || null,
        professionalPhone?.trim() || null,
        professionalWebsite?.trim() || null,
        professionalAddress?.trim() || null,
        session.id,
        dentalCount,
        xrayCount,
        JSON.stringify({ ingresado: new Date().toISOString() })
      ]);

      await client.query('COMMIT');
      
      // Dispatch automatic SMTP email notification asynchronously (non-blocking)
      sendAutomaticReferralEmail({
        rut: cleanedRUT,
        firstNames: firstNames.trim(),
        lastNames: lastNames.trim(),
        medicalCenter: medicalCenter?.trim() || 'CESFAM Vitacura',
        agreementType: agreementType?.trim() || 'Atención Dental Básica',
        dentalDiagnosis: dentalDiagnosis?.trim() || 'Sin patologías especificadas.',
        treatmentNeeded: treatmentNeeded?.trim() || 'No especificada.',
        professionalName: professionalName?.trim() || session.name || 'Profesional Derivador'
      }).catch(err => {
        console.error('Error al iniciar el envío automático de correo:', err);
      });
      
      await logAuditAction('CASE_CREATED', { rut: cleanedRUT, firstNames: firstNames.trim(), lastNames: lastNames.trim(), medicalCenter, agreementType });
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/cases');
      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error registering case:', error);
    return { error: 'Error del servidor al registrar la persona y su caso social' };
  }
}

export async function updateCaseStatusAction(caseId: string, status: 'ingresado' | 'agendado' | 'en_tratamiento' | 'finalizado' | 'sincronizado', observations: string) {
  const session = await getSession();
  
  if (!session || (session.role !== 'admin' && session.role !== 'internal')) {
    return { error: 'No autorizado para evaluar convenios y actualizar estados' };
  }

  if (!caseId || !status) {
    return { error: 'Datos incompletos para actualizar el estado' };
  }

  try {
    // Obtener historial actual para rellenar estados si corresponde
    const caseRes = await pool.query('SELECT status_history, created_at FROM cases WHERE id = $1', [caseId]);
    const c = caseRes.rows[0] || {};
    const currentHistory = c.status_history || {};
    const newHistory = { ...currentHistory };
    const nowStr = new Date().toISOString();

    if (!newHistory['ingresado']) {
      newHistory['ingresado'] = c.created_at ? new Date(c.created_at).toISOString() : nowStr;
    }

    const STATUS_ORDER = ['ingresado', 'sincronizado', 'agendado', 'en_tratamiento', 'finalizado'];
    const targetIndex = STATUS_ORDER.indexOf(status);
    for (let i = 0; i <= targetIndex; i++) {
      const stateName = STATUS_ORDER[i];
      if (!newHistory[stateName]) {
        const backfillTime = new Date(Date.now() - (targetIndex - i) * 1000).toISOString();
        newHistory[stateName] = backfillTime;
      }
    }

    await pool.query(`
      UPDATE cases 
      SET status = $1, 
          observations = $2, 
          updated_by = $3, 
          updated_at = NOW(),
          status_history = $5::jsonb
      WHERE id = $4
    `, [status, observations.trim(), session.id, caseId, JSON.stringify(newHistory)]);

    await logAuditAction('CASE_STATUS_UPDATED', { caseId, status, observations: observations.trim() });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/cases');
    return { success: true };
  } catch (error) {
    console.error('Error updating case status:', error);
    return { error: 'Error del servidor al actualizar el caso social' };
  }
}

export async function deleteCaseAction(caseId: string) {
  const session = await getSession();
  
  if (!session || session.role !== 'admin') {
    return { error: 'No autorizado para eliminar casos. Esta acción está restringida a administradores.' };
  }

  if (!caseId) {
    return { error: 'ID de caso inválido para eliminar' };
  }

  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Fetch case details to restore quotas
      const caseRes = await client.query(
        'SELECT professional_email, dental_count, xray_count FROM cases WHERE id = $1',
        [caseId]
      );

      if (caseRes.rows.length > 0) {
        const { professional_email, dental_count, xray_count } = caseRes.rows[0];
        const profEmail = professional_email ? professional_email.trim().toLowerCase() : '';

        if (profEmail && ((dental_count || 0) > 0 || (xray_count || 0) > 0)) {
          const userLookup = await client.query(
            'SELECT id, institution_id FROM users WHERE LOWER(email) = $1 AND role = $2',
            [profEmail, 'external']
          );

          if (userLookup.rows.length > 0) {
            const { institution_id } = userLookup.rows[0];
            if (institution_id) {
              await client.query(
                `UPDATE institutions 
                 SET 
                   used_dental = GREATEST(0, used_dental - $1), 
                   used_xray = GREATEST(0, used_xray - $2), 
                   updated_at = NOW() 
                 WHERE id = $3`,
                [dental_count || 0, xray_count || 0, institution_id]
              );
            }
          }
        }
      }

      await client.query('DELETE FROM cases WHERE id = $1', [caseId]);

      await client.query('COMMIT');

      await logAuditAction('CASE_DELETED', { caseId });

      revalidatePath('/dashboard');
      revalidatePath('/dashboard/cases');
      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting case:', error);
    return { error: 'Error del servidor al eliminar el caso social' };
  }
}

export async function updateCaseDetailsAction(
  caseId: string,
  data: {
    rut: string;
    first_names: string;
    last_names: string;
    nationality: string;
    birth_date: string;
    commune: string;
    email: string;
    mobile: string;
    description: string;
    medical_center: string;
    agreement_type: string;
    dental_diagnosis: string;
    treatment_needed: string;
    professional_name: string;
  }
) {
  const session = await getSession();
  
  if (!session || session.role !== 'admin') {
    return { error: 'No autorizado para editar detalles de casos. Esta acción está restringida a administradores.' };
  }

  const cleanedRUT = cleanRUT(data.rut);
  if (!validateRUT(cleanedRUT)) {
    return { error: 'El RUT ingresado no es válido' };
  }

  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const caseRes = await client.query('SELECT person_id FROM cases WHERE id = $1', [caseId]);
      if (caseRes.rows.length === 0) {
        throw new Error('Caso no encontrado');
      }
      const personId = caseRes.rows[0].person_id;

      await client.query(`
        UPDATE persons 
        SET rut = $1, first_names = $2, last_names = $3, nationality = $4, birth_date = $5, commune = $6, email = $7, mobile = $8, updated_at = NOW()
        WHERE id = $9
      `, [
        cleanedRUT,
        data.first_names.trim(),
        data.last_names.trim(),
        data.nationality.trim(),
        data.birth_date,
        data.commune.trim(),
        data.email ? data.email.toLowerCase().trim() : null,
        data.mobile.trim(),
        personId
      ]);

      await client.query(`
        UPDATE cases 
        SET description = $1, medical_center = $2, agreement_type = $3, dental_diagnosis = $4, treatment_needed = $5, professional_name = $6, updated_at = NOW(), updated_by = $7
        WHERE id = $8
      `, [
        data.description ? data.description.trim() : '',
        data.medical_center ? data.medical_center.trim() : null,
        data.agreement_type ? data.agreement_type.trim() : null,
        data.dental_diagnosis ? data.dental_diagnosis.trim() : null,
        data.treatment_needed ? data.treatment_needed.trim() : null,
        data.professional_name ? data.professional_name.trim() : null,
        session.id,
        caseId
      ]);

      await client.query('COMMIT');
      
      await logAuditAction('CASE_DETAILS_UPDATED', { caseId, rut: cleanedRUT, firstNames: data.first_names.trim(), lastNames: data.last_names.trim() });
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/cases');
      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating case details:', error);
    return { error: 'Error del servidor al actualizar los detalles del caso' };
  }
}

export async function getPersonByRutAction(rutRaw: string) {
  const session = await getSession();
  let clientIp = 'unknown';
  let clientKey: string | null = null;

  try {
    const reqHeaders = await headers();
    clientIp = reqHeaders.get('x-forwarded-for') || reqHeaders.get('x-real-ip') || 'unknown';
    clientKey = reqHeaders.get('x-api-key') || reqHeaders.get('authorization')?.replace('Bearer ', '') || null;
  } catch (e) {
    // headers() might error outside HTTP request context, ignore
  }

  // 1. Env-defined Token Verification
  const internalApiKey = process.env.INTERNAL_API_KEY;
  if (internalApiKey) {
    // If API key is configured, allow request only if it matches, OR if there is a valid session
    if (clientKey !== internalApiKey && (!session || (session.role !== 'admin' && session.role !== 'external'))) {
      return { error: 'No autorizado: Token de API inválido o sesión inválida' };
    }
  } else {
    // Default session authentication
    if (!session || (session.role !== 'admin' && session.role !== 'external')) {
      return { error: 'No autorizado para consultar datos de postulantes' };
    }
  }

  // 2. Memory-based Rate Limiting
  const limiterKey = session ? `${session.id}_${clientIp}` : clientIp;
  const now = Date.now();
  const limitInfo = rateLimitMap.get(limiterKey) || { count: 0, lastReset: now };

  if (now - limitInfo.lastReset > RATE_LIMIT_WINDOW) {
    limitInfo.count = 1;
    limitInfo.lastReset = now;
    rateLimitMap.set(limiterKey, limitInfo);
  } else {
    limitInfo.count += 1;
    rateLimitMap.set(limiterKey, limitInfo);
    if (limitInfo.count > RATE_LIMIT_COUNT) {
      return { error: 'Demasiadas solicitudes. Por favor intente más tarde.' };
    }
  }

  const cleaned = cleanRUT(rutRaw);
  if (!validateRUT(cleaned)) {
    return { error: 'El RUT ingresado no es válido' };
  }

  try {
    const res = await pool.query(
      'SELECT first_names, last_names, nationality, birth_date, commune, email, mobile FROM persons WHERE rut = $1',
      [cleaned]
    );

    if (res.rows.length > 0) {
      const p = res.rows[0];
      return {
        success: true,
        person: {
          firstNames: p.first_names,
          lastNames: p.last_names,
          nationality: p.nationality,
          birthDate: p.birth_date ? new Date(p.birth_date).toISOString().split('T')[0] : '',
          commune: p.commune,
          email: p.email || '',
          mobile: p.mobile
        }
      };
    }
    return { success: false, message: 'No se encontró registro para este RUT' };
  } catch (err) {
    console.error('Error in getPersonByRutAction:', err);
    return { error: 'Error del servidor al consultar el RUT' };
  }
}

export async function syncCaseStatusAction(caseId: string, yearlyCorrelative?: number | string) {
  try {
    // 1. Get the case details (rut, status, created_at, dentalink_patient_id, status_history)
    const caseRes = await pool.query(`
      SELECT c.id, c.status, c.observations, c.status_history, p.rut, c.created_at, p.dentalink_patient_id
      FROM cases c
      JOIN persons p ON c.person_id = p.id
      WHERE c.id = $1
    `, [caseId]);
    
    if (caseRes.rows.length === 0) {
      return { error: 'Caso no encontrado' };
    }
    
    const c = caseRes.rows[0];
    
    let correlative: number;
    if (yearlyCorrelative !== undefined && yearlyCorrelative !== null) {
      correlative = Number(yearlyCorrelative);
    } else {
      // Query the exact correlative matching the ROW_NUMBER() in the dashboard query
      const corrRes = await pool.query(`
        WITH numbered_cases AS (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM created_at) ORDER BY created_at ASC) as correlative
          FROM cases
        )
        SELECT correlative FROM numbered_cases WHERE id = $1
      `, [caseId]);
      correlative = corrRes.rows[0]?.correlative ? parseInt(corrRes.rows[0].correlative) : 1;
    }
    const caseIdStr = String(correlative).padStart(4, '0');
    
    let patientId = c.dentalink_patient_id;
    if (!patientId) {
      // 2. Query Dentalink patient if not already cached
      const resExist = await checkDentalinkPatientAction(c.rut);
      if (!resExist.success || !resExist.exists) {
        return { success: false, error: 'Paciente no encontrado en Dentalink o error en la llamada' };
      }
      patientId = resExist.patient.id;
    }
    
    // 3. Query treatments, appointments and patient-wide evolutions in parallel
    const [resTreatments, patApptsRes, patEvsRes] = await Promise.all([
      getDentalinkPatientTreatmentsAction(patientId),
      getDentalinkPatientAppointmentsAction(patientId),
      getDentalinkPatientEvolutionsAction(patientId)
    ]);

    if (!resTreatments.success) {
      return { success: false, error: 'Error al obtener tratamientos de Dentalink' };
    }
    
    const treatmentsList = resTreatments.treatments || [];
    
    // If status is 'sincronizado' but treatmentsList is empty, it means the treatment was deleted in Dentalink. Revert status.
    if (c.status === 'sincronizado' && treatmentsList.length === 0) {
      await pool.query(`
        UPDATE cases 
        SET status = $1, 
            observations = $2, 
            updated_by = NULL, 
            updated_at = NOW(),
            status_history = COALESCE(status_history, '{}'::jsonb) || jsonb_build_object($4::text, NOW())
        WHERE id = $3
      `, ['en_tratamiento', 'Tratamiento eliminado en Dentalink. Revertido automáticamente para re-sincronización.', c.id, 'en_tratamiento']);
      
      await logAuditAction('CASE_STATUS_UPDATED', { caseId: c.id, status: 'en_tratamiento', observations: 'Tratamiento eliminado en Dentalink. Revertido automáticamente.' });
      
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/cases');
      return { success: true, statusChanged: true, newStatus: 'en_tratamiento' };
    }
    
    // Find matching treatment by caseIdStr (matching caseIdStr only as a standalone number)
    const matchingTreatment = treatmentsList.find((t: any) => new RegExp(`(?<!\\d)${caseIdStr}(?!\\d)`).test(t.nombre.toUpperCase()));
    if (!matchingTreatment) {
      return { success: true, statusChanged: false, message: 'No se encontró tratamiento correspondiente en Dentalink' };
    }
    
    const patAppts = patApptsRes.success && patApptsRes.appointments ? patApptsRes.appointments : [];
    const patEvs = patEvsRes.success && patEvsRes.evolutions ? patEvsRes.evolutions : [];
    
    // Filter patient appointments and evolutions matching this treatment that are not cancelled
    const appts = patAppts.filter((appt: any) => appt.id_tratamiento === matchingTreatment.id && appt.estado_anulacion === 0);
    const evs = patEvs.filter((ev: any) => ev.id_tratamiento === matchingTreatment.id);
    
    let newStatus: 'ingresado' | 'sincronizado' | 'agendado' | 'en_tratamiento' | 'finalizado' = c.status;
    let obs = c.observations || '';
    
    // Fetch details of the matching treatment to verify if all prestaciones are completed
    const detailsRes = await getDentalinkTreatmentDetailsAction(matchingTreatment.id);
    const details = detailsRes.success && detailsRes.details ? detailsRes.details : [];
    const allDetailsCompleted = details.length > 0 && details.every((detail: any) => Number(detail.realizado) === 1);
    
    if (matchingTreatment.finalizado === 1) {
      newStatus = 'finalizado';
      obs = 'Tratamiento finalizado y completado en Dentalink.';
    } else if (allDetailsCompleted) {
      newStatus = 'finalizado';
      obs = 'Todas las prestaciones del plan de tratamiento han sido realizadas en Dentalink.';
    } else {
      const hasTreatmentStarted = evs.length > 0 || appts.some((appt: any) => [2, 5, 6].includes(appt.id_estado));
      
      if (hasTreatmentStarted) {
        newStatus = 'en_tratamiento';
        obs = evs.length > 0 
          ? 'Tratamiento iniciado (evoluciones registradas en Dentalink).'
          : 'Tratamiento iniciado (cita atendida, en espera o atendiéndose en Dentalink).';
      } else if (appts.length > 0) {
        newStatus = 'agendado';
        obs = 'Cita agendada registrada en Dentalink.';
      } else if (details.length > 0) {
        newStatus = 'sincronizado';
        obs = 'Sincronizado automáticamente con Dentalink';
      } else {
        newStatus = 'ingresado';
        obs = 'Tratamiento creado en Dentalink, pendiente de vincular prestaciones.';
      }
    }
    
    if (c.status !== newStatus) {
      const currentHistory = c.status_history || {};
      const newHistory = { ...currentHistory };
      const nowStr = new Date().toISOString();

      if (!newHistory['ingresado']) {
        newHistory['ingresado'] = c.created_at ? new Date(c.created_at).toISOString() : nowStr;
      }

      const STATUS_ORDER = ['ingresado', 'sincronizado', 'agendado', 'en_tratamiento', 'finalizado'];
      const targetIndex = STATUS_ORDER.indexOf(newStatus);
      for (let i = 0; i <= targetIndex; i++) {
        const stateName = STATUS_ORDER[i];
        if (!newHistory[stateName]) {
          const backfillTime = new Date(Date.now() - (targetIndex - i) * 1000).toISOString();
          newHistory[stateName] = backfillTime;
        }
      }

      await pool.query(`
        UPDATE cases 
        SET status = $1, 
            observations = $2, 
            updated_by = NULL, 
            updated_at = NOW(),
            status_history = $4::jsonb
        WHERE id = $3
      `, [newStatus, obs, c.id, JSON.stringify(newHistory)]);

      await logAuditAction('CASE_STATUS_UPDATED', { caseId: c.id, status: newStatus, observations: obs });
      
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/cases');
      
      return { success: true, statusChanged: true, newStatus };
    }
    
    return { success: true, statusChanged: false, currentStatus: c.status };
  } catch (error: any) {
    console.error(`Error in syncCaseStatusAction for case ${caseId}:`, error);
    return { success: false, error: error.message || 'Error del servidor al sincronizar' };
  }
}

export async function syncAllActiveCasesAction() {
  try {
    // Select cases that are in active workflow statuses but not 'finalizado' or 'ingresado' (unless we want to verify them too)
    // Wait, let's select: agendado, sincronizado, en_tratamiento.
    const res = await pool.query(`
      SELECT id FROM cases 
      WHERE status IN ('ingresado', 'sincronizado', 'agendado', 'en_tratamiento')
    `);
    
    const casesToSync = res.rows;
    let updatedCount = 0;
    
    for (const item of casesToSync) {
      const syncResult = await syncCaseStatusAction(item.id);
      if (syncResult.success && syncResult.statusChanged) {
        updatedCount++;
      }
      // Brief pause to avoid hitting API rate limits too quickly
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return { success: true, totalChecked: casesToSync.length, totalUpdated: updatedCount };
  } catch (error: any) {
    console.error('Error in syncAllActiveCasesAction:', error);
    return { success: false, error: error.message || 'Error del servidor en sincronización masiva' };
  }
}

export async function getCaseDentalinkDetailsAction(caseId: string, yearlyCorrelative?: number | string) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'No autorizado' };
  }

  try {
    const caseRes = await pool.query(`
      SELECT c.id, p.rut, p.dentalink_patient_id
      FROM cases c
      JOIN persons p ON c.person_id = p.id
      WHERE c.id = $1
    `, [caseId]);

    if (caseRes.rows.length === 0) {
      return { success: false, error: 'Caso no encontrado' };
    }

    const c = caseRes.rows[0];

    let correlative: number;
    if (yearlyCorrelative !== undefined && yearlyCorrelative !== null) {
      correlative = Number(yearlyCorrelative);
    } else {
      const corrRes = await pool.query(`
        WITH numbered_cases AS (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM created_at) ORDER BY created_at ASC) as correlative
          FROM cases
        )
        SELECT correlative FROM numbered_cases WHERE id = $1
      `, [caseId]);
      correlative = corrRes.rows[0]?.correlative ? parseInt(corrRes.rows[0].correlative) : 1;
    }
    const caseIdStr = String(correlative).padStart(4, '0');

    let patientId = c.dentalink_patient_id;
    if (!patientId) {
      const resExist = await checkDentalinkPatientAction(c.rut);
      if (resExist.success && resExist.exists) {
        patientId = resExist.patient.id;
      }
    }

    if (!patientId) {
      return { success: false, error: 'Paciente no encontrado en Dentalink' };
    }

    const resTreatments = await getDentalinkPatientTreatmentsAction(patientId);
    if (!resTreatments.success) {
      return { success: false, error: 'Error al obtener tratamientos de Dentalink' };
    }

    const treatmentsList = resTreatments.treatments || [];
    const matchingTreatment = treatmentsList.find((t: any) => new RegExp(`(?<!\\d)${caseIdStr}(?!\\d)`).test(t.nombre.toUpperCase()));
    
    if (!matchingTreatment) {
      return { success: false, error: 'No se encontró tratamiento correspondiente en Dentalink' };
    }

    const detailsRes = await getDentalinkTreatmentDetailsAction(matchingTreatment.id);
    if (!detailsRes.success) {
      return { success: false, error: 'Error al obtener detalles del tratamiento' };
    }

    return {
      success: true,
      treatment: matchingTreatment,
      details: detailsRes.details || []
    };
  } catch (err: any) {
    console.error('Error fetching case dentalink details:', err);
    return { success: false, error: err.message || 'Error del servidor' };
  }
}



