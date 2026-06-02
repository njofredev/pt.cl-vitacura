'use strict';
'use server';

import pool from '@/lib/db';

export async function getConveniosByMedicalCenterAction(medicalCenter: string) {
  if (!medicalCenter) {
    return { success: true, convenios: [] };
  }

  try {
    const res = await pool.query(
      `SELECT id, empresa, fecha_afiliacion, descuento 
       FROM convenios 
       WHERE medical_center = $1
       ORDER BY empresa ASC`,
      [medicalCenter.trim()]
    );
    return { success: true, convenios: res.rows };
  } catch (error) {
    console.error('Error fetching convenios by medical center:', error);
    return { error: 'Error del servidor al obtener los convenios.' };
  }
}
