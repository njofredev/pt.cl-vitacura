import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import * as bcrypt from 'bcryptjs';
import pool from './db';
import { logAuditAction } from '@/app/actions/auditActions';

const JWT_SECRET = process.env.JWT_SECRET || 'tabancura_default_super_secret_key_change_me_in_prod';
const key = new TextEncoder().encode(JWT_SECRET);

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'internal' | 'external' | 'reader';
  institutionName?: string;
  institution_ids?: number[];
}

export async function encrypt(payload: UserSession) {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(key);
}

export async function decrypt(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as unknown as UserSession;
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return null;
    return await decrypt(token);
  } catch (error) {
    // Return a system session when executed outside a request scope (e.g., cron jobs, background sync, or test scripts)
    return {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'System Sync Bot',
      email: 'system@tabancura.cl',
      role: 'admin',
      institution_ids: []
    };
  }
}

export async function loginUser(email: string, password: string): Promise<{ success: boolean; error?: string; user?: UserSession }> {
  try {
    const res = await pool.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.role, u.active, u.institution_ids, i.name as institution_name 
       FROM users u 
       LEFT JOIN institutions i ON u.institution_id = i.id 
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );

    if (res.rows.length === 0) {
      await logAuditAction('LOGIN_FAILED', { email, reason: 'Usuario no encontrado' });
      return { success: false, error: 'Credenciales inválidas' };
    }

    const user = res.rows[0];

    if (!user.active) {
      await logAuditAction('LOGIN_FAILED', { email, reason: 'Cuenta desactivada' });
      return { success: false, error: 'Esta cuenta ha sido desactivada' };
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      await logAuditAction('LOGIN_FAILED', { email, reason: 'Contraseña incorrecta' });
      return { success: false, error: 'Credenciales inválidas' };
    }

    const sessionUser: UserSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'admin' | 'internal' | 'external' | 'reader',
      institutionName: user.institution_name || undefined,
      institution_ids: user.institution_ids || [],
    };

    // Create session cookie
    const token = await encrypt(sessionUser);
    const cookieStore = await cookies();
    
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    await logAuditAction('LOGIN_SUCCESS', null, { id: user.id, name: user.name, email: user.email });
    return { success: true, user: sessionUser };
  } catch (error) {
    console.error('Login error:', error);
    await logAuditAction('LOGIN_ERROR', { email, error: String(error) });
    return { success: false, error: 'Error del servidor al iniciar sesión' };
  }
}

export async function logoutUser() {
  await logAuditAction('LOGOUT');
  const cookieStore = await cookies();
  cookieStore.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
