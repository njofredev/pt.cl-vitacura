'use strict';
'use server';

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getInstitutionsAction() {
  const session = await getSession();
  if (!session) {
    return { error: 'No autenticado' };
  }
  try {
    const res = await pool.query(
      `SELECT id, name, quota_dental, quota_xray, used_dental, used_xray, active, created_at 
       FROM institutions 
       ORDER BY name ASC`
    );
    return { success: true, institutions: res.rows };
  } catch (error) {
    console.error('Error fetching institutions:', error);
    return { error: 'Error del servidor al obtener instituciones' };
  }
}

export async function toggleInstitutionStatusAction(id: number, currentStatus: boolean) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'No autorizado para realizar esta acción' };
  }

  try {
    await pool.query(
      'UPDATE institutions SET active = $1 WHERE id = $2',
      [!currentStatus, id]
    );

    revalidatePath('/dashboard/users');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error toggling institution status:', error);
    return { error: 'Error del servidor al cambiar el estado de la institución' };
  }
}

export async function createInstitutionAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'No autorizado para realizar esta acción' };
  }

  const name = formData.get('name') as string;
  const quotaDental = parseInt(formData.get('quota_dental') as string || '0', 10);
  const quotaXray = parseInt(formData.get('quota_xray') as string || '0', 10);

  if (!name || name.trim() === '') {
    return { error: 'El nombre de la institución es requerido' };
  }

  try {
    const checkRes = await pool.query('SELECT id FROM institutions WHERE LOWER(name) = $1', [name.trim().toLowerCase()]);
    if (checkRes.rows.length > 0) {
      return { error: 'Ya existe una institución con este nombre' };
    }

    await pool.query(
      `INSERT INTO institutions (name, quota_dental, quota_xray, used_dental, used_xray) 
       VALUES ($1, $2, $3, 0, 0)`,
      [name.trim(), quotaDental, quotaXray]
    );

    revalidatePath('/dashboard/users');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error creating institution:', error);
    return { error: 'Error del servidor al crear la institución' };
  }
}

export async function updateInstitutionAction(id: number, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'No autorizado para realizar esta acción' };
  }

  const name = formData.get('name') as string;
  const quotaDental = parseInt(formData.get('quota_dental') as string || '0', 10);
  const quotaXray = parseInt(formData.get('quota_xray') as string || '0', 10);

  if (!name || name.trim() === '') {
    return { error: 'El nombre de la institución es requerido' };
  }

  try {
    const checkRes = await pool.query(
      'SELECT id FROM institutions WHERE LOWER(name) = $1 AND id != $2', 
      [name.trim().toLowerCase(), id]
    );
    if (checkRes.rows.length > 0) {
      return { error: 'Ya existe otra institución con este nombre' };
    }

    await pool.query(
      `UPDATE institutions 
       SET name = $1, quota_dental = $2, quota_xray = $3, updated_at = NOW() 
       WHERE id = $4`,
      [name.trim(), quotaDental, quotaXray, id]
    );

    revalidatePath('/dashboard/users');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error updating institution:', error);
    return { error: 'Error del servidor al actualizar la institución' };
  }
}

export async function deleteInstitutionAction(id: number) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'No autorizado para realizar esta acción' };
  }

  try {
    await pool.query('DELETE FROM institutions WHERE id = $1', [id]);
    revalidatePath('/dashboard/users');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error deleting institution:', error);
    return { error: 'Error del servidor al eliminar la institución' };
  }
}
