'use strict';
'use server';

import { loginUser, logoutUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import pool from '@/lib/db';

export async function checkEmailExists(email: string): Promise<{ success: boolean; error?: string }> {
  if (!email) {
    return { success: false, error: 'Por favor ingrese un correo' };
  }
  
  try {
    const res = await pool.query(
      `SELECT id FROM users WHERE email = $1 AND active = true`,
      [email.toLowerCase().trim()]
    );
    
    if (res.rows.length === 0) {
      return { success: false, error: 'El correo no coincide con ninguna cuenta activa' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error checking email:', error);
    return { success: false, error: 'Error del servidor al buscar la cuenta' };
  }
}

export async function handleLogin(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Por favor complete todos los campos' };
  }

  const result = await loginUser(email, password);

  if (!result.success) {
    return { error: result.error || 'Error al iniciar sesión' };
  }

  // Redirect to dashboard on success
  redirect('/dashboard');
}

export async function handleLogout() {
  await logoutUser();
  redirect('/login');
}
