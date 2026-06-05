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
       ORDER BY empresa ASC`
    );
    return { success: true, convenios: res.rows };
  } catch (error) {
    console.error('Error fetching all convenios:', error);
    return { error: 'Error del servidor al obtener los convenios.' };
  }
}
