import { getSession } from '@/lib/auth';
import pool from '@/lib/db';
import { redirect } from 'next/navigation';
import UserListClient from '@/components/UserListClient';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Double security check (Admin only page)
  if (session.role !== 'admin') {
    redirect('/dashboard');
  }

  let users: any[] = [];
  try {
    const res = await pool.query(`
      SELECT id, name, email, role, active, created_at,
             professional_title, professional_position, professional_email,
             professional_address, professional_website, professional_phone,
             medical_center, agreement_type, quota_dental, quota_xray, used_dental, used_xray
      FROM users 
      ORDER BY created_at DESC
    `);
    users = res.rows;
  } catch (error) {
    console.error('Error fetching users in server page:', error);
  }

  return (
    <UserListClient 
      initialUsers={users} 
      currentUserId={session.id} 
    />
  );
}
