'use client';

import React, { useState, useEffect } from 'react';
import { getStatusHistoryLogsAction, StatusHistoryRecord, restoreCaseStatusFromHistoryAction } from '@/app/actions/historyActions';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/ui/CustomSelect';
import Loader from '@/components/ui/Loader';
import { formatRUT } from '@/lib/utils';
import { 
  History, 
  Search, 
  Eye, 
  User, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCcw, 
  Calendar,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function StatusHistoryClient({ userRole }: { userRole?: string }) {
  const [logs, setLogs] = useState<StatusHistoryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<StatusHistoryRecord | null>(null);

  // Restore Modal State
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<StatusHistoryRecord | null>(null);
  const [restoreReason, setRestoreReason] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'ingresado', label: 'Ingresado' },
    { value: 'sincronizado', label: 'Sincronizado' },
    { value: 'agendado', label: 'Agendado' },
    { value: 'en_tratamiento', label: 'En Tratamiento' },
    { value: 'finalizado', label: 'Finalizado' },
  ];

  async function fetchLogs() {
    setLoading(true);
    setError(null);
    try {
      const res = await getStatusHistoryLogsAction(page, limit, search, statusFilter);
      if (res.success && res.data !== undefined && res.total !== undefined) {
        setLogs(res.data);
        setTotal(res.total);
      } else {
        setError(res.error || 'Error al obtener registros del histórico de estados');
      }
    } catch (err) {
      console.error(err);
      setError('Error en el servidor al intentar cargar el histórico');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreTarget || !restoreReason.trim()) return;

    setIsRestoring(true);
    try {
      const res = await restoreCaseStatusFromHistoryAction(
        restoreTarget.case_id, 
        restoreTarget.previous_status || 'ingresado', 
        restoreReason.trim()
      );
      if (res.success) {
        setRestoreSuccessMsg(res.message || 'Estado restaurado exitosamente');
        setTimeout(() => {
          setRestoreModalOpen(false);
          setRestoreTarget(null);
          setRestoreReason('');
          setRestoreSuccessMsg(null);
          fetchLogs();
        }, 1800);
      } else {
        alert(res.error || 'No se pudo restaurar el estado');
      }
    } catch (err: any) {
      alert(err.message || 'Error al restaurar');
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDateChile = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const dt = new Date(dateStr);
      return dt.toLocaleString('es-CL', {
        timeZone: 'America/Santiago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status ? status.toLowerCase() : '';
    switch (s) {
      case 'ingresado':
        return (
          <span style={{ 
            display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: '6px',
            fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', border: '1px solid rgba(2, 132, 199, 0.3)'
          }}>
            INGRESADO
          </span>
        );
      case 'sincronizado':
        return (
          <span style={{ 
            display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: '6px',
            fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'rgba(13, 148, 136, 0.12)', color: '#0d9488', border: '1px solid rgba(13, 148, 136, 0.3)'
          }}>
            SINCRONIZADO
          </span>
        );
      case 'agendado':
        return (
          <span style={{ 
            display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: '6px',
            fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', border: '1px solid rgba(37, 99, 235, 0.3)'
          }}>
            AGENDADO
          </span>
        );
      case 'en_tratamiento':
        return (
          <span style={{ 
            display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: '6px',
            fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed', border: '1px solid rgba(124, 58, 237, 0.3)'
          }}>
            EN TRATAMIENTO
          </span>
        );
      case 'finalizado':
        return (
          <span style={{ 
            display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: '6px',
            fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'rgba(5, 150, 105, 0.12)', color: '#059669', border: '1px solid rgba(5, 150, 105, 0.3)'
          }}>
            FINALIZADO
          </span>
        );
      default:
        return <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{status || '-'}</span>;
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <History size={26} color="var(--primary)" />
            Histórico y Respaldo de Estados
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Registro inmutable y cronológico de todas las transiciones de estado de pacientes derivadas a Policlínico Tabancura.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={fetchLogs} 
            className="btn-secondary" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            disabled={loading}
          >
            <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filter and search card */}
      <div className="glass-card" style={{ padding: '16px 20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 250px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Buscar por RUT, Nombre de paciente o usuario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface-2)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ width: '220px' }}>
            <CustomSelect
              options={statusOptions}
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val); setPage(1); }}
              placeholder="Filtrar por nuevo estado"
            />
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '9px 18px', fontSize: '0.85rem', fontWeight: 600 }}>
            Buscar
          </button>
        </form>
      </div>

      {/* Main Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Loader size="medium" label="Cargando histórico de estados..." />
          </div>
        ) : error ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#ef4444' }}>
            <AlertCircle size={36} style={{ margin: '0 auto 12px auto' }} />
            <p style={{ fontWeight: 600 }}>{error}</p>
            <button onClick={fetchLogs} className="btn-secondary" style={{ marginTop: '10px' }}>Reintentar</button>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <History size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <p style={{ fontWeight: 600, fontSize: '1rem' }}>No se encontraron registros de histórico</p>
            <p style={{ fontSize: '0.85rem' }}>Prueba ajustando los filtros de búsqueda</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ 
                  borderBottom: '1px solid var(--border-color)', 
                  backgroundColor: 'var(--bg-surface-2)',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  <th style={{ padding: '12px 16px' }}>Fecha y Hora (Chile)</th>
                  <th style={{ padding: '12px 16px' }}>Paciente / RUT</th>
                  <th style={{ padding: '12px 16px' }}>Estado Anterior</th>
                  <th style={{ padding: '12px 16px' }}>Nuevo Estado</th>
                  <th style={{ padding: '12px 16px' }}>Usuario / Origen</th>
                  <th style={{ padding: '12px 16px' }}>Observación / Detalle</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((record) => (
                  <tr 
                    key={record.id} 
                    style={{ 
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background-color 0.15s ease'
                    }}
                    className="hover-row"
                  >
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', color: 'var(--text-main)', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} color="var(--text-muted)" />
                        {formatDateChile(record.created_at)}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{record.patient_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatRUT(record.rut)}</div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      {record.previous_status ? getStatusBadge(record.previous_status) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Inicio</span>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      {getStatusBadge(record.new_status)}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-main)' }}>
                        <User size={13} color="var(--primary)" />
                        {record.user_name || 'Sistema Dentalink'}
                      </div>
                      {record.user_email && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{record.user_email}</div>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px', maxWidth: '280px' }}>
                      <div style={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap', 
                        fontSize: '0.8rem', 
                        color: 'var(--text-main)' 
                      }} title={record.observations || ''}>
                        {record.observations || '-'}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="btn-icon"
                          title="Ver detalle del registro"
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--bg-surface-2)',
                            color: 'var(--text-main)',
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer'
                          }}
                        >
                          <Eye size={15} />
                        </button>
                        {userRole === 'admin' && record.previous_status && (
                          <button
                            onClick={() => {
                              setRestoreTarget(record);
                              setRestoreModalOpen(true);
                            }}
                            className="btn-icon"
                            title={`Restaurar a estado anterior: ${record.previous_status}`}
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(234, 88, 12, 0.1)',
                              color: '#ea580c',
                              border: '1px solid rgba(234, 88, 12, 0.3)',
                              cursor: 'pointer'
                            }}
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && !error && logs.length > 0 && (
          <div style={{ 
            padding: '14px 20px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              Mostrando <b>{(page - 1) * limit + 1}</b> - <b>{Math.min(page * limit, total)}</b> de <b>{total}</b> registros
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="btn-secondary"
                style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
              >
                <ChevronLeft size={14} /> Anterior
              </button>
              <span style={{ fontSize: '0.8rem', padding: '0 6px' }}>
                Página <b>{page}</b> de <b>{totalPages}</b>
              </span>
              <button 
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="btn-secondary"
                style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
              >
                Siguiente <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detail */}
      {selectedRecord && (
        <Modal 
          isOpen={true} 
          onClose={() => setSelectedRecord(null)}
          title="Detalle del Registro Histórico de Estado"
          maxWidth="650px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.875rem' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '12px',
              backgroundColor: 'var(--bg-surface-2)',
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Paciente</span>
                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{selectedRecord.patient_name}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>RUT</span>
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{formatRUT(selectedRecord.rut)}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Estado Anterior</span>
                <div style={{ marginTop: '3px' }}>{selectedRecord.previous_status ? getStatusBadge(selectedRecord.previous_status) : 'Ninguno (Creación)'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Nuevo Estado</span>
                <div style={{ marginTop: '3px' }}>{getStatusBadge(selectedRecord.new_status)}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Usuario / Responsable</span>
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedRecord.user_name || 'Sistema'}</div>
                {selectedRecord.user_email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedRecord.user_email}</div>}
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Fecha y Hora (Chile)</span>
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{formatDateChile(selectedRecord.created_at)}</div>
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Observaciones / Motivo</span>
              <div style={{ 
                marginTop: '4px', 
                padding: '12px', 
                backgroundColor: 'var(--bg-surface-2)', 
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                lineHeight: '1.4'
              }}>
                {selectedRecord.observations || 'Sin observaciones adicionales registradas.'}
              </div>
            </div>

            {selectedRecord.metadata && Object.keys(selectedRecord.metadata).length > 0 && (
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Metadatos Técnicos</span>
                <pre style={{ 
                  marginTop: '4px', 
                  padding: '10px', 
                  backgroundColor: 'var(--bg-surface-2)', 
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontSize: '0.75rem',
                  maxHeight: '150px',
                  overflowY: 'auto'
                }}>
                  {JSON.stringify(selectedRecord.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button onClick={() => setSelectedRecord(null)} className="btn-primary">
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Restore State */}
      {restoreModalOpen && restoreTarget && (
        <Modal
          isOpen={true}
          onClose={() => !isRestoring && setRestoreModalOpen(false)}
          title="Restaurar Estado de Paciente"
          maxWidth="520px"
        >
          <form onSubmit={handleRestoreSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {restoreSuccessMsg ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>
                {restoreSuccessMsg}
              </div>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                  ¿Estás seguro de restaurar el estado del paciente <b>{restoreTarget.patient_name}</b> al estado anterior <b>{restoreTarget.previous_status?.toUpperCase()}</b>?
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Motivo de la restauración *
                  </label>
                  <textarea
                    required
                    placeholder="Describe por qué se revierte o corrige este estado..."
                    value={restoreReason}
                    onChange={(e) => setRestoreReason(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-surface-2)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button 
                    type="button" 
                    onClick={() => setRestoreModalOpen(false)} 
                    className="btn-secondary"
                    disabled={isRestoring}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }}
                    disabled={isRestoring || !restoreReason.trim()}
                  >
                    {isRestoring ? 'Restaurando...' : 'Confirmar Restauración'}
                  </button>
                </div>
              </>
            )}
          </form>
        </Modal>
      )}

    </div>
  );
}
