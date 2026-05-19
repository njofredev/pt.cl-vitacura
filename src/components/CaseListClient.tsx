'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { formatRUT, formatDate } from '@/lib/utils';
import { updateCaseStatusAction } from '@/app/actions/caseActions';
import { UserSession } from '@/lib/auth';

interface CaseRecord {
  id: string;
  rut: string;
  first_names: string;
  last_names: string;
  nationality: string;
  birth_date: Date | string;
  commune: string;
  email: string | null;
  mobile: string;
  description: string;
  status: 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado';
  observations: string | null;
  created_at: Date | string;
  registered_by_name: string | null;
  evaluator_name: string | null;
}

interface CaseListClientProps {
  initialCases: CaseRecord[];
  user: UserSession;
}

export default function CaseListClient({ initialCases, user }: CaseListClientProps) {
  const [cases, setCases] = useState<CaseRecord[]>(initialCases);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  
  // Modal & Edit state
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [evalStatus, setEvalStatus] = useState<'pendiente' | 'en_revision' | 'aprobado' | 'rechazado'>('pendiente');
  const [evalObs, setEvalObs] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter cases based on search and status dropdown
  const filteredCases = cases.filter((c) => {
    const fullName = `${c.first_names} ${c.last_names}`.toLowerCase();
    const cleanRutStr = c.rut.toLowerCase();
    const descStr = c.description.toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = 
      fullName.includes(query) || 
      cleanRutStr.includes(query) || 
      descStr.includes(query);

    const matchesStatus = 
      statusFilter === 'todos' || 
      c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  function openDetails(c: CaseRecord) {
    setSelectedCase(c);
    setEvalStatus(c.status);
    setEvalObs(c.observations || '');
    setError(null);
    setSuccess(null);
    setIsModalOpen(true);
  }

  async function handleSaveEvaluation(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCase) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateCaseStatusAction(selectedCase.id, evalStatus, evalObs);
      
      if (result.success) {
        setSuccess('¡Evaluación y convenio guardados exitosamente!');
        
        // Update local state immediately for fast feedback
        setCases(cases.map(c => 
          c.id === selectedCase.id 
            ? { ...c, status: evalStatus, observations: evalObs, evaluator_name: user.name } 
            : c
        ));

        // Update selected case view inside the modal
        setSelectedCase({
          ...selectedCase,
          status: evalStatus,
          observations: evalObs,
          evaluator_name: user.name
        });

        setTimeout(() => {
          setIsModalOpen(false);
          setSuccess(null);
        }, 1500);
      } else {
        setError(result.error || 'Error al guardar la evaluación');
      }
    } catch (err) {
      setError('Error en el servidor al evaluar el caso.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title block */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 800, margin: 0 }}>
          Bandeja de Casos Sociales
        </h2>
        <p style={{ opacity: 0.7, margin: 0, fontSize: '0.9rem' }}>
          {user.role === 'external' 
            ? 'Monitoree el estado de revisión de los casos que ha inscrito.' 
            : 'Filtre, evalúe y asigne estados de convenios a los casos postulantes.'}
        </p>
      </div>

      {/* Filter panel */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '20px 24px', 
          display: 'flex', 
          gap: '20px', 
          alignItems: 'center', 
          flexWrap: 'wrap' 
        }}
      >
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <input 
            className="form-input"
            type="text"
            placeholder="Buscar por Nombre, RUT o Descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '40px' }}
          />
          <div style={{ position: 'absolute', left: '14px', top: '15px', opacity: 0.5 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase' }}>Estado:</span>
          <select 
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ backgroundColor: 'hsl(var(--card-hsl))', minWidth: '150px' }}
          >
            <option value="todos">Todos los Estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="en_revision">En Revisión</option>
            <option value="aprobado">Aprobados</option>
            <option value="rechazado">Rechazados</option>
          </select>
        </div>
      </div>

      {/* Main Glass Table Container */}
      <div className="glass-panel" style={{ padding: '24px', overflow: 'hidden' }}>
        {filteredCases.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', opacity: 0.6 }}>
            No se encontraron casos registrados con los filtros seleccionados.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Beneficiario</th>
                  <th>RUT</th>
                  <th>Comuna</th>
                  <th>Descripción</th>
                  <th>Fecha Ingreso</th>
                  {user.role !== 'external' && <th>Inscrito Por</th>}
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.first_names} {c.last_names}</td>
                    <td style={{ whiteSpace: 'nowrap', opacity: 0.9 }}>{formatRUT(c.rut)}</td>
                    <td>{c.commune}</td>
                    <td style={{
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      opacity: 0.8
                    }}>
                      {c.description}
                    </td>
                    <td style={{ fontSize: '0.85rem', opacity: 0.7 }}>{formatDate(c.created_at)}</td>
                    {user.role !== 'external' && (
                      <td style={{ fontSize: '0.85rem', opacity: 0.8 }}>{c.registered_by_name || 'Admin Semilla'}</td>
                    )}
                    <td>
                      <span className={`badge badge-${c.status}`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => openDetails(c)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Ver Ficha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ficha / Case Detail Modal */}
      {selectedCase && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={`Ficha de Caso Social - ${selectedCase.first_names} ${selectedCase.last_names}`}
          maxWidth="700px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Beneficiary particulars grid */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, opacity: 0.6, borderBottom: '1px solid var(--glass-border)', paddingBottom: '6px', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Datos del Postulante
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.95rem' }}>
                <div><span style={{ opacity: 0.6, display: 'block', fontSize: '0.8rem' }}>RUT:</span><strong>{formatRUT(selectedCase.rut)}</strong></div>
                <div><span style={{ opacity: 0.6, display: 'block', fontSize: '0.8rem' }}>Nacionalidad:</span><strong>{selectedCase.nationality}</strong></div>
                <div><span style={{ opacity: 0.6, display: 'block', fontSize: '0.8rem' }}>Fecha de Nacimiento:</span><strong>{formatDate(selectedCase.birth_date)}</strong></div>
                <div><span style={{ opacity: 0.6, display: 'block', fontSize: '0.8rem' }}>Comuna Residencia:</span><strong>{selectedCase.commune}</strong></div>
                <div><span style={{ opacity: 0.6, display: 'block', fontSize: '0.8rem' }}>Celular Contacto:</span><strong>{selectedCase.mobile}</strong></div>
                <div><span style={{ opacity: 0.6, display: 'block', fontSize: '0.8rem' }}>Correo Electrónico:</span><strong>{selectedCase.email || '-'}</strong></div>
              </div>
            </div>

            {/* Case Details */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, opacity: 0.6, borderBottom: '1px solid var(--glass-border)', paddingBottom: '6px', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Detalles de la Solicitud Social
              </h4>
              <div 
                className="glass-panel" 
                style={{ 
                  padding: '16px', 
                  backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid var(--glass-border)',
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {selectedCase.description}
              </div>
              <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '0.8rem', opacity: 0.6 }}>
                <span>Inscrito el: {formatDate(selectedCase.created_at)}</span>
                <span>Registrado por: {selectedCase.registered_by_name || 'Admin Semilla'}</span>
              </div>
            </div>

            {/* Review and observations block */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, opacity: 0.6, borderBottom: '1px solid var(--glass-border)', paddingBottom: '6px', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Evaluación Administrativa / Convenio
              </h4>

              {/* Show-only panel for External Admins (who cannot edit statuses) */}
              {user.role === 'external' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Estado actual del caso:</span>
                    <span className={`badge badge-${selectedCase.status}`}>
                      {selectedCase.status.replace('_', ' ')}
                    </span>
                  </div>
                  {selectedCase.observations ? (
                    <div className="glass-panel" style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                      <strong>Observaciones Internas:</strong>
                      <p style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>{selectedCase.observations}</p>
                    </div>
                  ) : (
                    <span style={{ fontStyle: 'italic', fontSize: '0.85rem', opacity: 0.5 }}>No hay observaciones registradas aún.</span>
                  )}
                </div>
              ) : (
                /* Editable form for Admins and Internals */
                <form onSubmit={handleSaveEvaluation} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  
                  {error && (
                    <div className="badge-rechazado" style={{ padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600 }}>
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="badge-aprobado" style={{ padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600 }}>
                      {success}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="eval_status">Asignar Estado del Caso</label>
                    <select 
                      className="form-select"
                      id="eval_status"
                      value={evalStatus}
                      onChange={(e) => setEvalStatus(e.target.value as any)}
                      disabled={loading}
                      style={{ backgroundColor: 'hsl(var(--card-hsl))' }}
                    >
                      <option value="pendiente">Pendiente (Sin Evaluación)</option>
                      <option value="en_revision">En Revisión Administrativa</option>
                      <option value="aprobado">Aprobado (Convenio Vigente)</option>
                      <option value="rechazado">Rechazado (No Aplica)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="eval_obs">Observaciones y Diagnóstico Social *</label>
                    <textarea 
                      className="form-textarea"
                      id="eval_obs"
                      value={evalObs}
                      onChange={(e) => setEvalObs(e.target.value)}
                      required
                      rows={4}
                      placeholder="Ingrese los motivos clínicos/sociales de la aprobación, rechazo o detalles técnicos del convenio aplicado..."
                      disabled={loading}
                    />
                  </div>

                  {selectedCase.evaluator_name && (
                    <div style={{ fontSize: '0.75rem', opacity: 0.5, fontStyle: 'italic' }}>
                      Última evaluación realizada por: {selectedCase.evaluator_name}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" disabled={loading}>
                      Cerrar
                    </button>
                    <button type="submit" className="btn-accent" disabled={loading}>
                      {loading ? 'Guardando...' : 'Guardar Evaluación'}
                    </button>
                  </div>

                </form>
              )}
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
}
