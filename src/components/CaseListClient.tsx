'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { formatRUT, formatDate, formatDateTime } from '@/lib/utils';
import { updateCaseStatusAction, deleteCaseAction, updateCaseDetailsAction } from '@/app/actions/caseActions';
import { UserSession } from '@/lib/auth';
import Link from 'next/link';

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
  medical_center: string | null;
  agreement_type: string | null;
  dental_diagnosis: string | null;
  treatment_needed: string | null;
  professional_name: string | null;
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

  // Load search from URL parameters if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get('search');
      if (searchParam) {
        setSearchTerm(searchParam);
      }
    }
  }, []);
  
  // Modal & Edit state
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [evalStatus, setEvalStatus] = useState<'pendiente' | 'en_revision' | 'aprobado' | 'rechazado'>('pendiente');
  const [evalObs, setEvalObs] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Edit case details states (for admin only)
  const [isEditing, setIsEditing] = useState(false);
  const [editRut, setEditRut] = useState('');
  const [editFirstNames, setEditFirstNames] = useState('');
  const [editLastNames, setEditLastNames] = useState('');
  const [editNationality, setEditNationality] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editCommune, setEditCommune] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMedicalCenter, setEditMedicalCenter] = useState('');
  const [editAgreementType, setEditAgreementType] = useState('');
  const [editDentalDiagnosis, setEditDentalDiagnosis] = useState('');
  const [editTreatmentNeeded, setEditTreatmentNeeded] = useState('');
  const [editProfessionalName, setEditProfessionalName] = useState('');

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
    
    // Initialize edit details states
    setEditRut(c.rut);
    setEditFirstNames(c.first_names);
    setEditLastNames(c.last_names);
    setEditNationality(c.nationality);
    const bdStr = c.birth_date ? new Date(c.birth_date).toISOString().split('T')[0] : '';
    setEditBirthDate(bdStr);
    setEditCommune(c.commune);
    setEditEmail(c.email || '');
    setEditMobile(c.mobile);
    setEditDescription(c.description || '');
    setEditMedicalCenter(c.medical_center || '');
    setEditAgreementType(c.agreement_type || '');
    setEditDentalDiagnosis(c.dental_diagnosis || '');
    setEditTreatmentNeeded(c.treatment_needed || '');
    setEditProfessionalName(c.professional_name || '');
    
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    setIsModalOpen(true);
  }

  async function handleDeleteCase(caseId: string, name: string) {
    const confirmed = window.confirm(`¿Está seguro de que desea eliminar permanentemente el caso social de ${name}? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await deleteCaseAction(caseId);

      if (result.success) {
        alert(`El caso de ${name} ha sido eliminado correctamente.`);
        setCases(cases.filter(c => c.id !== caseId));
        if (selectedCase?.id === caseId) {
          setIsModalOpen(false);
          setSelectedCase(null);
        }
      } else {
        setError(result.error || 'Error al eliminar el caso');
        alert(result.error || 'Error al eliminar el caso');
      }
    } catch (err) {
      setError('Error en el servidor al eliminar el caso.');
      alert('Error en el servidor al eliminar el caso.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCase) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateCaseDetailsAction(selectedCase.id, {
        rut: editRut,
        first_names: editFirstNames,
        last_names: editLastNames,
        nationality: editNationality,
        birth_date: editBirthDate,
        commune: editCommune,
        email: editEmail,
        mobile: editMobile,
        description: editDescription,
        medical_center: editMedicalCenter,
        agreement_type: editAgreementType,
        dental_diagnosis: editDentalDiagnosis,
        treatment_needed: editTreatmentNeeded,
        professional_name: editProfessionalName
      });

      if (result.success) {
        setSuccess('¡Datos del caso actualizados con éxito!');
        
        // Update local records state so UI updates instantly
        const updatedRecord: CaseRecord = {
          ...selectedCase,
          rut: editRut,
          first_names: editFirstNames,
          last_names: editLastNames,
          nationality: editNationality,
          birth_date: editBirthDate,
          commune: editCommune,
          email: editEmail || null,
          mobile: editMobile,
          description: editDescription,
          medical_center: editMedicalCenter || null,
          agreement_type: editAgreementType || null,
          dental_diagnosis: editDentalDiagnosis || null,
          treatment_needed: editTreatmentNeeded || null,
          professional_name: editProfessionalName || null
        };

        setCases(cases.map(c => c.id === selectedCase.id ? updatedRecord : c));
        setSelectedCase(updatedRecord);
        
        setTimeout(() => {
          setIsEditing(false);
          setSuccess(null);
        }, 1200);
      } else {
        setError(result.error || 'Error al actualizar los datos');
      }
    } catch (err) {
      setError('Error en el servidor al actualizar los datos del caso.');
    } finally {
      setLoading(false);
    }
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
      
      {/* Page Title with Action Button on the same row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div
          className="glass-panel"
          style={{
            padding: '24px 30px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(20, 184, 166, 0.01) 100%), var(--glass-bg)',
            borderLeft: '4px solid #10b981',
            borderRadius: 'var(--radius-md)',
            flex: 1,
            minWidth: '300px'
          }}
        >
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
            border: '1px solid rgba(16, 185, 129, 0.2)',
            flexShrink: 0
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 9h6"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>
          </div>
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
        </div>
        
        {user.role !== 'internal' && (
          <Link 
            href="/dashboard/register" 
            className="btn btn-primary" 
            style={{ 
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            Nueva Derivación
          </Link>
        )}
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
                      {c.dental_diagnosis ? `Derivación: ${c.agreement_type}` : c.description}
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
                    <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button 
                        onClick={() => openDetails(c)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Ver Ficha
                      </button>
                      <a 
                        href={`/dashboard/cases/${c.id}/print`}
                        target="_blank"
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', textDecoration: 'none' }}
                      >
                        Imprimir
                      </a>
                      {user.role === 'admin' && (
                        <button
                          onClick={() => handleDeleteCase(c.id, `${c.first_names} ${c.last_names}`)}
                          className="btn-danger"
                          style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center' }}
                          title="Eliminar Caso"
                          disabled={loading}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      )}
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
            
            {/* Admin toggle edit mode button */}
            {user.role === 'admin' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                  {isEditing ? 'Cancelar Edición' : 'Editar Datos de Ficha'}
                </button>
              </div>
            )}

            {isEditing ? (
              /* Editable details form for administrator role */
              <form onSubmit={handleSaveDetails} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {error && (
                  <div className="badge-rechazado" style={{ padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    {error}
                  </div>
                )}
                {success && (
                  <div className="badge-aprobado" style={{ padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    {success}
                  </div>
                )}

                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, opacity: 0.8, color: 'hsl(var(--accent-hsl))', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Editar Datos del Postulante
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <label style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Nombres</label>
                      <input type="text" className="form-input" value={editFirstNames} onChange={e => setEditFirstNames(e.target.value)} required style={{ width: '100%' }} />
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <label style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Apellidos</label>
                      <input type="text" className="form-input" value={editLastNames} onChange={e => setEditLastNames(e.target.value)} required style={{ width: '100%' }} />
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <label style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>RUT</label>
                      <input type="text" className="form-input" value={editRut} onChange={e => setEditRut(e.target.value)} required style={{ width: '100%' }} />
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <label style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Nacionalidad</label>
                      <input type="text" className="form-input" value={editNationality} onChange={e => setEditNationality(e.target.value)} required style={{ width: '100%' }} />
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <label style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Fecha de Nacimiento</label>
                      <input type="date" className="form-input" value={editBirthDate} onChange={e => setEditBirthDate(e.target.value)} required style={{ width: '100%' }} />
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <label style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Comuna Residencia</label>
                      <input type="text" className="form-input" value={editCommune} onChange={e => setEditCommune(e.target.value)} required style={{ width: '100%' }} />
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <label style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Celular Contacto</label>
                      <input type="text" className="form-input" value={editMobile} onChange={e => setEditMobile(e.target.value)} required style={{ width: '100%' }} />
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <label style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Correo Electrónico</label>
                      <input type="email" className="form-input" value={editEmail} onChange={e => setEditEmail(e.target.value)} style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, opacity: 0.8, color: 'hsl(var(--accent-hsl))', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    Editar Detalles de la Solicitud
                  </h4>
                  
                  <div className="glass-panel" style={{ padding: '24px', backgroundColor: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.7 }}>Centro Médico</label>
                        <input type="text" className="form-input" value={editMedicalCenter} onChange={e => setEditMedicalCenter(e.target.value)} style={{ width: '100%' }} />
                      </div>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.7 }}>Convenio Solicitado</label>
                        <input type="text" className="form-input" value={editAgreementType} onChange={e => setEditAgreementType(e.target.value)} style={{ width: '100%' }} />
                      </div>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.7 }}>Diagnóstico Odontológico</label>
                        <input type="text" className="form-input" value={editDentalDiagnosis} onChange={e => setEditDentalDiagnosis(e.target.value)} style={{ width: '100%' }} />
                      </div>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.7 }}>Prestación Requerida</label>
                        <input type="text" className="form-input" value={editTreatmentNeeded} onChange={e => setEditTreatmentNeeded(e.target.value)} style={{ width: '100%' }} />
                      </div>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.7 }}>Observaciones Generales / Descripción</label>
                        <textarea className="form-textarea" rows={3} value={editDescription} onChange={e => setEditDescription(e.target.value)} style={{ width: '100%', resize: 'vertical' }} />
                      </div>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.7 }}>Profesional Derivador</label>
                        <input type="text" className="form-input" value={editProfessionalName} onChange={e => setEditProfessionalName(e.target.value)} style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary" disabled={loading} style={{ padding: '10px 20px' }}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-accent" disabled={loading} style={{ padding: '10px 20px', fontWeight: 750, boxShadow: '0 4px 15px rgba(20, 184, 166, 0.25)' }}>
                    {loading ? 'Guardando...' : 'Guardar Cambios de Ficha'}
                  </button>
                </div>
              </form>
            ) : (
              /* Read-only details view (original layout) */
              <>
                {/* Beneficiary particulars grid */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, opacity: 0.8, color: 'hsl(var(--accent-hsl))', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Datos del Postulante
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>RUT</span>
                      <strong style={{ fontSize: '0.95rem' }}>{formatRUT(selectedCase.rut)}</strong>
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Nacionalidad</span>
                      <strong style={{ fontSize: '0.95rem' }}>{selectedCase.nationality}</strong>
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Fecha de Nacimiento</span>
                      <strong style={{ fontSize: '0.95rem' }}>{formatDate(selectedCase.birth_date)}</strong>
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Comuna Residencia</span>
                      <strong style={{ fontSize: '0.95rem' }}>{selectedCase.commune}</strong>
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Celular Contacto</span>
                      <strong style={{ fontSize: '0.95rem' }}>{selectedCase.mobile}</strong>
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ opacity: 0.5, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Correo Electrónico</span>
                      <strong style={{ fontSize: '0.95rem' }}>{selectedCase.email || '-'}</strong>
                    </div>
                  </div>
                </div>

                {/* Case Details */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, opacity: 0.8, color: 'hsl(var(--accent-hsl))', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    Detalles de la Solicitud Social
                  </h4>
                  <div 
                    className="glass-panel" 
                    style={{ 
                      padding: '20px', 
                      backgroundColor: 'rgba(255, 255, 255, 0.01)', 
                      border: '1px solid var(--glass-border)',
                      fontSize: '0.95rem',
                      lineHeight: '1.6',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    {selectedCase.dental_diagnosis ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '10px' }}>
                          <span style={{ width: '180px', opacity: 0.5, fontSize: '0.85rem', fontWeight: 600, flexShrink: 0 }}>Centro Médico:</span>
                          <span style={{ fontWeight: 600 }}>{selectedCase.medical_center}</span>
                        </div>
                        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '10px' }}>
                          <span style={{ width: '180px', opacity: 0.5, fontSize: '0.85rem', fontWeight: 600, flexShrink: 0 }}>Convenio Solicitado:</span>
                          <span style={{ fontWeight: 700, color: 'hsl(var(--accent-hsl))' }}>{selectedCase.agreement_type}</span>
                        </div>
                        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '10px' }}>
                          <span style={{ width: '180px', opacity: 0.5, fontSize: '0.85rem', fontWeight: 600, flexShrink: 0 }}>Diagnóstico Odontológico:</span>
                          <span style={{ fontStyle: 'italic', opacity: 0.95 }}>"{selectedCase.dental_diagnosis}"</span>
                        </div>
                        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '10px' }}>
                          <span style={{ width: '180px', opacity: 0.5, fontSize: '0.85rem', fontWeight: 600, flexShrink: 0 }}>Prestación Requerida:</span>
                          <span>{selectedCase.treatment_needed}</span>
                        </div>
                        {selectedCase.description && (
                          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '10px' }}>
                            <span style={{ width: '180px', opacity: 0.5, fontSize: '0.85rem', fontWeight: 600, flexShrink: 0 }}>Observaciones Generales:</span>
                            <span style={{ opacity: 0.85 }}>{selectedCase.description}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex' }}>
                          <span style={{ width: '180px', opacity: 0.5, fontSize: '0.85rem', fontWeight: 600, flexShrink: 0 }}>Profesional Derivador:</span>
                          <span style={{ fontWeight: 600, color: 'hsl(var(--primary-hsl))' }}>{selectedCase.professional_name}</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap', opacity: 0.9 }}>
                        {selectedCase.description}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '0.8rem', opacity: 0.5, paddingLeft: '4px' }}>
                    <span>Inscrito el: {formatDateTime(selectedCase.created_at)}</span>
                    <span>Registrado por: {selectedCase.registered_by_name || 'Admin Semilla'}</span>
                  </div>
                </div>
              </>
            )}
             {/* Review and observations block */}
             <div>
               <h4 style={{ fontSize: '0.9rem', fontWeight: 800, opacity: 0.8, color: 'hsl(var(--accent-hsl))', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                 Evaluación Administrativa / Convenio
               </h4>
 
               {/* Show-only panel for External Admins (who cannot edit statuses) */}
               {user.role === 'external' ? (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                     <span style={{ fontSize: '0.9rem', opacity: 0.7, fontWeight: 600 }}>Estado actual:</span>
                     <span className={`badge badge-${selectedCase.status}`} style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                       {selectedCase.status.replace('_', ' ')}
                     </span>
                   </div>
                   {selectedCase.observations ? (
                     <div className="glass-panel" style={{ padding: '18px', backgroundColor: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--glass-border)', fontSize: '0.95rem', lineHeight: '1.6', borderRadius: 'var(--radius-md)' }}>
                       <strong style={{ display: 'block', fontSize: '0.85rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Observaciones del Evaluador</strong>
                       <p style={{ margin: 0, whiteSpace: 'pre-wrap', opacity: 0.95 }}>{selectedCase.observations}</p>
                     </div>
                   ) : (
                     <span style={{ fontStyle: 'italic', fontSize: '0.85rem', opacity: 0.5, paddingLeft: '4px' }}>No hay observaciones registradas aún.</span>
                   )}
                 </div>
               ) : (
                 /* Editable form for Admins and Internals */
                 <form onSubmit={handleSaveEvaluation} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                   
                   {error && (
                     <div className="badge-rechazado" style={{ padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                       {error}
                     </div>
                   )}
 
                   {success && (
                     <div className="badge-aprobado" style={{ padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                       {success}
                     </div>
                   )}
 
                   <div className="form-group">
                     <label className="form-label" htmlFor="eval_status" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.7 }}>Asignar Estado del Caso</label>
                     <select 
                       className="form-select"
                       id="eval_status"
                       value={evalStatus}
                       onChange={(e) => setEvalStatus(e.target.value as any)}
                       disabled={loading}
                       style={{ backgroundColor: 'hsl(var(--card-hsl))', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                     >
                       <option value="pendiente">Pendiente (Sin Evaluación)</option>
                       <option value="en_revision">En Revisión Administrativa</option>
                       <option value="aprobado">Aprobado (Convenio Vigente)</option>
                       <option value="rechazado">Rechazado (No Aplica)</option>
                     </select>
                   </div>
 
                   <div className="form-group">
                     <label className="form-label" htmlFor="eval_obs" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.7 }}>Observaciones y Diagnóstico Social *</label>
                     <textarea 
                       className="form-textarea"
                       id="eval_obs"
                       value={evalObs}
                       onChange={(e) => setEvalObs(e.target.value)}
                       required
                       rows={4}
                       placeholder="Ingrese los motivos clínicos/sociales de la aprobación, rechazo o detalles técnicos del convenio aplicado..."
                       disabled={loading}
                       style={{ border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', resize: 'vertical' }}
                     />
                   </div>
 
                   {selectedCase.evaluator_name && (
                     <div style={{ fontSize: '0.75rem', opacity: 0.5, fontStyle: 'italic', paddingLeft: '4px' }}>
                       Última evaluación realizada por: {selectedCase.evaluator_name}
                     </div>
                   )}
 
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '10px', width: '100%' }}>
                      <div>
                        {user.role === 'admin' && (
                          <button 
                            type="button" 
                            onClick={() => {
                              if (selectedCase) {
                                handleDeleteCase(selectedCase.id, `${selectedCase.first_names} ${selectedCase.last_names}`);
                              }
                            }} 
                            className="btn-danger" 
                            disabled={loading} 
                            style={{ padding: '10px 20px' }}
                          >
                            Eliminar Caso
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" disabled={loading} style={{ padding: '10px 20px' }}>
                          Cerrar
                        </button>
                        <button type="submit" className="btn-accent" disabled={loading} style={{ padding: '10px 20px', fontWeight: 700, boxShadow: '0 4px 15px rgba(20, 184, 166, 0.25)' }}>
                          {loading ? 'Guardando...' : 'Guardar Evaluación'}
                        </button>
                      </div>
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
