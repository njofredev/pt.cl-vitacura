'use strict';
'use server';

import pool from '@/lib/db';
import { getDentalinkConveniosAction } from './dentalinkActions';
import { revalidatePath } from 'next/cache';

export async function getConveniosByMedicalCenterAction(medicalCenter: string) {
  if (!medicalCenter) {
    return { success: true, convenios: [] };
  }

  try {
    const res = await pool.query(
      `SELECT id, id_dentalink, empresa, fecha_afiliacion, descuento, medical_center 
       FROM convenios 
       WHERE LOWER(medical_center) = LOWER($1)
       ORDER BY empresa ASC`,
      [medicalCenter.trim()]
    );
    return { success: true, convenios: res.rows };
  } catch (error) {
    console.error('Error fetching convenios by medical center:', error);
    return { error: 'Error del servidor al obtener los convenios.' };
  }
}

export async function syncDentalinkConveniosAction() {
  try {
    // 1. Fetch active convenios from Dentalink API
    const dentalinkRes = await getDentalinkConveniosAction();
    if (!dentalinkRes.success || !dentalinkRes.convenios) {
      return { success: false, error: dentalinkRes.error || 'No se pudieron obtener los convenios de Dentalink' };
    }

    const dentalinkConvenios = dentalinkRes.convenios;
    
    // We will do database operations inside a client transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

      // --- MERGE PRE-EXISTING DUPLICATES IN DATABASE ---
      const allInstsRes = await client.query('SELECT id, name FROM institutions');
      const seen = new Map<string, { id: number; name: string }>();
      
      for (const row of allInstsRes.rows) {
        const norm = normalize(row.name);
        if (seen.has(norm)) {
          const primary = seen.get(norm)!;
          // Merge row into primary
          await client.query(
            'UPDATE users SET institution_id = $1 WHERE institution_id = $2',
            [primary.id, row.id]
          );
          await client.query(
            'DELETE FROM institutions WHERE id = $1',
            [row.id]
          );
        } else {
          seen.set(norm, row);
        }
      }

      // --- PROCESS NEW DENTALINK AGREEMENTS ---
      // Keep track of unique institutions we process from Dentalink
      const uniqueInstitutions = new Set<string>();
      
      for (const cov of dentalinkConvenios) {
        const nombreEmpresa = (cov.nombre_empresa || '').trim();
        if (nombreEmpresa) {
          uniqueInstitutions.add(nombreEmpresa);
        }
      }

      // Fetch fresh list of institutions after merge
      const existingInstRes = await client.query('SELECT id, name FROM institutions');

      // 2. Ensure each institution exists in the local database (comparing normalized names)
      for (const instName of uniqueInstitutions) {
        const normalizedInput = normalize(instName);
        const match = existingInstRes.rows.find(row => normalize(row.name) === normalizedInput);
        
        if (!match) {
          // Insert with default quotas of 150
          await client.query(
            `INSERT INTO institutions (name, quota_dental, quota_xray, used_dental, used_xray) 
             VALUES ($1, 150, 150, 0, 0)`,
            [instName]
          );
        } else {
          // Update the existing name to the Dentalink name (e.g. correcting accents/casing)
          await client.query(
            `UPDATE institutions SET name = $1 WHERE id = $2`,
            [instName, match.id]
          );
        }
      }

      // Ensure id_dentalink column exists
      await client.query('ALTER TABLE convenios ADD COLUMN IF NOT EXISTS id_dentalink INT');

      // 3. Truncate convenios and insert the fresh synced list
      await client.query('TRUNCATE TABLE convenios RESTART IDENTITY');

      for (const cov of dentalinkConvenios) {
        const nombreEmpresa = (cov.nombre_empresa || '').trim();
        const nombreConvenio = (cov.nombre || '').trim();
        const combinedEmpresa = nombreEmpresa && nombreConvenio 
          ? `${nombreEmpresa}: ${nombreConvenio}` 
          : (nombreConvenio || nombreEmpresa || 'Convenio sin nombre');
        
        const fecha = cov.fecha_afiliacion || new Date().toISOString().split('T')[0];
        const descuento = '0%'; // default

        await client.query(
          `INSERT INTO convenios (empresa, fecha_afiliacion, descuento, medical_center, id_dentalink) 
           VALUES ($1, $2, $3, $4, $5)`,
          [combinedEmpresa, fecha, descuento, nombreEmpresa || 'Sin Institución', cov.id]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    revalidatePath('/dashboard/users');
    revalidatePath('/dashboard');
    return { success: true, count: dentalinkConvenios.length };
  } catch (error: any) {
    console.error('Error syncing Dentalink convenios:', error);
    return { success: false, error: error.message || 'Error al sincronizar con el servidor de base de datos' };
  }
}

export async function getAllConveniosAction() {
  try {
    const res = await pool.query(
      `SELECT id, id_dentalink, empresa, fecha_afiliacion, descuento, medical_center 
       FROM convenios 
       ORDER BY empresa ASC`
    );
    return { success: true, convenios: res.rows };
  } catch (error) {
    console.error('Error fetching all convenios:', error);
    return { error: 'Error del servidor al obtener los convenios.' };
  }
}


