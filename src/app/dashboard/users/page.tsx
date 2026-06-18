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
  let institutions: any[] = [];
  try {
    const res = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.active, u.created_at,
             u.professional_title, u.professional_position, u.professional_email,
             u.professional_address, u.professional_website, u.professional_phone,
             u.medical_center, u.agreement_type, u.quota_dental, u.quota_xray, u.used_dental, u.used_xray,
             u.institution_id, u.institution_ids, i.name as institution_name,
             i.quota_dental as inst_quota_dental, i.quota_xray as inst_quota_xray,
             i.used_dental as inst_used_dental, i.used_xray as inst_used_xray
      FROM users u
      LEFT JOIN institutions i ON u.institution_id = i.id
      ORDER BY u.created_at DESC
    `);
    users = res.rows;

    const instRes = await pool.query('SELECT id, name, quota_dental, quota_xray, used_dental, used_xray FROM institutions ORDER BY name ASC');
    institutions = instRes.rows;
  } catch (error) {
    console.error('Error fetching users/institutions in server page:', error);
  }

  return (
    <UserListClient 
      initialUsers={users} 
      currentUserId={session.id} 
      initialInstitutions={institutions}
    />
  );
}
