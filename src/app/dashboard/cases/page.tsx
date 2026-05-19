import { getSession } from '@/lib/auth';
import pool from '@/lib/db';
import { redirect } from 'next/navigation';
import CaseListClient from '@/components/CaseListClient';

export const dynamic = 'force-dynamic';

export default async function CasesPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  let cases: any[] = [];

  try {
    if (session.role === 'admin' || session.role === 'internal') {
      // Admins and Internals see all cases from all registration sources
      const res = await pool.query(`
        SELECT c.id, p.rut, p.first_names, p.last_names, p.nationality, p.birth_date, p.commune, p.email, p.mobile, 
               c.description, c.status, c.observations, c.created_at, 
               u_reg.name as registered_by_name, u_eval.name as evaluator_name
        FROM cases c
        JOIN persons p ON c.person_id = p.id
        LEFT JOIN users u_reg ON p.registered_by = u_reg.id
        LEFT JOIN users u_eval ON c.updated_by = u_eval.id
        ORDER BY c.created_at DESC
      `);
      cases = res.rows;
    } else if (session.role === 'external') {
      // Externals see only the cases registered by themselves
      const res = await pool.query(`
        SELECT c.id, p.rut, p.first_names, p.last_names, p.nationality, p.birth_date, p.commune, p.email, p.mobile, 
               c.description, c.status, c.observations, c.created_at, 
               u_reg.name as registered_by_name, u_eval.name as evaluator_name
        FROM cases c
        JOIN persons p ON c.person_id = p.id
        LEFT JOIN users u_reg ON p.registered_by = u_reg.id
        LEFT JOIN users u_eval ON c.updated_by = u_eval.id
        WHERE p.registered_by = $1
        ORDER BY c.created_at DESC
      `, [session.id]);
      cases = res.rows;
    }
  } catch (error) {
    console.error('Error fetching cases in server page:', error);
  }

  return (
    <CaseListClient 
      initialCases={cases} 
      user={session} 
    />
  );
}
