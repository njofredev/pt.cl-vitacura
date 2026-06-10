'use client';

import React, { useState, useEffect } from 'react';
import { getAuditLogsAction, AuditLog } from '@/app/actions/auditActions';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/ui/CustomSelect';
import Loader from '@/components/ui/Loader';
import { 
  Activity, 
  Search, 
  Eye, 
  Database, 
  User, 
  Cpu, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCcw, 
  Clock 
} from 'lucide-react';

export default function AuditLogClient() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const actionOptions = [
    { value: 'all', label: 'Todas las acciones' },
    { value: 'LOGIN_SUCCESS', label: 'Inicio de Sesión Exitoso' },
    { value: 'LOGIN_FAILED', label: 'Inicio de Sesión Fallido' },
    { value: 'LOGOUT', label: 'Cierre de Sesión' },
    { value: 'CASE_CREATED', label: 'Creación de Caso' },
    { value: 'CASE_DETAILS_UPDATED', label: 'Edición de Caso' },
    { value: 'CASE_STATUS_UPDATED', label: 'Cambio de Estado de Caso' },
    { value: 'CASE_DELETED', label: 'Eliminación de Caso' },
    { value: 'ARANCELES_SYNCED', label: 'Sincronización de Aranceles' },
  ];

  async function fetchLogs() {
    setLoading(true);
    setError(null);
    try {
      const res = await getAuditLogsAction(page, limit, search, actionFilter);
      if (res.success && res.data !== undefined && res.total !== undefined) {
        setLogs(res.data);
        setTotal(res.total);
      } else {
        setError(res.error || 'Error al obtener registros de auditoría');
      }
    } catch (err) {
      console.error(err);
      setError('Error en el servidor al intentar cargar la auditoría');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setSearch('');
    setActionFilter('all');
    setPage(1);
    // Fetch will trigger because actionFilter changes or we manual fetch
    if (actionFilter === 'all') {
      // If it was already 'all', page/filter change won't trigger useEffect, so call manual
      setLoading(true);
      getAuditLogsAction(1, limit, '', 'all').then(res => {
        if (res.success && res.data && res.total !== undefined) {
          setLogs(res.data);
          setTotal(res.total);
        }
        setLoading(false);
      });
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const formatDate = (dateStr: Date | string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('es-CL', {
      timeZone: 'America/Santiago',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'LOGIN_SUCCESS':
        return { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)', color: '#10b981' };
      case 'LOGIN_FAILED':
        return { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.25)', color: '#ef4444' };
      case 'CASE_CREATED':
        return { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.25)', color: '#3b82f6' };
      case 'CASE_STATUS_UPDATED':
        return { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)', color: '#f59e0b' };
      case 'CASE_DELETED':
        return { bg: 'rgba(220, 38, 38, 0.15)', border: 'rgba(220, 38, 38, 0.3)', color: '#dc2626' };
      case 'ARANCELES_SYNCED':
        return { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.25)', color: '#8b5cf6' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.05)', border: 'rgba(255, 255, 255, 0.1)', color: 'var(--foreground-hsl)' };
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title Panel */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.04) 0%, rgba(20, 184, 166, 0.01) 100%), var(--glass-bg)',
          borderLeft: '4px solid #3b82f6',
          borderRadius: 'var(--radius-md)',
          flexWrap: 'wrap',
          gap: '20px',
          width: '100%'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3b82f6',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            flexShrink: 0
          }}>
            <Activity size={26} strokeWidth={2.5} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 800, margin: 0 }}>
              Auditoría del Sistema
            </h2>
            <p style={{ opacity: 0.7, margin: 0, fontSize: '0.9rem' }}>
              Historial general de cambios, inicios de sesión y sincronizaciones. Panel exclusivo para administradores.
            </p>
          </div>
        </div>
        
        <button 
          onClick={fetchLogs} 
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.9rem' }}
          disabled={loading}
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Filter and Search Box */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          <div style={{ flex: '2 1 300px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.8 }}>Buscador General</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Buscar por usuario, correo, IP o palabra clave..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '40px', width: '100%' }}
              />
              <Search 
                size={18} 
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} 
              />
            </div>
          </div>

          <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.8 }}>Acción Realizada</label>
            <CustomSelect 
              value={actionFilter} 
              onChange={setActionFilter} 
              options={actionOptions}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <button type="submit" className="btn-primary" style={{ padding: '12px 20px', minHeight: '44px' }} disabled={loading}>
              Buscar
            </button>
            {(search || actionFilter !== 'all') && (
              <button 
                type="button" 
                onClick={handleClearFilters} 
                className="btn-secondary" 
                style={{ padding: '12px 20px', minHeight: '44px' }}
              >
                Limpiar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
        {error && (
          <div className="badge-rechazado" style={{ padding: '12px 18px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '60px 0' }}>
            <Loader size="medium" label="Cargando logs de auditoría..." />
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.7 }}>
            <Database size={48} style={{ margin: '0 auto 16px auto', opacity: 0.4, display: 'block' }} />
            <h4 style={{ margin: '0 0 4px 0', fontWeight: 700 }}>No se encontraron registros</h4>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Intente ajustando los criterios de búsqueda o filtros.</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Acción</th>
                    <th>Usuario Actor</th>
                    <th>Dirección IP</th>
                    <th style={{ textAlign: 'right' }}>Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const badge = getActionBadgeColor(log.action);
                    return (
                      <tr key={log.id} style={{ transition: 'background-color 0.2s ease' }}>
                        <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={14} style={{ opacity: 0.6 }} />
                            {formatDate(log.created_at)}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: badge.bg,
                            border: `1px solid ${badge.border}`,
                            color: badge.color,
                            display: 'inline-block',
                            letterSpacing: '0.02em'
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {log.user_email ? (
                              <>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{log.user_name}</span>
                                <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>{log.user_email}</span>
                              </>
                            ) : (
                              <span style={{ opacity: 0.5, fontStyle: 'italic', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Cpu size={14} />
                                {log.user_name || 'Sistema'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ fontFamily: 'monospace', opacity: 0.8, fontSize: '0.85rem' }}>
                          {log.ip_address || 'unknown'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="btn btn-primary"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.8rem',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              color: '#3b82f6',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <Eye size={14} />
                            Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--glass-border)',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                Mostrando registro <strong>{(page - 1) * limit + 1}</strong> al <strong>{Math.min(page * limit, total)}</strong> de un total de <strong>{total}</strong>
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  onClick={() => setPage(p => Math.max(p - 1, 1))} 
                  disabled={page === 1}
                  className="btn-secondary"
                  style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                >
                  <ChevronLeft size={16} />
                  Anterior
                </button>
                <span style={{ fontSize: '0.85rem', padding: '0 8px', fontWeight: 600 }}>
                  Pág. {page} de {totalPages}
                </span>
                <button 
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))} 
                  disabled={page === totalPages}
                  className="btn-secondary"
                  style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                >
                  Siguiente
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Details View Modal */}
      <Modal 
        isOpen={selectedLog !== null} 
        onClose={() => setSelectedLog(null)} 
        title="Detalles del Registro de Auditoría"
        maxWidth="700px"
      >
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
              <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.6, marginBottom: '2px', fontWeight: 600 }}>ID del Registro</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{selectedLog.id}</span>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.6, marginBottom: '2px', fontWeight: 600 }}>Fecha y Hora</span>
                <span>{formatDate(selectedLog.created_at)}</span>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.6, marginBottom: '2px', fontWeight: 600 }}>Acción</span>
                <span style={{ fontWeight: 700, color: getActionBadgeColor(selectedLog.action).color }}>{selectedLog.action}</span>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.6, marginBottom: '2px', fontWeight: 600 }}>Dirección IP</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedLog.ip_address || 'unknown'}</span>
              </div>
            </div>

            <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.6, marginBottom: '4px', fontWeight: 600 }}>Usuario Ejecutor</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.8
                }}>
                  <User size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{selectedLog.user_name || 'Sistema (Automático)'}</div>
                  {selectedLog.user_email && <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{selectedLog.user_email}</div>}
                  {selectedLog.user_id && <div style={{ fontSize: '0.7rem', opacity: 0.4, fontFamily: 'monospace' }}>UID: {selectedLog.user_id}</div>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.8 }}>Parámetros y Metadatos (Detalles JSON)</span>
              <pre style={{
                margin: 0,
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: '#0d1117',
                border: '1px solid rgba(255,255,255,0.05)',
                color: '#e6edf3',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                maxHeight: '300px'
              }}>
                {selectedLog.details 
                  ? JSON.stringify(
                      typeof selectedLog.details === 'string' 
                        ? JSON.parse(selectedLog.details) 
                        : selectedLog.details, 
                      null, 
                      2
                    ) 
                  : '// No se incluyeron metadatos adicionales en este evento.'
                }
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button onClick={() => setSelectedLog(null)} className="btn-primary" style={{ padding: '10px 24px' }}>
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
