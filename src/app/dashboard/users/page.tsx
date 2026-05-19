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

  // Fetch all administrative users from PostgreSQL
  let users: any[] = [];
  try {
    const res = await pool.query(`
      SELECT id, name, email, role, active, created_at 
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
