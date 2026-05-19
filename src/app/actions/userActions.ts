'use strict';
'use server';

import pool from '@/lib/db';
import * as bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createUserAction(formData: FormData) {
  const session = await getSession();
  
  if (!session || session.role !== 'admin') {
    return { error: 'No autorizado para realizar esta acción' };
  }

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as 'admin' | 'internal' | 'external';

  if (!name || !email || !password || !role) {
    return { error: 'Por favor complete todos los campos requeridos' };
  }

  try {
    // Check if email already exists
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (emailCheck.rows.length > 0) {
      return { error: 'El correo electrónico ya está registrado' };
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    await pool.query(`
      INSERT INTO users (name, email, password_hash, role, active)
      VALUES ($1, $2, $3, $4, $5)
    `, [name.trim(), email.toLowerCase().trim(), passwordHash, role, true]);

    revalidatePath('/dashboard/users');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error creating user:', error);
    return { error: 'Error del servidor al crear el usuario' };
  }
}

export async function toggleUserStatusAction(userId: string, currentStatus: boolean) {
  const session = await getSession();
  
  if (!session || session.role !== 'admin') {
    return { error: 'No autorizado para realizar esta acción' };
  }

  // Prevent self-deactivation
  if (userId === session.id) {
    return { error: 'No puedes desactivar tu propia cuenta' };
  }

  try {
    await pool.query('UPDATE users SET active = $1 WHERE id = $2', [!currentStatus, userId]);
    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error) {
    console.error('Error toggling user status:', error);
    return { error: 'Error del servidor al cambiar el estado del usuario' };
  }
}
