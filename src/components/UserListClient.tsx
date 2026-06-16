'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/ui/CustomSelect';
import { createUserAction, toggleUserStatusAction, updateUserAction } from '@/app/actions/userActions';
import { getConveniosByMedicalCenterAction } from '@/app/actions/convenioActions';
import { createInstitutionAction, updateInstitutionAction, deleteInstitutionAction } from '@/app/actions/institutionActions';
import { Users, Building } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'internal' | 'external';
  active: boolean;
  created_at: Date;
  professional_title?: string;
  professional_position?: string;
  professional_email?: string;
  professional_address?: string;
  professional_website?: string;
  professional_phone?: string;
  medical_center?: string;
  agreement_type?: string;
  quota_dental?: number;
  quota_xray?: number;
  used_dental?: number;
  used_xray?: number;
  institution_id?: number | null;
  institution_name?: string | null;
  inst_quota_dental?: number;
  inst_quota_xray?: number;
  inst_used_dental?: number;
  inst_used_xray?: number;
}

interface Institution {
  id: number;
  name: string;
  quota_dental: number;
  quota_xray: number;
  used_dental: number;
  used_xray: number;
}

interface UserListClientProps {
  initialUsers: User[];
  currentUserId: string;
  initialInstitutions: Institution[];
}

export default function UserListClient({ initialUsers, currentUserId, initialInstitutions }: UserListClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [institutions, setInstitutions] = useState<Institution[]>(initialInstitutions);
  const [activeTab, setActiveTab] = useState<'users' | 'institutions'>('users');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Institution Modals/States
  const [isInstModalOpen, setIsInstModalOpen] = useState(false);
  const [isEditInstModalOpen, setIsEditInstModalOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<Institution | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [newRole, setNewRole] = useState('internal');
  const [editRole, setEditRole] = useState('internal');
  const [newMedicalCenter, setNewMedicalCenter] = useState('');
  const [editMedicalCenter, setEditMedicalCenter] = useState('');
  const [newInstitutionId, setNewInstitutionId] = useState('');
  const [editInstitutionId, setEditInstitutionId] = useState('');

  const [newAgreements, setNewAgreements] = useState<{ value: string; label: string }[]>([]);
  const [editAgreements, setEditAgreements] = useState<{ value: string; label: string }[]>([]);
  const [newAgreementType, setNewAgreementType] = useState('');
  const [editAgreementType, setEditAgreementType] = useState('');

  useEffect(() => {
    async function loadNewAgreements() {
      if (!newMedicalCenter) {
        setNewAgreements([]);
        setNewAgreementType('');
        return;
      }
      try {
        const res = await getConveniosByMedicalCenterAction(newMedicalCenter);
        if (res.success && res.convenios) {
          const options = res.convenios.map((c: any) => ({
            value: c.empresa,
            label: c.empresa,
          }));
          setNewAgreements(options);
          if (options.length > 0) {
            setNewAgreementType(options[0].value);
          } else {
            setNewAgreementType('');
          }
        } else {
          setNewAgreements([]);
          setNewAgreementType('');
        }
      } catch (err) {
        console.error(err);
        setNewAgreements([]);
        setNewAgreementType('');
      }
    }
    loadNewAgreements();
  }, [newMedicalCenter]);

  useEffect(() => {
    async function loadEditAgreements() {
      if (!editMedicalCenter) {
        setEditAgreements([]);
        return;
      }
      try {
        const res = await getConveniosByMedicalCenterAction(editMedicalCenter);
        if (res.success && res.convenios) {
          const options = res.convenios.map((c: any) => ({
            value: c.empresa,
            label: c.empresa,
          }));
          setEditAgreements(options);
        } else {
          setEditAgreements([]);
        }
      } catch (err) {
        console.error(err);
        setEditAgreements([]);
      }
    }
    loadEditAgreements();
  }, [editMedicalCenter]);

  const roleLabels = {
    admin: 'Administrador General',
    internal: 'Administrativo Interno',
    external: 'Profesional',
  };

  async function handleToggleStatus(userId: string, currentStatus: boolean) {
    if (userId === currentUserId) {
      alert('No puedes desactivar tu propia cuenta.');
      return;
    }

    try {
      const result = await toggleUserStatusAction(userId, currentStatus);
      if (result.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, active: !currentStatus } : u));
      } else {
        alert(result.error || 'Error al cambiar el estado');
      }
    } catch (err) {
      alert('Error en el servidor al realizar esta acción.');
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(formElement);

    try {
      const result = await createUserAction(formData);
      if (result.success) {
        setSuccess('Usuario creado exitosamente.');
        formElement.reset();

        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const role = formData.get('role') as any;
        const medical_center = formData.get('medical_center') as string;
        const agreement_type = formData.get('agreement_type') as string;
        const quota_dental = parseInt(formData.get('quota_dental') as string || '0', 10);
        const quota_xray = parseInt(formData.get('quota_xray') as string || '0', 10);
        const institutionIdRaw = formData.get('institution_id') as string;
        const institution_id = institutionIdRaw ? parseInt(institutionIdRaw, 10) : null;
        const selectedInst = institutions.find(i => i.id === institution_id);

        const newUser: User = {
          id: Math.random().toString(), // temporary, they'll get the real UUID on refresh
          name,
          email,
          role,
          active: true,
          created_at: new Date(),
          medical_center,
          agreement_type,
          quota_dental,
          quota_xray,
          used_dental: 0,
          used_xray: 0,
          institution_id,
          institution_name: selectedInst ? selectedInst.name : null,
          inst_quota_dental: selectedInst ? selectedInst.quota_dental : undefined,
          inst_quota_xray: selectedInst ? selectedInst.quota_xray : undefined,
          inst_used_dental: selectedInst ? selectedInst.used_dental : undefined,
          inst_used_xray: selectedInst ? selectedInst.used_xray : undefined,
        };
        setUsers([newUser, ...users]);
        setNewMedicalCenter('');
        setNewAgreementType('');
        setNewInstitutionId('');

        setTimeout(() => {
          setIsModalOpen(false);
          setSuccess(null);
        }, 1500);
      } else {
        setError(result.error || 'Error al crear el usuario');
      }
    } catch (err) {
      setError('Error en el servidor.');
    } finally {
      setLoading(false);
    }
  }

  async function onEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingUser) return;

    const formElement = e.currentTarget;
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(formElement);

    try {
      const result = await updateUserAction(editingUser.id, formData);
      if (result.success) {
        setSuccess('Usuario actualizado exitosamente.');

        // Update user state dynamically
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const role = formData.get('role') as any;
        const professional_title = formData.get('professional_title') as string;
        const professional_position = formData.get('professional_position') as string;
        const professional_email = formData.get('professional_email') as string;
        const professional_address = formData.get('professional_address') as string;
        const professional_website = formData.get('professional_website') as string;
        const professional_phone = formData.get('professional_phone') as string;
        const medical_center = formData.get('medical_center') as string;
        const agreement_type = formData.get('agreement_type') as string;
        const quota_dental = parseInt(formData.get('quota_dental') as string || '0', 10);
        const quota_xray = parseInt(formData.get('quota_xray') as string || '0', 10);
        const institutionIdRaw = formData.get('institution_id') as string;
        const institution_id = institutionIdRaw ? parseInt(institutionIdRaw, 10) : null;
        const selectedInst = institutions.find(i => i.id === institution_id);

        setUsers(users.map(u => u.id === editingUser.id ? {
          ...u,
          name,
          email,
          role,
          professional_title,
          professional_position,
          professional_email,
          professional_address,
          professional_website,
          professional_phone,
          medical_center,
          agreement_type,
          quota_dental,
          quota_xray,
          institution_id,
          institution_name: selectedInst ? selectedInst.name : null,
          inst_quota_dental: selectedInst ? selectedInst.quota_dental : undefined,
          inst_quota_xray: selectedInst ? selectedInst.quota_xray : undefined,
          inst_used_dental: selectedInst ? selectedInst.used_dental : undefined,
          inst_used_xray: selectedInst ? selectedInst.used_xray : undefined,
        } : u));

        setTimeout(() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
          setEditMedicalCenter('');
          setEditAgreementType('');
          setEditInstitutionId('');
          setSuccess(null);
        }, 1500);
      } else {
        setError(result.error || 'Error al actualizar el usuario');
      }
    } catch (err) {
      setError('Error en el servidor.');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitInstitution(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(formElement);

    try {
      const result = await createInstitutionAction(formData);
      if (result.success) {
        setSuccess('Institución creada exitosamente.');
        formElement.reset();
        
        const name = formData.get('name') as string;
        const quotaDental = parseInt(formData.get('quota_dental') as string || '0', 10);
        const quotaXray = parseInt(formData.get('quota_xray') as string || '0', 10);

        const newInst: Institution = {
          id: Math.random(), // Temporary
          name,
          quota_dental: quotaDental,
          quota_xray: quotaXray,
          used_dental: 0,
          used_xray: 0
        };

        setInstitutions([...institutions, newInst]);

        setTimeout(() => {
          setIsInstModalOpen(false);
          setSuccess(null);
        }, 1500);
      } else {
        setError(result.error || 'Error al crear la institución');
      }
    } catch (err) {
      setError('Error en el servidor.');
    } finally {
      setLoading(false);
    }
  }

  async function onEditInstitutionSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingInst) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await updateInstitutionAction(editingInst.id, formData);
      if (result.success) {
        setSuccess('Institución actualizada exitosamente.');

        const name = formData.get('name') as string;
        const quotaDental = parseInt(formData.get('quota_dental') as string || '0', 10);
        const quotaXray = parseInt(formData.get('quota_xray') as string || '0', 10);

        setInstitutions(institutions.map(i => i.id === editingInst.id ? {
          ...i,
          name,
          quota_dental: quotaDental,
          quota_xray: quotaXray
        } : i));

        setTimeout(() => {
          setIsEditInstModalOpen(false);
          setEditingInst(null);
          setSuccess(null);
        }, 1500);
      } else {
        setError(result.error || 'Error al actualizar la institución');
      }
    } catch (err) {
      setError('Error en el servidor.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteInstitution(id: number) {
    if (!confirm('¿Está seguro de eliminar esta institución? Los usuarios vinculados a ella quedarán sin institución y sus cupos se restablecerán.')) {
      return;
    }

    try {
      const result = await deleteInstitutionAction(id);
      if (result.success) {
        setInstitutions(institutions.filter(i => i.id !== id));
        setUsers(users.map(u => u.institution_id === id ? {
          ...u,
          institution_id: null,
          institution_name: null,
          inst_quota_dental: undefined,
          inst_quota_xray: undefined,
          inst_used_dental: undefined,
          inst_used_xray: undefined
        } : u));
      } else {
        alert(result.error || 'Error al eliminar la institución');
      }
    } catch (err) {
      alert('Error en el servidor al realizar esta acción.');
    }
  }


  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Top Title Bar with Dynamic Content */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(20, 184, 166, 0.01) 100%), var(--glass-bg)',
          borderLeft: '4px solid #10b981',
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
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            flexShrink: 0
          }}>
            {activeTab === 'users' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 800, margin: 0 }}>
              {activeTab === 'users' ? 'Gestión de Personal' : 'Gestión de Instituciones'}
            </h2>
            <p style={{ opacity: 0.7, margin: 0, fontSize: '0.9rem' }}>
              {activeTab === 'users' 
                ? 'Registra y administra las cuentas de administrativos internos y profesionales.' 
                : 'Administra las instituciones afiliadas y define sus cuotas generales de atención.'}
            </p>
          </div>
        </div>
        {activeTab === 'users' ? (
          <button onClick={() => setIsModalOpen(true)} className="login-pill-btn" style={{ gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nuevo Funcionario
          </button>
        ) : (
          <button onClick={() => setIsInstModalOpen(true)} className="login-pill-btn" style={{ gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nueva Institución
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
        <button
          onClick={() => { setActiveTab('users'); setError(null); setSuccess(null); }}
          className={`chart-toggle-btn ${activeTab === 'users' ? 'active' : ''}`}
          style={{ borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Users size={16} />
          Gestionar Personal
        </button>
        <button
          onClick={() => { setActiveTab('institutions'); setError(null); setSuccess(null); }}
          className={`chart-toggle-btn ${activeTab === 'institutions' ? 'active' : ''}`}
          style={{ borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Building size={16} />
          Gestionar Instituciones
        </button>
      </div>

      {activeTab === 'users' ? (
        /* Users View */
        <div className="glass-panel" style={{ padding: '24px', overflow: 'hidden' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo Electrónico</th>
                  <th>Rol</th>
                  <th>Institución</th>
                  <th>Cupos Institucionales (Usado / Total)</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ opacity: 0.8 }}>{u.email}</td>
                    <td>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--glass-border)',
                        textTransform: 'uppercase'
                      }}>
                        {roleLabels[u.role] || u.role}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', opacity: (u.institution_name || u.medical_center) ? 0.9 : 0.5, fontWeight: (u.institution_name || u.medical_center) ? 500 : 400 }}>
                        {u.institution_name || u.medical_center || 'No asignado'}
                      </span>
                    </td>
                    <td>
                      {u.role === 'external' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.82rem' }}>
                          <span>
                            <strong>Dentales:</strong> {u.inst_used_dental ?? u.used_dental ?? 0} / {u.inst_quota_dental ?? u.quota_dental ?? 0}
                          </span>
                          <span>
                            <strong>Rayos X:</strong> {u.inst_used_xray ?? u.used_xray ?? 0} / {u.inst_quota_xray ?? u.quota_xray ?? 0}
                          </span>
                        </div>
                      ) : (
                        <span style={{ opacity: 0.4, fontSize: '0.82rem' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${u.active ? 'badge-aprobado' : 'badge-rechazado'}`}>
                        {u.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setEditRole(u.role);
                            setEditMedicalCenter(u.medical_center || '');
                            setEditAgreementType(u.agreement_type || '');
                            setEditInstitutionId(u.institution_id ? String(u.institution_id) : '');
                            setIsEditModalOpen(true);
                          }}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981' }}
                        >
                          Editar
                        </button>
                        {u.id !== currentUserId ? (
                          <button
                            onClick={() => handleToggleStatus(u.id, u.active)}
                            className={u.active ? 'btn-secondary' : 'btn-accent'}
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            {u.active ? 'Desactivar' : 'Activar'}
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', opacity: 0.5, fontStyle: 'italic', padding: '0 8px' }}>Tu cuenta</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Institutions View */
        <div className="glass-panel" style={{ padding: '24px', overflow: 'hidden' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nombre Institución</th>
                  <th>Cupo Dental (Usado / Total)</th>
                  <th>Cupo Radiología (Usado / Total)</th>
                  <th>Estado Cupos</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {institutions.map((i) => (
                  <tr key={i.id}>
                    <td style={{ fontWeight: 600 }}>{i.name}</td>
                    <td>
                      <span style={{ fontWeight: 500 }}>
                        {i.used_dental} / {i.quota_dental}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>
                        {i.used_xray} / {i.quota_xray}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                        <span style={{ color: (i.quota_dental - i.used_dental > 0) ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                          {(i.quota_dental - i.used_dental)} dentales libres
                        </span>
                        <span style={{ color: (i.quota_xray - i.used_xray > 0) ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                          {(i.quota_xray - i.used_xray)} rayos X libres
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          onClick={() => {
                            setEditingInst(i);
                            setIsEditInstModalOpen(true);
                          }}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981' }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteInstitution(i.id)}
                          className="btn-accent"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Nuevo Funcionario" maxWidth="1000px">
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto', paddingRight: '6px' }}>

          {error && (
            <div className="badge-rechazado" style={{ padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          {success && (
            <div className="badge-aprobado" style={{ padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600 }}>
              {success}
            </div>
          )}

          <div className="user-form-container">
            <div className="user-form-column">
              <div className="user-column-header">
                <h4 className="user-column-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  Acceso y Seguridad
                </h4>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Nombre Completo *</label>
                <input className="form-input" type="text" id="name" name="name" required placeholder="Ej: Juan Pérez Morales" disabled={loading} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Correo Electrónico *</label>
                <input className="form-input" type="email" id="email" name="email" required placeholder="ejemplo@tabancura.cl" disabled={loading} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Contraseña Temporal *</label>
                <input className="form-input" type="password" id="password" name="password" required placeholder="••••••••" disabled={loading} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="role">Nivel de Acceso (Rol) *</label>
                <CustomSelect
                  value={newRole}
                  onChange={setNewRole}
                  options={[
                    { value: 'internal', label: 'Administrativo Interno (Revisión y Convenios)' },
                    { value: 'external', label: 'Profesional (Inscripción de Casos)' },
                    { value: 'admin', label: 'Administrador General (Control Total)' }
                  ]}
                  disabled={loading}
                />
                <input type="hidden" name="role" value={newRole} />
              </div>
            </div>

            <div className="user-form-column">
              <div className="user-column-header">
                <h4 className="user-column-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /></svg>
                  Institución y Cargo
                </h4>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="institution_id">Institución *</label>
                <CustomSelect
                  value={newInstitutionId}
                  onChange={(val) => {
                    setNewInstitutionId(val);
                    const instObj = institutions.find(i => String(i.id) === val);
                    setNewMedicalCenter(instObj ? instObj.name : '');
                  }}
                  options={[
                    { value: '', label: 'Seleccione una institución...' },
                    ...institutions.map(i => ({ value: String(i.id), label: i.name }))
                  ]}
                  disabled={loading}
                />
                <input type="hidden" name="institution_id" value={newInstitutionId} />
                <input type="hidden" name="medical_center" value={newMedicalCenter} />
              </div>

              {newMedicalCenter && newAgreements.length > 0 && (
                <div className="form-group">
                  <label className="form-label" htmlFor="agreement_type">Convenio Asignado</label>
                  <CustomSelect
                    value={newAgreementType}
                    onChange={setNewAgreementType}
                    options={newAgreements}
                    disabled={loading}
                  />
                  <input type="hidden" name="agreement_type" value={newAgreementType} />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="professional_title">Profesión / Título</label>
                <input className="form-input" type="text" id="professional_title" name="professional_title" placeholder="Ej: Cirujano Dentista" disabled={loading} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="professional_position">Cargo</label>
                <input className="form-input" type="text" id="professional_position" name="professional_position" placeholder="Ej: Encargado del Programa Odontológico" disabled={loading} />
              </div>
            </div>

            <div className="user-form-column">
              <div className="user-column-header">
                <h4 className="user-column-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  Contacto Profesional
                </h4>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="professional_email">Correo de Contacto</label>
                <input className="form-input" type="email" id="professional_email" name="professional_email" placeholder="Ej: jcasals@vitacura.cl" disabled={loading} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="professional_phone">Teléfono de Contacto</label>
                <input className="form-input" type="text" id="professional_phone" name="professional_phone" placeholder="Ej: +56957558966" disabled={loading} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="professional_address">Dirección de la Institución</label>
                <input className="form-input" type="text" id="professional_address" name="professional_address" placeholder="Ej: Indiana Nº 1195, Vitacura" disabled={loading} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="professional_website">Sitio Web Profesional</label>
                <input className="form-input" type="text" id="professional_website" name="professional_website" placeholder="Ej: www.vitacura.cl" disabled={loading} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingUser(null); }} title="Editar Funcionario" maxWidth="1000px">
        {editingUser && (
          <form onSubmit={onEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto', paddingRight: '6px' }}>

            {error && (
              <div className="badge-rechazado" style={{ padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600 }}>
                {error}
              </div>
            )}

            {success && (
              <div className="badge-aprobado" style={{ padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600 }}>
                {success}
              </div>
            )}

            <div className="user-form-container">
              <div className="user-form-column">
                <div className="user-column-header">
                  <h4 className="user-column-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    Acceso y Seguridad
                  </h4>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit_name">Nombre Completo *</label>
                  <input className="form-input" type="text" id="edit_name" name="name" required defaultValue={editingUser.name} disabled={loading} />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit_email">Correo Electrónico *</label>
                  <input className="form-input" type="email" id="edit_email" name="email" required defaultValue={editingUser.email} disabled={loading} />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit_password">Nueva Contraseña (Opcional)</label>
                  <input className="form-input" type="password" id="edit_password" name="password" placeholder="Dejar en blanco para no cambiarla" disabled={loading} />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit_role">Nivel de Acceso (Rol) *</label>
                  <CustomSelect
                    value={editRole}
                    onChange={setEditRole}
                    options={[
                      { value: 'internal', label: 'Administrativo Interno (Revisión y Convenios)' },
                      { value: 'external', label: 'Profesional (Inscripción de Casos)' },
                      { value: 'admin', label: 'Administrador General (Control Total)' }
                    ]}
                    disabled={loading}
                  />
                  <input type="hidden" name="role" value={editRole} />
                </div>
              </div>

              <div className="user-form-column">
                <div className="user-column-header">
                  <h4 className="user-column-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /></svg>
                    Institución y Cargo
                  </h4>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit_institution_id">Institución Asignada</label>
                  <CustomSelect
                    value={editInstitutionId}
                    onChange={(val) => {
                      setEditInstitutionId(val);
                      const instObj = institutions.find(i => String(i.id) === val);
                      setEditMedicalCenter(instObj ? instObj.name : '');
                    }}
                    options={[
                      { value: '', label: 'Ninguno' },
                      ...institutions.map(i => ({ value: String(i.id), label: i.name }))
                    ]}
                    disabled={loading}
                  />
                  <input type="hidden" name="institution_id" value={editInstitutionId} />
                  <input type="hidden" name="medical_center" value={editMedicalCenter} />
                </div>

                {editMedicalCenter && editAgreements.length > 0 && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit_agreement_type">Convenio Asignado</label>
                    <CustomSelect
                      value={editAgreementType}
                      onChange={setEditAgreementType}
                      options={editAgreements}
                      disabled={loading}
                    />
                    <input type="hidden" name="agreement_type" value={editAgreementType} />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="edit_professional_title">Profesión / Título</label>
                  <input className="form-input" type="text" id="edit_professional_title" name="professional_title" placeholder="Ej: Cirujano Dentista" defaultValue={editingUser.professional_title} disabled={loading} />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit_professional_position">Cargo</label>
                  <input className="form-input" type="text" id="edit_professional_position" name="professional_position" placeholder="Ej: Encargado del Programa Odontológico" defaultValue={editingUser.professional_position} disabled={loading} />
                </div>
              </div>

              <div className="user-form-column">
                <div className="user-column-header">
                  <h4 className="user-column-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                    Contacto Profesional
                  </h4>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit_professional_email">Correo de Contacto</label>
                  <input className="form-input" type="email" id="edit_professional_email" name="professional_email" placeholder="Ej: jcasals@vitacura.cl" defaultValue={editingUser.professional_email} disabled={loading} />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit_professional_phone">Teléfono de Contacto</label>
                  <input className="form-input" type="text" id="edit_professional_phone" name="professional_phone" placeholder="Ej: +56957558966" defaultValue={editingUser.professional_phone} disabled={loading} />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit_professional_address">Dirección de la Institución</label>
                  <input className="form-input" type="text" id="edit_professional_address" name="professional_address" placeholder="Ej: Indiana Nº 1195, Vitacura" defaultValue={editingUser.professional_address} disabled={loading} />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit_professional_website">Sitio Web Profesional</label>
                  <input className="form-input" type="text" id="edit_professional_website" name="professional_website" placeholder="Ej: www.vitacura.cl" defaultValue={editingUser.professional_website} disabled={loading} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }} className="btn-secondary" disabled={loading}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Institution Modal */}
      <Modal isOpen={isInstModalOpen} onClose={() => setIsInstModalOpen(false)} title="Registrar Nueva Institución" maxWidth="500px">
        <form onSubmit={onSubmitInstitution} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div className="badge-rechazado" style={{ padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>{error}</div>}
          {success && <div className="badge-aprobado" style={{ padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>{success}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="inst_name">Nombre de Institución *</label>
            <input className="form-input" type="text" id="inst_name" name="name" required placeholder="Ej: CESFAM Vitacura" disabled={loading} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="inst_quota_dental">Cupo Dental General *</label>
            <input className="form-input" type="number" id="inst_quota_dental" name="quota_dental" required min={0} defaultValue={100} disabled={loading} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="inst_quota_xray">Cupo Radiología General *</label>
            <input className="form-input" type="number" id="inst_quota_xray" name="quota_xray" required min={0} defaultValue={100} disabled={loading} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" onClick={() => setIsInstModalOpen(false)} className="btn-secondary" disabled={loading}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Crear Institución'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit Institution Modal */}
      <Modal isOpen={isEditInstModalOpen} onClose={() => { setIsEditInstModalOpen(false); setEditingInst(null); }} title="Editar Institución" maxWidth="500px">
        {editingInst && (
          <form onSubmit={onEditInstitutionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && <div className="badge-rechazado" style={{ padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>{error}</div>}
            {success && <div className="badge-aprobado" style={{ padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>{success}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="edit_inst_name">Nombre de Institución *</label>
              <input className="form-input" type="text" id="edit_inst_name" name="name" required defaultValue={editingInst.name} disabled={loading} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit_inst_quota_dental">Cupo Dental General *</label>
              <input className="form-input" type="number" id="edit_inst_quota_dental" name="quota_dental" required min={0} defaultValue={editingInst.quota_dental} disabled={loading} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit_inst_quota_xray">Cupo Radiología General *</label>
              <input className="form-input" type="number" id="edit_inst_quota_xray" name="quota_xray" required min={0} defaultValue={editingInst.quota_xray} disabled={loading} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => { setIsEditInstModalOpen(false); setEditingInst(null); }} className="btn-secondary" disabled={loading}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Cambios'}</button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
