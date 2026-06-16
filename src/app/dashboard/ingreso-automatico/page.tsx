import { getSession } from '@/lib/auth';
import pool from '@/lib/db';
import { redirect } from 'next/navigation';
import AutomaticEntryClient from '../../../components/AutomaticEntryClient';

export const dynamic = 'force-dynamic';

export default async function IngresoAutomaticoPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Restrict to authorized users (admin and internal roles only)
  if (session.role !== 'admin' && session.role !== 'internal') {
    redirect('/dashboard');
  }

  let cases: any[] = [];

  try {
    const res = await pool.query(`
      WITH global_cases AS (
        SELECT c.id, p.rut, p.first_names, p.last_names, p.nationality, p.birth_date, p.commune, p.email, p.mobile, 
               c.description, c.medical_center, c.agreement_type, c.dental_diagnosis, c.treatment_needed, c.professional_name,
               c.status, c.observations, c.created_at, 
               u_reg.name as registered_by_name,
               ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM c.created_at) ORDER BY c.created_at ASC) as yearly_correlative
        FROM cases c
        JOIN persons p ON c.person_id = p.id
        LEFT JOIN users u_reg ON c.registered_by = u_reg.id
      )
      SELECT * FROM global_cases
      ORDER BY created_at DESC
    `);
    cases = res.rows;
  } catch (error) {
    console.error('Error fetching cases for automatic check:', error);
  }

  return (
    <AutomaticEntryClient 
      initialCases={cases} 
    />
  );
}
