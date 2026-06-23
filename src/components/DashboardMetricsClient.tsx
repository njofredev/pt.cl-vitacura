'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Link from 'next/link';

interface InstitutionMetric {
  name: string;
  quota_dental: number;
  used_dental: number;
  quota_xray: number;
  used_xray: number;
}

interface DashboardMetricsClientProps {
  stats: {
    totalCases: number;
    pendingCases: number;
    inRevisionCases: number;
    approvedCases: number;
    rejectedCases: number;
  };
  userRole: string;
  quotaDentalUsed: number;
  quotaDentalTotal: number;
  quotaXrayUsed: number;
  quotaXrayTotal: number;
  totalInstitutions: number;
  institutions: InstitutionMetric[];
}

export default function DashboardMetricsClient({
  stats,
  userRole,
  quotaDentalUsed,
  quotaDentalTotal,
  quotaXrayUsed,
  quotaXrayTotal,
  totalInstitutions,
  institutions
}: DashboardMetricsClientProps) {
  const [activeModal, setActiveModal] = useState<'none' | 'dental' | 'xray'>('none');

  const showBreakdown = userRole === 'admin' || userRole === 'internal';

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        {/* KPI 1: Volumen Total */}
        <div className="telemetry-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Cantidad Total
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
              Derivaciones ingresadas
            </span>
          </div>
        </div>

        {/* KPI 2: Procedimientos Dentales */}
        <div
          className="telemetry-card"
          onClick={() => showBreakdown && setActiveModal('dental')}
          style={{
            cursor: showBreakdown ? 'pointer' : 'default',
            border: showBreakdown ? '1px dashed rgba(59, 130, 246, 0.3)' : undefined
          }}
          title={showBreakdown ? 'Ver desglose por institución' : undefined}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Procedimientos Dentales {showBreakdown && '🔍'}
            </span>
            <div style={{ color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.08)', padding: '8px', borderRadius: '50%' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2.5 3.19-2.5 5.5h20c0-2.31-1-4.24-2.5-5.5M12 2C7.58 2 4 5.58 4 10c0 3.5 2.5 6 4.5 7.5l3.5 3.5 3.5-3.5c2-1.5 4.5-4 4.5-7.5 0-4.42-3.58-8-8-8z" /></svg>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
            <span style={{
              fontSize: '2.4rem',
              fontWeight: 850,
              fontFamily: 'var(--font-display)',
              color: 'hsl(var(--foreground-hsl))',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: '2.4rem',
              height: '2.4rem'
            }}>
              {quotaDentalUsed} / {quotaDentalTotal}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 750 }}>
              {Math.max(0, quotaDentalTotal - quotaDentalUsed)} disponibles
            </span>
          </div>
        </div>

        {/* KPI 3: Prestaciones de Radiología */}
        <div
          className="telemetry-card"
          onClick={() => showBreakdown && setActiveModal('xray')}
          style={{
            cursor: showBreakdown ? 'pointer' : 'default',
            border: showBreakdown ? '1px dashed rgba(168, 85, 247, 0.3)' : undefined
          }}
          title={showBreakdown ? 'Ver desglose por institución' : undefined}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Prestaciones de Radiología {showBreakdown && '🔍'}
            </span>
            <div style={{ color: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.08)', padding: '8px', borderRadius: '50%' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></svg>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
            <span style={{
              fontSize: '2.4rem',
              fontWeight: 850,
              fontFamily: 'var(--font-display)',
              color: 'hsl(var(--foreground-hsl))',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: '2.4rem',
              height: '2.4rem'
            }}>
              {quotaXrayUsed} / {quotaXrayTotal}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 750 }}>
              {Math.max(0, quotaXrayTotal - quotaXrayUsed)} disponibles
            </span>
          </div>
        </div>

        {/* KPI 4: Instituciones Inscritas */}
        {userRole === 'internal' ? (
          <Link href="/dashboard/ingreso-automatico" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div className="telemetry-card" style={{ cursor: 'pointer', border: '1px dashed rgba(245, 158, 11, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Casos Pendientes
                </span>
                <div style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)', padding: '8px', borderRadius: '50%' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                <span style={{
                  fontSize: '2.4rem',
                  fontWeight: 850,
                  fontFamily: 'var(--font-display)',
                  color: 'hsl(var(--foreground-hsl))',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: '2.4rem',
                  height: '2.4rem'
                }}>
                  {stats.pendingCases}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>
                  Esperando revisión
                </span>
              </div>
            </div>
          </Link>
        ) : (
          <div className="telemetry-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {userRole === 'admin' ? 'Instituciones Inscritas' : 'Casos Pendientes'}
              </span>
              <div style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)', padding: '8px', borderRadius: '50%' }}>
                {userRole === 'admin' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M15 3v18M3 9h18M3 15h18" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
              <span style={{
                fontSize: '2.4rem',
                fontWeight: 850,
                fontFamily: 'var(--font-display)',
                color: 'hsl(var(--foreground-hsl))',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: '2.4rem',
                height: '2.4rem'
              }}>
                {userRole === 'admin' ? totalInstitutions : stats.pendingCases}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>
                {userRole === 'admin' ? 'Establecimientos activos' : 'Esperando revisión'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Dental Breakdown Modal */}
      <Modal
        isOpen={activeModal === 'dental'}
        onClose={() => setActiveModal('none')}
        title="Procedimientos Dentales Utilizados por Institución"
        maxWidth="800px"
      >
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Institución</th>
                <th style={{ textAlign: 'center' }}>Cupos Utilizados / Totales</th>
                <th>Porcentaje de Uso</th>
              </tr>
            </thead>
            <tbody>
              {institutions.map((inst, index) => {
                const percentage = inst.quota_dental > 0 ? Math.round((inst.used_dental / inst.quota_dental) * 100) : 0;
                return (
                  <tr key={index}>
                    <td style={{ fontWeight: 700 }}>{inst.name}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>
                      {inst.used_dental} / {inst.quota_dental}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          flex: 1,
                          height: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          border: '1px solid var(--glass-border)'
                        }}>
                          <div style={{
                            width: `${Math.min(100, percentage)}%`,
                            height: '100%',
                            backgroundColor: percentage > 90 ? '#ef4444' : percentage > 70 ? '#f59e0b' : '#3b82f6',
                            borderRadius: '4px'
                          }} />
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, width: '40px', textAlign: 'right' }}>
                          {percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Xray Breakdown Modal */}
      <Modal
        isOpen={activeModal === 'xray'}
        onClose={() => setActiveModal('none')}
        title="Prestaciones de Radiología Utilizadas por Institución"
        maxWidth="800px"
      >
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Institución</th>
                <th style={{ textAlign: 'center' }}>Cupos Utilizados / Totales</th>
                <th>Porcentaje de Uso</th>
              </tr>
            </thead>
            <tbody>
              {institutions.map((inst, index) => {
                const percentage = inst.quota_xray > 0 ? Math.round((inst.used_xray / inst.quota_xray) * 100) : 0;
                return (
                  <tr key={index}>
                    <td style={{ fontWeight: 700 }}>{inst.name}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>
                      {inst.used_xray} / {inst.quota_xray}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          flex: 1,
                          height: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          border: '1px solid var(--glass-border)'
                        }}>
                          <div style={{
                            width: `${Math.min(100, percentage)}%`,
                            height: '100%',
                            backgroundColor: percentage > 90 ? '#ef4444' : percentage > 70 ? '#f59e0b' : '#a855f7',
                            borderRadius: '4px'
                          }} />
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, width: '40px', textAlign: 'right' }}>
                          {percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Modal>
    </>
  );
}
