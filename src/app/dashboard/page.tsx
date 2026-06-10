import { getSession } from '@/lib/auth';
import pool from '@/lib/db';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { redirect } from 'next/navigation';
import TrendChartClient from '@/components/TrendChartClient';

export default async function DashboardPage() {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  // Fetch metrics based on role
  let stats = {
    totalCases: 0,
    pendingCases: 0,
    inRevisionCases: 0,
    approvedCases: 0,
    rejectedCases: 0,
    totalUsers: 0, // Admin only
  };

  let recentCases: any[] = [];

  // SQL queries with fallback/error boundaries
  try {
    if (user.role === 'admin') {
      const casesCountRes = await pool.query('SELECT COUNT(*) FROM cases');
      stats.totalCases = parseInt(casesCountRes.rows[0].count);

      const statusRes = await pool.query('SELECT status, COUNT(*) FROM cases GROUP BY status');
      statusRes.rows.forEach((row: any) => {
        if (row.status === 'ingresado') stats.pendingCases = parseInt(row.count);
        if (row.status === 'agendado') stats.inRevisionCases = parseInt(row.count);
        if (row.status === 'en_tratamiento') stats.approvedCases = parseInt(row.count);
        if (row.status === 'finalizado') stats.rejectedCases = parseInt(row.count);
      });

      const usersCountRes = await pool.query('SELECT COUNT(*) FROM users');
      stats.totalUsers = parseInt(usersCountRes.rows[0].count);

      const recentRes = await pool.query(`
        WITH global_cases AS (
          SELECT c.id, p.first_names, p.last_names, c.description, c.status, c.created_at, u.name as registered_by_name,
                 ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM c.created_at) ORDER BY c.created_at ASC) as yearly_correlative
          FROM cases c 
          JOIN persons p ON c.person_id = p.id 
          LEFT JOIN users u ON c.registered_by = u.id
        )
        SELECT * FROM global_cases
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      recentCases = recentRes.rows;

    } else if (user.role === 'internal') {
      const casesCountRes = await pool.query('SELECT COUNT(*) FROM cases');
      stats.totalCases = parseInt(casesCountRes.rows[0].count);

      const statusRes = await pool.query('SELECT status, COUNT(*) FROM cases GROUP BY status');
      statusRes.rows.forEach((row: any) => {
        if (row.status === 'ingresado') stats.pendingCases = parseInt(row.count);
        if (row.status === 'agendado') stats.inRevisionCases = parseInt(row.count);
        if (row.status === 'en_tratamiento') stats.approvedCases = parseInt(row.count);
        if (row.status === 'finalizado') stats.rejectedCases = parseInt(row.count);
      });

      const recentRes = await pool.query(`
        WITH global_cases AS (
          SELECT c.id, p.first_names, p.last_names, c.description, c.status, c.created_at, u.name as registered_by_name,
                 ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM c.created_at) ORDER BY c.created_at ASC) as yearly_correlative
          FROM cases c 
          JOIN persons p ON c.person_id = p.id 
          LEFT JOIN users u ON c.registered_by = u.id
        )
        SELECT * FROM global_cases
        WHERE status = 'ingresado'
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      recentCases = recentRes.rows;

    } else if (user.role === 'external') {
      const casesCountRes = await pool.query(`
        SELECT COUNT(*) 
        FROM cases c 
        WHERE c.registered_by = $1
      `, [user.id]);
      stats.totalCases = parseInt(casesCountRes.rows[0].count);

      const statusRes = await pool.query(`
        SELECT c.status, COUNT(*) 
        FROM cases c 
        WHERE c.registered_by = $1
        GROUP BY c.status
      `, [user.id]);

      statusRes.rows.forEach((row: any) => {
        if (row.status === 'ingresado') stats.pendingCases = parseInt(row.count);
        if (row.status === 'agendado') stats.inRevisionCases = parseInt(row.count);
        if (row.status === 'en_tratamiento') stats.approvedCases = parseInt(row.count);
        if (row.status === 'finalizado') stats.rejectedCases = parseInt(row.count);
      });

      const recentRes = await pool.query(`
        WITH global_cases AS (
          SELECT c.id, p.first_names, p.last_names, c.description, c.status, c.created_at, c.registered_by,
                 ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM c.created_at) ORDER BY c.created_at ASC) as yearly_correlative
          FROM cases c 
          JOIN persons p ON c.person_id = p.id 
        )
        SELECT * FROM global_cases
        WHERE registered_by = $1
        ORDER BY created_at DESC 
        LIMIT 5
      `, [user.id]);
      recentCases = recentRes.rows;
    }
  } catch (error) {
    console.error('Error fetching dashboard base stats:', error);
  }
  // 1. Rendimiento Derivación Query
  let topProfessional = 'Sin derivaciones';
  let topProfessionalCount = 0;
  let topProfessionalSub = 'No se registran derivaciones';
  try {
    const topProfRes = await pool.query(`
      SELECT u.name, COUNT(c.id) as count
      FROM cases c
      JOIN users u ON c.registered_by = u.id
      GROUP BY u.name
      ORDER BY count DESC
      LIMIT 1
    `);
    if (topProfRes.rows.length > 0) {
      topProfessional = topProfRes.rows[0].name;
      topProfessionalCount = parseInt(topProfRes.rows[0].count);
      topProfessionalSub = `Lidera con ${topProfessionalCount} casos ingresados`;
    } else if (user.role === 'external' && stats.totalCases > 0) {
      topProfessional = user.name;
      topProfessionalCount = stats.totalCases;
      topProfessionalSub = `Lidera con ${topProfessionalCount} casos ingresados`;
    }
  } catch (err) {
    console.error('Error fetching top professional:', err);
  }

  // 2. Convenio Preferido Query
  let topAgreement = 'Sin convenios';
  let topAgreementCount = 0;
  let topAgreementSub = 'No hay derivaciones con convenio';
  try {
    const topAgresRes = await pool.query(`
      SELECT agreement_type, COUNT(id) as count
      FROM cases
      WHERE agreement_type IS NOT NULL AND agreement_type != ''
      GROUP BY agreement_type
      ORDER BY count DESC
      LIMIT 1
    `);
    if (topAgresRes.rows.length > 0) {
      topAgreement = topAgresRes.rows[0].agreement_type;
      topAgreementCount = parseInt(topAgresRes.rows[0].count);
      topAgreementSub = `${topAgreementCount} pacientes derivados`;
    }
  } catch (err) {
    console.error('Error fetching top agreement:', err);
  }

  // 3. Peak de Solicitudes Query
  let peakDateStr = 'Sin registros';
  let peakDateCount = 0;
  let peakDateSub = 'No hay registros en el sistema';
  try {
    const peakRes = await pool.query(`
      SELECT DATE(created_at) as peak_date, COUNT(id) as count
      FROM cases
      GROUP BY DATE(created_at)
      ORDER BY count DESC
      LIMIT 1
    `);
    if (peakRes.rows.length > 0) {
      const dateVal = new Date(peakRes.rows[0].peak_date);
      peakDateCount = parseInt(peakRes.rows[0].count);
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      peakDateStr = `${days[dateVal.getDay()]}, ${dateVal.getDate()} ${months[dateVal.getMonth()]}`;
      peakDateSub = `Peak de ${peakDateCount} registros`;
    }
  } catch (err) {
    console.error('Error fetching peak date:', err);
  }

  // 4. Fetch all case dates for interactive client-side Trend Chart
  let caseDates: string[] = [];
  try {
    const datesRes = await pool.query(`
      SELECT created_at
      FROM cases
      ${user.role === 'external' ? 'WHERE registered_by = $1' : ''}
      ORDER BY created_at ASC
    `, user.role === 'external' ? [user.id] : []);
    caseDates = datesRes.rows.map((row: any) => new Date(row.created_at).toISOString());
  } catch (err) {
    console.error('Error fetching case dates for trend:', err);
  }

  // 5. Workflow State counts
  const isDemoData = false;
  const stateCounts = { pending: stats.pendingCases, inRevision: stats.inRevisionCases, approved: stats.approvedCases, rejected: stats.rejectedCases };

  // Calculate Bar Heights for Workflow Chart
  const maxStateVal = Math.max(stateCounts.pending, stateCounts.inRevision, stateCounts.approved, stateCounts.rejected, 5);
  const barHeights = {
    pending: (stateCounts.pending / maxStateVal) * 130,
    inRevision: (stateCounts.inRevision / maxStateVal) * 130,
    approved: (stateCounts.approved / maxStateVal) * 130,
    rejected: (stateCounts.rejected / maxStateVal) * 130,
  };

  // 6. Commune distribution calculation
  let communeData: { label: string; count: number; color: string }[] = [];
  try {
    const communeRes = await pool.query(`
      SELECT p.commune as label, COUNT(c.id) as count
      FROM cases c
      JOIN persons p ON c.person_id = p.id
      ${user.role === 'external' ? 'WHERE c.registered_by = $1' : ''}
      GROUP BY p.commune
      ORDER BY count DESC
      LIMIT 4
    `, user.role === 'external' ? [user.id] : []);

    communeData = communeRes.rows.map((row: any) => ({
      label: row.label,
      count: parseInt(row.count),
      color: '#000'
    }));
  } catch (err) {
    console.error('Error fetching commune data:', err);
  }

  if (communeData.length > 0) {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#a855f7'];
    communeData = communeData.map((item, idx) => ({
      ...item,
      color: colors[idx % colors.length]
    }));
  }

  const communeTotalVal = communeData.reduce((acc, curr) => acc + curr.count, 0);
  let accumulatedLength = 0;
  const donutSegments = communeData.map((item) => {
    const percent = communeTotalVal > 0 ? (item.count / communeTotalVal) * 100 : 0;
    const strokeLength = (percent / 100) * 439.82;
    const strokeOffset = -accumulatedLength;
    accumulatedLength += strokeLength;
    return {
      ...item,
      percent,
      strokeLength,
      strokeOffset
    };
  });

  const roleLabels = {
    admin: 'Administrador General',
    internal: 'Administrativo Interno',
    external: 'Profesional Derivador',
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px', paddingBottom: '40px' }}>

      {/* Injected style overrides for clinical laboratory theme styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .telemetry-card {
          border: 1px solid var(--glass-border);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.005) 100%), var(--glass-bg);
          border-radius: var(--radius-md);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: var(--shadow-sm);
        }
        .telemetry-card:hover {
          transform: translateY(-4px);
          border-color: rgba(16, 185, 129, 0.35);
          box-shadow: 0 12px 30px rgba(16, 185, 129, 0.08);
        }
        .chart-toggle-btn {
          padding: 6px 12px;
          border-radius: 9999px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid var(--glass-border);
          background: rgba(255, 255, 255, 0.02);
          color: hsl(var(--foreground-hsl));
          opacity: 0.7;
        }
        .chart-toggle-btn.active {
          background: #10b981;
          color: #022c22;
          border-color: #10b981;
          opacity: 1;
          box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);
        }
        .chart-toggle-btn:hover:not(.active) {
          background: rgba(255, 255, 255, 0.05);
          opacity: 1;
        }
        .clinical-table tr:hover td {
          background: rgba(16, 185, 129, 0.03) !important;
        }
        .quick-action-link {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-radius: var(--radius-md);
          background-color: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          color: inherit;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .quick-action-link.green:hover {
          background-color: rgba(16, 185, 129, 0.03) !important;
          border-color: rgba(16, 185, 129, 0.2) !important;
        }
        .quick-action-link.blue:hover {
          background-color: rgba(59, 130, 246, 0.03) !important;
          border-color: rgba(59, 130, 246, 0.2) !important;
        }
        .quick-action-link.purple:hover {
          background-color: rgba(168, 85, 247, 0.03) !important;
          border-color: rgba(168, 85, 247, 0.2) !important;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 30px;
        }
        @media (min-width: 1200px) {
          .dashboard-grid {
            grid-template-columns: 7fr 3fr;
          }
        }
        .dashboard-main-col {
          display: flex;
          flex-direction: column;
          gap: 30px;
          min-width: 0;
        }
        .dashboard-side-col {
          display: flex;
          flex-direction: column;
          gap: 30px;
          min-width: 0;
        }
      ` }} />

      {/* Top Clinical Header Panel */}
      <div
        className="glass-panel"
        style={{
          padding: '30px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(20, 184, 166, 0.02) 100%), var(--glass-bg)',
          flexWrap: 'wrap',
          gap: '20px',
          borderLeft: '4px solid #10b981'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: 800, margin: 0 }}>
              Dashboard Derivación Digital
            </h2>
            <p style={{ opacity: 0.6, margin: 0, fontWeight: 500, fontSize: '0.95rem', maxWidth: '700px' }}>
              Visualización integrada de la red asistencial entre Policlínico Tabancura y Municipalidad de Vitacura. Convenios de derivación preferencial a costo cero.
            </p>
          </div>
        </div>

        {(user.role === 'admin' || user.role === 'external') && (
          <Link href="/dashboard/register" className="premium-action-btn">
            Nueva Derivación
            <div className="btn-badge">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
            </div>
          </Link>
        )}
      </div>

      {/* Main Grid: Left Column for metrics and data, Right Column for active controls */}
      <div className="dashboard-grid">

        {/* LEFT COLUMN: Telemetry & Records */}
        <div className="dashboard-main-col">

          {/* Row of SQL-Driven KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px'
          }}>
            {/* KPI 1: Volumen Total */}
            <div className="telemetry-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Volumen Total
                </span>
                <div style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '8px', borderRadius: '50%' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '2.4rem', fontWeight: 850, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: 'hsl(var(--foreground-hsl))' }}>
                  {stats.totalCases}
                </span>
                <span style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 600 }}>
                  {isDemoData ? 'Casos de demostración clínica' : 'Derivaciones ingresadas'}
                </span>
              </div>
            </div>

            {/* KPI 2: Rendimiento Derivación */}
            <div className="telemetry-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Rendimiento Derivación
                </span>
                <div style={{ color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.08)', padding: '8px', borderRadius: '50%' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                <span style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  color: 'hsl(var(--foreground-hsl))',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: '2.4rem',
                  height: '2.4rem'
                }} title={topProfessional}>
                  {topProfessional}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700 }}>
                  {topProfessionalSub}
                </span>
              </div>
            </div>

            {/* KPI 3: Convenio Preferido */}
            <div className="telemetry-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Convenio Preferido
                </span>
                <div style={{ color: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.08)', padding: '8px', borderRadius: '50%' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" /></svg>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                <span style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  color: 'hsl(var(--foreground-hsl))',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: '2.4rem',
                  height: '2.4rem'
                }} title={topAgreement}>
                  {topAgreement}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 700 }}>
                  {topAgreementSub}
                </span>
              </div>
            </div>

            {/* KPI 4: Peak de Solicitudes */}
            <div className="telemetry-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Peak de Solicitudes
                </span>
                <div style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)', padding: '8px', borderRadius: '50%' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                <span style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  color: 'hsl(var(--foreground-hsl))',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: '2.4rem',
                  height: '2.4rem'
                }} title={peakDateStr}>
                  {peakDateStr}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>
                  {peakDateSub}
                </span>
              </div>
            </div>
          </div>

          {/* Temporal Trend Line Chart */}
          <TrendChartClient caseDates={caseDates} isDemoData={isDemoData} />


          {/* Left Sub-panel: Flujo de Trabajo por Estado */}
          <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', fontWeight: 700, margin: 0, color: 'hsl(var(--foreground-hsl))', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3b82f6' }}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Flujo de Trabajo por Estado
              </h3>
              <span style={{ fontSize: '0.78rem', opacity: 0.5, fontWeight: 500 }}>
                Distribución actual de las solicitudes según estado de revisión
              </span>
            </div>

            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <svg viewBox="0 0 320 200" width="100%" height="200" style={{ display: 'block', maxWidth: '320px' }}>
                {/* Baseline axis */}
                <line x1="30" y1="160" x2="290" y2="160" stroke="var(--glass-border)" />

                {/* Bar 1: Ingresado */}
                <rect x="42" y={160 - barHeights.pending} width="28" height={barHeights.pending} rx="4" fill="#f59e0b" fillOpacity="0.85" stroke="#f59e0b" strokeWidth="1" />
                <text x="56" y={150 - barHeights.pending} textAnchor="middle" fontSize="10" fill="#f59e0b" fontWeight="800">{stateCounts.pending}</text>
                <text x="56" y="176" textAnchor="middle" fontSize="9" fill="hsl(var(--foreground-hsl))" opacity="0.5" fontWeight="700">INGRESADO</text>

                {/* Bar 2: Agendado */}
                <rect x="106" y={160 - barHeights.inRevision} width="28" height={barHeights.inRevision} rx="4" fill="#3b82f6" fillOpacity="0.85" stroke="#3b82f6" strokeWidth="1" />
                <text x="120" y={150 - barHeights.inRevision} textAnchor="middle" fontSize="10" fill="#3b82f6" fontWeight="800">{stateCounts.inRevision}</text>
                <text x="120" y="176" textAnchor="middle" fontSize="9" fill="hsl(var(--foreground-hsl))" opacity="0.5" fontWeight="700">AGENDADO</text>

                {/* Bar 3: En Tratamiento */}
                <rect x="170" y={160 - barHeights.approved} width="28" height={barHeights.approved} rx="4" fill="#10b981" fillOpacity="0.85" stroke="#10b981" strokeWidth="1" />
                <text x="184" y={150 - barHeights.approved} textAnchor="middle" fontSize="10" fill="#10b981" fontWeight="800">{stateCounts.approved}</text>
                <text x="184" y="176" textAnchor="middle" fontSize="9" fill="hsl(var(--foreground-hsl))" opacity="0.5" fontWeight="700">TRATAMIENTO</text>

                {/* Bar 4: Finalizado */}
                <rect x="234" y={160 - barHeights.rejected} width="28" height={barHeights.rejected} rx="4" fill="#ef4444" fillOpacity="0.85" stroke="#ef4444" strokeWidth="1" />
                <text x="248" y={150 - barHeights.rejected} textAnchor="middle" fontSize="10" fill="#ef4444" fontWeight="800">{stateCounts.rejected}</text>
                <text x="248" y="176" textAnchor="middle" fontSize="9" fill="hsl(var(--foreground-hsl))" opacity="0.5" fontWeight="700">FINALIZADO</text>
              </svg>
            </div>
          </div>

          {/* Recent Registrations Table */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 700, margin: 0, color: 'hsl(var(--foreground-hsl))', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
                {user.role === 'internal' ? 'Casos Pendientes Recientes' : 'Inscripciones Recientes'}
              </h3>
              <Link href="/dashboard/cases" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.82rem', borderRadius: '9999px' }}>
                Ver Todos
              </Link>
            </div>

            {recentCases.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', opacity: 0.6, fontSize: '0.95rem' }}>
                No hay casos sociales registrados por mostrar.
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table clinical-table">
                  <thead>
                    <tr>
                      <th style={{ color: 'hsl(var(--foreground-hsl))', opacity: 0.5, fontWeight: 800 }}>PERSONA</th>
                      <th style={{ color: 'hsl(var(--foreground-hsl))', opacity: 0.5, fontWeight: 800 }}>CONVENIO</th>
                      <th style={{ color: 'hsl(var(--foreground-hsl))', opacity: 0.5, fontWeight: 800 }}>FECHA REGISTRO</th>
                      {user.role !== 'external' && <th style={{ color: 'hsl(var(--foreground-hsl))', opacity: 0.5, fontWeight: 800 }}>REGISTRADO POR</th>}
                      <th style={{ color: 'hsl(var(--foreground-hsl))', opacity: 0.5, fontWeight: 800 }}>ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCases.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 700, color: 'hsl(var(--foreground-hsl))' }}>
                          {c.yearly_correlative && (
                            <span style={{ opacity: 0.5, marginRight: '8px', fontWeight: 500, fontFamily: 'monospace' }}>
                              {String(c.yearly_correlative).padStart(4, '0')}
                            </span>
                          )}
                          {c.first_names} {c.last_names}
                        </td>
                        <td style={{
                          maxWidth: '220px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          opacity: 0.85,
                          fontWeight: 600
                        }}>
                          {c.description}
                        </td>
                        <td style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: 500 }}>
                          {formatDate(c.created_at)}
                        </td>
                        {user.role !== 'external' && (
                          <td style={{ fontSize: '0.85rem', opacity: 0.8, fontWeight: 500 }}>
                            {c.registered_by_name || 'Admin Semilla'}
                          </td>
                        )}
                        <td>
                          <span className={`badge badge-${c.status}`} style={{ fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                            {c.status === 'en_tratamiento' ? 'En tratamiento' : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Operations & Direct Actions */}
        <div className="dashboard-side-col">

          {/* Quick Actions Panel at the very top of column 2 */}
          <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 700, margin: 0, color: 'hsl(var(--foreground-hsl))', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Accesos Rápidos
              </h3>
              <span style={{ fontSize: '0.78rem', opacity: 0.5, fontWeight: 500 }}>
                Operaciones y accesos preferentes del portal
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(user.role === 'admin' || user.role === 'external') && (
                <Link
                  href="/dashboard/register"
                  className="quick-action-link green"
                >
                  <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    padding: '10px',
                    borderRadius: '50%'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'hsl(var(--foreground-hsl))' }}>Nueva Inscripción</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 500 }}>Registrar persona y crear caso social</span>
                  </div>
                </Link>
              )}

              <Link
                href="/dashboard/cases"
                className="quick-action-link blue"
              >
                <div style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6',
                  padding: '10px',
                  borderRadius: '50%'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'hsl(var(--foreground-hsl))' }}>Bandeja de Casos</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 500 }}>
                    {user.role === 'external' ? 'Monitorear mis inscripciones' : 'Buscar y administrar casos sociales'}
                  </span>
                </div>
              </Link>

              {user.role === 'admin' && (
                <Link
                  href="/dashboard/users"
                  className="quick-action-link purple"
                >
                  <div style={{
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    color: '#a855f7',
                    padding: '10px',
                    borderRadius: '50%'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'hsl(var(--foreground-hsl))' }}>Administrar Personal</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 500 }}>Crear y gestionar cuentas de usuarios</span>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* Distribución de Casos por Comuna inside column 2 */}
          <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', fontWeight: 700, margin: 0, color: 'hsl(var(--foreground-hsl))', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3b82f6' }}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                Distribución por Comuna
              </h3>
              <span style={{ fontSize: '0.78rem', opacity: 0.5, fontWeight: 500 }}>
                Procedencia territorial de los pacientes
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%' }}>
              {communeTotalVal === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', opacity: 0.6, padding: '40px 0', textAlign: 'center', justifyContent: 'center', width: '100%', minHeight: '220px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.1)',
                    marginBottom: '8px'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'hsl(var(--foreground-hsl))' }}>Sin datos de procedencia</span>
                  <span style={{ fontSize: '0.78rem', color: 'hsl(var(--foreground-hsl))', opacity: 0.5, maxWidth: '240px', lineHeight: '1.25rem' }}>
                    Una vez ingresados los primeros casos, se graficará automáticamente la distribución por comuna.
                  </span>
                </div>
              ) : (
                <>
                  {/* SVG Donut */}
                  <svg viewBox="0 0 240 240" width="150" height="150" style={{ display: 'block', flexShrink: 0 }}>
                    {donutSegments.map((seg, idx) => (
                      <circle
                        key={idx}
                        cx="120"
                        cy="120"
                        r="70"
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="16"
                        strokeDasharray={`${seg.strokeLength} 439.82`}
                        strokeDashoffset={seg.strokeOffset}
                        transform="rotate(-90 120 120)"
                        strokeLinecap={seg.percent > 0 && seg.percent < 100 ? 'butt' : 'round'}
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                      />
                    ))}

                    {/* Inner Label */}
                    <circle cx="120" cy="120" r="56" fill="hsl(var(--card-hsl))" />
                    <text x="120" y="123" textAnchor="middle" fill="hsl(var(--foreground-hsl))" fontSize="20" fontWeight="900" fontFamily="var(--font-display)">
                      {communeTotalVal}
                    </text>
                    <text x="120" y="140" textAnchor="middle" fill="hsl(var(--foreground-hsl))" opacity="0.4" fontSize="9" fontWeight="800" letterSpacing="0.05em">
                      CASOS
                    </text>
                  </svg>

                  {/* Sidebar legend list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                    {donutSegments.map((seg, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: seg.color }} />
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'hsl(var(--foreground-hsl))' }}>{seg.label}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 600 }}>{seg.count} ({Math.round(seg.percent)}%)</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
