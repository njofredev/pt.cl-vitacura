import { getSession } from '@/lib/auth';
import pool from '@/lib/db';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  // Fetch metrics based on role
  let stats = {
    totalCases: 0,
    pendingCases: 0,
    approvedCases: 0,
    rejectedCases: 0,
    totalUsers: 0, // Admin only
  };

  let recentCases: any[] = [];

  try {
    if (user.role === 'admin') {
      // Admin Metrics
      const casesCountRes = await pool.query('SELECT COUNT(*) FROM cases');
      stats.totalCases = parseInt(casesCountRes.rows[0].count);

      const statusRes = await pool.query('SELECT status, COUNT(*) FROM cases GROUP BY status');
      statusRes.rows.forEach((row: any) => {
        if (row.status === 'pendiente') stats.pendingCases = parseInt(row.count);
        if (row.status === 'aprobado') stats.approvedCases = parseInt(row.count);
        if (row.status === 'rechazado') stats.rejectedCases = parseInt(row.count);
      });

      const usersCountRes = await pool.query('SELECT COUNT(*) FROM users');
      stats.totalUsers = parseInt(usersCountRes.rows[0].count);

      const recentRes = await pool.query(`
        SELECT c.id, p.first_names, p.last_names, c.description, c.status, c.created_at, u.name as registered_by_name
        FROM cases c 
        JOIN persons p ON c.person_id = p.id 
        LEFT JOIN users u ON p.registered_by = u.id
        ORDER BY c.created_at DESC 
        LIMIT 5
      `);
      recentCases = recentRes.rows;

    } else if (user.role === 'internal') {
      // Internal Admin Metrics
      const casesCountRes = await pool.query('SELECT COUNT(*) FROM cases');
      stats.totalCases = parseInt(casesCountRes.rows[0].count);

      const statusRes = await pool.query('SELECT status, COUNT(*) FROM cases GROUP BY status');
      statusRes.rows.forEach((row: any) => {
        if (row.status === 'pendiente') stats.pendingCases = parseInt(row.count);
        if (row.status === 'aprobado') stats.approvedCases = parseInt(row.count);
        if (row.status === 'rechazado') stats.rejectedCases = parseInt(row.count);
      });

      // Show recent pending cases that need their attention
      const recentRes = await pool.query(`
        SELECT c.id, p.first_names, p.last_names, c.description, c.status, c.created_at, u.name as registered_by_name
        FROM cases c 
        JOIN persons p ON c.person_id = p.id 
        LEFT JOIN users u ON p.registered_by = u.id
        WHERE c.status = 'pendiente'
        ORDER BY c.created_at DESC 
        LIMIT 5
      `);
      recentCases = recentRes.rows;

    } else if (user.role === 'external') {
      // External Administrative Metrics (only their own registered cases)
      const casesCountRes = await pool.query(`
        SELECT COUNT(*) 
        FROM cases c 
        JOIN persons p ON c.person_id = p.id 
        WHERE p.registered_by = $1
      `, [user.id]);
      stats.totalCases = parseInt(casesCountRes.rows[0].count);

      const statusRes = await pool.query(`
        SELECT c.status, COUNT(*) 
        FROM cases c 
        JOIN persons p ON c.person_id = p.id 
        WHERE p.registered_by = $1
        GROUP BY c.status
      `, [user.id]);
      
      statusRes.rows.forEach((row: any) => {
        if (row.status === 'pendiente') stats.pendingCases = parseInt(row.count);
        if (row.status === 'aprobado') stats.approvedCases = parseInt(row.count);
        if (row.status === 'rechazado') stats.rejectedCases = parseInt(row.count);
      });

      const recentRes = await pool.query(`
        SELECT c.id, p.first_names, p.last_names, c.description, c.status, c.created_at
        FROM cases c 
        JOIN persons p ON c.person_id = p.id 
        WHERE p.registered_by = $1
        ORDER BY c.created_at DESC 
        LIMIT 5
      `, [user.id]);
      recentCases = recentRes.rows;
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  }

  const roleLabels = {
    admin: 'Administrador General',
    internal: 'Administrativo Interno',
    external: 'Administrativo Externo',
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Top Welcome Header */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '30px 40px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(20, 184, 166, 0.05) 100%), var(--glass-bg)',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 800, margin: 0 }}>
            ¡Hola, {user.name}!
          </h2>
          <p style={{ opacity: 0.7, margin: 0, fontWeight: 500, fontSize: '1rem' }}>
            Bienvenido al Portal de Convenios del Policlínico Tabancura • <strong>{roleLabels[user.role]}</strong>
          </p>
        </div>
        
        {(user.role === 'admin' || user.role === 'external') && (
          <Link href="/dashboard/register" className="btn btn-accent" style={{ boxShadow: '0 4px 15px rgba(20, 184, 166, 0.25)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            Inscribir Caso Social
          </Link>
        )}
      </div>

      {/* Grid of Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px'
      }}>
        
        {/* Total Cases */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase' }}>
              {user.role === 'external' ? 'Mis Casos Inscritos' : 'Total Casos'}
            </span>
            <div style={{ color: 'hsl(var(--primary-hsl))', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
          </div>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
            {stats.totalCases}
          </span>
          <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Registros totales en el sistema</span>
        </div>

        {/* Pending Cases */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase' }}>
              Casos Pendientes
            </span>
            <div style={{ color: 'hsl(var(--warning-hsl))', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'hsl(var(--warning-hsl))' }}>
            {stats.pendingCases}
          </span>
          <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Esperando revisión administrativa</span>
        </div>

        {/* Approved Cases */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase' }}>
              Casos Aprobados
            </span>
            <div style={{ color: 'hsl(var(--success-hsl))', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'hsl(var(--success-hsl))' }}>
            {stats.approvedCases}
          </span>
          <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Convenios aplicados y vigentes</span>
        </div>

        {/* Extra Card based on Role (Users for Admin, Rejected for others) */}
        {user.role === 'admin' ? (
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase' }}>
                Administrativos
              </span>
              <div style={{ color: 'hsl(var(--accent-hsl))', backgroundColor: 'rgba(20, 184, 166, 0.1)', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
            </div>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'hsl(var(--accent-hsl))' }}>
              {stats.totalUsers}
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Usuarios con acceso al portal</span>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase' }}>
                Casos Rechazados
              </span>
              <div style={{ color: 'hsl(var(--danger-hsl))', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </div>
            </div>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'hsl(var(--danger-hsl))' }}>
              {stats.rejectedCases}
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Casos no aplicables al convenio</span>
          </div>
        )}
      </div>

      {/* Main Body Grid: Recent Registrations & Operations */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '3fr 2fr',
        gap: '30px',
        alignItems: 'start'
      }}>
        
        {/* Left Side: Recent Cases */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 700, margin: 0 }}>
              {user.role === 'internal' ? 'Casos Pendientes Recientes' : 'Inscripciones Recientes'}
            </h3>
            <Link href="/dashboard/cases" className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
              Ver Todos
            </Link>
          </div>

          {recentCases.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', opacity: 0.6, fontSize: '0.95rem' }}>
              No hay casos sociales registrados por mostrar.
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Persona</th>
                    <th>Descripción Caso</th>
                    <th>Fecha</th>
                    {user.role !== 'external' && <th>Registrado Por</th>}
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCases.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>
                        {c.first_names} {c.last_names}
                      </td>
                      <td style={{
                        maxWidth: '240px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        opacity: 0.8
                      }}>
                        {c.description}
                      </td>
                      <td style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                        {formatDate(c.created_at)}
                      </td>
                      {user.role !== 'external' && (
                        <td style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                          {c.registered_by_name || 'Admin Semilla'}
                        </td>
                      )}
                      <td>
                        <span className={`badge badge-${c.status}`}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Quick Actions Panel */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 700, margin: 0, marginBottom: '4px' }}>
            Accesos Rápidos
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(user.role === 'admin' || user.role === 'external') && (
              <Link 
                href="/dashboard/register" 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--glass-border)',
                  color: 'inherit',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  backgroundColor: 'rgba(20, 184, 166, 0.1)',
                  color: 'hsl(var(--accent-hsl))',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Nueva Inscripción</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Registrar persona y crear caso social</span>
                </div>
              </Link>
            )}

            <Link 
              href="/dashboard/cases" 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--glass-border)',
                color: 'inherit',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: 'hsl(var(--primary-hsl))',
                padding: '10px',
                borderRadius: 'var(--radius-sm)'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Bandeja de Casos</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                  {user.role === 'external' ? 'Monitorear mis inscripciones' : 'Buscar y administrar casos sociales'}
                </span>
              </div>
            </Link>

            {user.role === 'admin' && (
              <Link 
                href="/dashboard/users" 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--glass-border)',
                  color: 'inherit',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  backgroundColor: 'rgba(20, 184, 166, 0.1)',
                  color: 'hsl(var(--accent-hsl))',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Administrar Personal</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Crear cuentas de administrativos internos/externos</span>
                </div>
              </Link>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
