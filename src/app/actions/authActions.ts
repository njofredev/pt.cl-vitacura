'use strict';
'use server';

import { loginUser, logoutUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

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
