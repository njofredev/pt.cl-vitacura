'use strict';
'use server';

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { validateRUT, cleanRUT } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { sendAutomaticReferralEmail } from '@/lib/mail';
import { headers } from 'next/headers';

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
          registered_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        personId, 
        description ? description.trim() : '', 
        'pendiente', 
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
        session.id
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

export async function updateCaseStatusAction(caseId: string, status: 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado', observations: string) {
  const session = await getSession();
  
  if (!session || (session.role !== 'admin' && session.role !== 'internal')) {
    return { error: 'No autorizado para evaluar convenios y actualizar estados' };
  }

  if (!caseId || !status) {
    return { error: 'Datos incompletos para actualizar el estado' };
  }

  try {
    await pool.query(`
      UPDATE cases 
      SET status = $1, observations = $2, updated_by = $3, updated_at = NOW()
      WHERE id = $4
    `, [status, observations.trim(), session.id, caseId]);

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
    await pool.query('DELETE FROM cases WHERE id = $1', [caseId]);

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/cases');
    return { success: true };
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


