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

  const professionalTitle = formData.get('professional_title') as string;
  const professionalPosition = formData.get('professional_position') as string;
  const professionalEmail = formData.get('professional_email') as string;
  const professionalAddress = formData.get('professional_address') as string;
  const professionalWebsite = formData.get('professional_website') as string;
  const professionalPhone = formData.get('professional_phone') as string;
  const medicalCenter = formData.get('medical_center') as string;
  const agreementType = formData.get('agreement_type') as string;

  const quotaDental = parseInt(formData.get('quota_dental') as string || '0', 10);
  const quotaXray = parseInt(formData.get('quota_xray') as string || '0', 10);

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
      INSERT INTO users (
        name, email, password_hash, role, active, password_plain,
        professional_title, professional_position, professional_email,
        professional_address, professional_website, professional_phone,
        medical_center, agreement_type, quota_dental, quota_xray, used_dental, used_xray
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 0, 0)
    `, [
      name.trim(), 
      email.toLowerCase().trim(), 
      passwordHash, 
      role, 
      true, 
      password,
      professionalTitle ? professionalTitle.trim() : null,
      professionalPosition ? professionalPosition.trim() : null,
      professionalEmail ? professionalEmail.toLowerCase().trim() : null,
      professionalAddress ? professionalAddress.trim() : null,
      professionalWebsite ? professionalWebsite.trim() : null,
      professionalPhone ? professionalPhone.trim() : null,
      medicalCenter ? medicalCenter.trim() : null,
      agreementType ? agreementType.trim() : null,
      quotaDental,
      quotaXray
    ]);

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

export async function getCurrentUserAction() {
  const session = await getSession();
  if (!session) {
    return { error: 'No autenticado' };
  }
  try {
    const res = await pool.query(
      `SELECT id, name, email, role, active,
              professional_title, professional_position, professional_email,
              professional_address, professional_website, professional_phone,
              medical_center, agreement_type, quota_dental, quota_xray, used_dental, used_xray
       FROM users 
       WHERE id = $1`,
      [session.id]
    );
    if (res.rows.length === 0) {
      return { error: 'Usuario no encontrado' };
    }
    return { success: true, user: res.rows[0] };
  } catch (error) {
    console.error('Error fetching current user:', error);
    return { error: 'Error del servidor' };
  }
}

export async function updateUserAction(userId: string, formData: FormData) {
  const session = await getSession();
  
  if (!session || session.role !== 'admin') {
    return { error: 'No autorizado para realizar esta acción' };
  }

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const role = formData.get('role') as 'admin' | 'internal' | 'external';
  const password = formData.get('password') as string;

  const professionalTitle = formData.get('professional_title') as string;
  const professionalPosition = formData.get('professional_position') as string;
  const professionalEmail = formData.get('professional_email') as string;
  const professionalAddress = formData.get('professional_address') as string;
  const professionalWebsite = formData.get('professional_website') as string;
  const professionalPhone = formData.get('professional_phone') as string;
  const medicalCenter = formData.get('medical_center') as string;
  const agreementType = formData.get('agreement_type') as string;

  const quotaDental = parseInt(formData.get('quota_dental') as string || '0', 10);
  const quotaXray = parseInt(formData.get('quota_xray') as string || '0', 10);

  if (!name || !email || !role) {
    return { error: 'Por favor complete todos los campos requeridos (Nombre, Correo, Rol)' };
  }

  try {
    // Check if email already exists for another user
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id <> $2', [email.toLowerCase().trim(), userId]);
    if (emailCheck.rows.length > 0) {
      return { error: 'El correo electrónico ya está registrado por otro usuario' };
    }

    if (password && password.trim() !== '') {
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      await pool.query(`
        UPDATE users 
        SET 
          name = $1, 
          email = $2, 
          role = $3, 
          password_hash = $4,
          password_plain = $5,
          professional_title = $6,
          professional_position = $7,
          professional_email = $8,
          professional_address = $9,
          professional_website = $10,
          professional_phone = $11,
          medical_center = $12,
          agreement_type = $13,
          quota_dental = $14,
          quota_xray = $15,
          updated_at = NOW()
        WHERE id = $16
      `, [
        name.trim(), 
        email.toLowerCase().trim(), 
        role, 
        passwordHash, 
        password,
        professionalTitle ? professionalTitle.trim() : null,
        professionalPosition ? professionalPosition.trim() : null,
        professionalEmail ? professionalEmail.toLowerCase().trim() : null,
        professionalAddress ? professionalAddress.trim() : null,
        professionalWebsite ? professionalWebsite.trim() : null,
        professionalPhone ? professionalPhone.trim() : null,
        medicalCenter ? medicalCenter.trim() : null,
        agreementType ? agreementType.trim() : null,
        quotaDental,
        quotaXray,
        userId
      ]);
    } else {
      await pool.query(`
        UPDATE users 
        SET 
          name = $1, 
          email = $2, 
          role = $3, 
          professional_title = $4,
          professional_position = $5,
          professional_email = $6,
          professional_address = $7,
          professional_website = $8,
          professional_phone = $9,
          medical_center = $10,
          agreement_type = $11,
          quota_dental = $12,
          quota_xray = $13,
          updated_at = NOW()
        WHERE id = $14
      `, [
        name.trim(), 
        email.toLowerCase().trim(), 
        role, 
        professionalTitle ? professionalTitle.trim() : null,
        professionalPosition ? professionalPosition.trim() : null,
        professionalEmail ? professionalEmail.toLowerCase().trim() : null,
        professionalAddress ? professionalAddress.trim() : null,
        professionalWebsite ? professionalWebsite.trim() : null,
        professionalPhone ? professionalPhone.trim() : null,
        medicalCenter ? medicalCenter.trim() : null,
        agreementType ? agreementType.trim() : null,
        quotaDental,
        quotaXray,
        userId
      ]);
    }

    revalidatePath('/dashboard/users');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { error: 'Error del servidor al actualizar el usuario' };
  }
}
