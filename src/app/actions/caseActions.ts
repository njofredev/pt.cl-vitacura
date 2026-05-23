'use strict';
'use server';

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { validateRUT, cleanRUT } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

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
