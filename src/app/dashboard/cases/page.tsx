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
    if (session.role === 'admin') {
      // Admins see all cases from all registration sources
      const res = await pool.query(`
        WITH global_cases AS (
          SELECT c.id, p.rut, p.first_names, p.last_names, p.nationality, p.birth_date, p.commune, p.email, p.mobile, 
                 c.description, c.medical_center, c.agreement_type, c.dental_diagnosis, c.treatment_needed, c.professional_name,
                 c.status, c.observations, c.created_at, c.dental_count, c.xray_count, c.status_history,
                 u_reg.name as registered_by_name, u_eval.name as evaluator_name,
                 ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM c.created_at) ORDER BY c.created_at ASC) as yearly_correlative
          FROM cases c
          JOIN persons p ON c.person_id = p.id
          LEFT JOIN users u_reg ON c.registered_by = u_reg.id
          LEFT JOIN users u_eval ON c.updated_by = u_eval.id
        )
        SELECT * FROM global_cases
        ORDER BY created_at DESC
      `);
      cases = res.rows;
    } else if (session.role === 'internal') {
      // Internals see only cases belonging to their assigned institutions
      const res = await pool.query(`
        WITH global_cases AS (
          SELECT c.id, p.rut, p.first_names, p.last_names, p.nationality, p.birth_date, p.commune, p.email, p.mobile, 
                 c.description, c.medical_center, c.agreement_type, c.dental_diagnosis, c.treatment_needed, c.professional_name,
                 c.status, c.observations, c.created_at, c.dental_count, c.xray_count, c.status_history,
                 u_reg.name as registered_by_name, u_eval.name as evaluator_name,
                 u_reg.institution_id as registered_by_institution_id,
                 ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM c.created_at) ORDER BY c.created_at ASC) as yearly_correlative
          FROM cases c
          JOIN persons p ON c.person_id = p.id
          LEFT JOIN users u_reg ON c.registered_by = u_reg.id
          LEFT JOIN users u_eval ON c.updated_by = u_eval.id
        )
        SELECT * FROM global_cases
        WHERE registered_by_institution_id = ANY(SELECT unnest(institution_ids) FROM users WHERE id = $1)
        ORDER BY created_at DESC
      `, [session.id]);
      cases = res.rows;
    } else if (session.role === 'external' || session.role === 'reader') {
      // Externals and Readers see cases registered by anyone from the same institution (or fallback to themselves if they have no institution)
      const res = await pool.query(`
        WITH global_cases AS (
          SELECT c.id, p.rut, p.first_names, p.last_names, p.nationality, p.birth_date, p.commune, p.email, p.mobile, 
                 c.description, c.medical_center, c.agreement_type, c.dental_diagnosis, c.treatment_needed, c.professional_name,
                 c.status, c.observations, c.created_at, c.dental_count, c.xray_count, c.status_history,
                 c.registered_by,
                 u_reg.name as registered_by_name, u_eval.name as evaluator_name,
                 u_reg.institution_id as registered_by_institution_id,
                 ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM c.created_at) ORDER BY c.created_at ASC) as yearly_correlative
          FROM cases c
          JOIN persons p ON c.person_id = p.id
          LEFT JOIN users u_reg ON c.registered_by = u_reg.id
          LEFT JOIN users u_eval ON c.updated_by = u_eval.id
        )
        SELECT * FROM global_cases
        WHERE registered_by_institution_id = (SELECT institution_id FROM users WHERE id = $1)
           OR (registered_by = $1 AND (SELECT institution_id FROM users WHERE id = $1) IS NULL)
        ORDER BY created_at DESC
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
