import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import * as bcrypt from 'bcryptjs';
import pool from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'tabancura_default_super_secret_key_change_me_in_prod';
const key = new TextEncoder().encode(JWT_SECRET);

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'internal' | 'external';
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
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return await decrypt(token);
}

export async function loginUser(email: string, password: string): Promise<{ success: boolean; error?: string; user?: UserSession }> {
  try {
    const res = await pool.query(
      `SELECT id, name, email, password_hash, role, active FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (res.rows.length === 0) {
      return { success: false, error: 'Credenciales inválidas' };
    }

    const user = res.rows[0];

    if (!user.active) {
      return { success: false, error: 'Esta cuenta ha sido desactivada' };
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return { success: false, error: 'Credenciales inválidas' };
    }

    const sessionUser: UserSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'admin' | 'internal' | 'external',
    };

    // Create session cookie
    const token = await encrypt(sessionUser);
    const cookieStore = await cookies();
    
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return { success: true, user: sessionUser };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Error del servidor al iniciar sesión' };
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
