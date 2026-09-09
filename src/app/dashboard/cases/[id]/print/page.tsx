import { getSession } from '@/lib/auth';
import pool from '@/lib/db';
import { redirect } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import PrintViewerClient from '@/components/PrintViewerClient';
import { getCaseDentalinkFilesAction, getCaseDentalinkEvolutionsAction } from '@/app/actions/caseActions';

export default async function PrintCasePage({ params }: { params: { id: string } }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const { id } = await params;

  let caseData;
  let dentalinkFiles: any[] = [];
  let dentalinkEvolutions: any[] = [];

  try {
    const res = await pool.query(`
      WITH global_cases AS (
        SELECT 
          c.*, 
          p.rut, p.first_names, p.last_names, p.nationality, p.birth_date, p.commune, p.email as person_email, p.mobile,
          u.name as registered_by_name,
          ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM c.created_at) ORDER BY c.created_at ASC) as yearly_correlative
        FROM cases c
        JOIN persons p ON c.person_id = p.id
        LEFT JOIN users u ON c.registered_by = u.id
      )
      SELECT * FROM global_cases
      WHERE id = $1
    `, [id]);

    if (res.rows.length === 0) {
      return <div style={{ padding: '40px', textAlign: 'center', color: 'white', fontWeight: 600 }}>Caso no encontrado</div>;
    }
    caseData = res.rows[0];

    // Additional security check: external users can only see their own registrations
    if (session.role === 'external' && caseData.registered_by !== session.id) {
      return <div style={{ padding: '40px', textAlign: 'center', color: 'white', fontWeight: 600 }}>No autorizado para ver este caso</div>;
    }

    if (caseData.status === 'finalizado') {
      const [filesRes, evRes] = await Promise.all([
        getCaseDentalinkFilesAction(caseData.id),
        getCaseDentalinkEvolutionsAction(caseData.id)
      ]);
      if (filesRes.success && filesRes.files) {
        dentalinkFiles = filesRes.files;
      }
      if (evRes.success && evRes.evolutions) {
        dentalinkEvolutions = evRes.evolutions;
      }
    }
  } catch (error) {
    console.error('Error fetching case:', error);
    return <div style={{ padding: '40px', textAlign: 'center', color: 'white', fontWeight: 600 }}>Error al cargar los datos del caso.</div>;
  }

  return (
    <PrintViewerClient 
      caseData={caseData} 
      userRole={session.role} 
      dentalinkFiles={dentalinkFiles} 
      dentalinkEvolutions={dentalinkEvolutions} 
    />
  );
}
