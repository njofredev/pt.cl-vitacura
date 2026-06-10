'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/ui/CustomSelect';
import { createUserAction, toggleUserStatusAction, updateUserAction } from '@/app/actions/userActions';
import { getConveniosByMedicalCenterAction } from '@/app/actions/convenioActions';

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
}

interface UserListClientProps {
  initialUsers: User[];
  currentUserId: string;
}

export default function UserListClient({ initialUsers, currentUserId }: UserListClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [newRole, setNewRole] = useState('internal');
  const [editRole, setEditRole] = useState('internal');
  const [newMedicalCenter, setNewMedicalCenter] = useState('');
  const [editMedicalCenter, setEditMedicalCenter] = useState('');

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

        // Let's reload users dynamically or tell them to refresh.
        // Actually, since we updated server cache via revalidatePath, 
        // we can just reload the window or manually append to state for immediate responsiveness.
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const role = formData.get('role') as any;
        const medical_center = formData.get('medical_center') as string;
        const agreement_type = formData.get('agreement_type') as string;

        const newUser: User = {
          id: Math.random().toString(), // temporary, they'll get the real UUID on refresh
          name,
          email,
          role,
          active: true,
          created_at: new Date(),
          medical_center,
          agreement_type,
        };
        setUsers([newUser, ...users]);
        setNewMedicalCenter('');
        setNewAgreementType('');

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
          agreement_type
        } : u));

        setTimeout(() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
          setEditMedicalCenter('');
          setEditAgreementType('');
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


  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Top Title Bar with Glowing Lucide Icon Container and Button inside */}
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
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 800, margin: 0 }}>
              Gestión de Personal
            </h2>
            <p style={{ opacity: 0.7, margin: 0, fontSize: '0.9rem' }}>
              Registra y administra las cuentas de administrativos internos y profesionales.
            </p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="premium-action-btn">
          Nuevo Funcionario
          <div className="btn-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
          </div>
        </button>
      </div>

      {/* Main Glass Table Container */}
      <div className="glass-panel" style={{ padding: '24px', overflow: 'hidden' }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo Electrónico</th>
                <th>Rol</th>
                <th>Institución</th>
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
                    <span style={{ fontSize: '0.85rem', opacity: u.medical_center ? 0.9 : 0.5, fontWeight: u.medical_center ? 500 : 400 }}>
                      {u.medical_center || 'No asignado'}
                    </span>
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
                <label className="form-label" htmlFor="medical_center">Institución</label>
                <CustomSelect
                  value={newMedicalCenter}
                  onChange={setNewMedicalCenter}
                  options={[
                    { value: '', label: 'Ninguno (Selección libre)' },
                    { value: 'CESFAM Vitacura', label: 'CESFAM Vitacura' },
                    { value: 'CESFAM Lo Barnechea', label: 'CESFAM Lo Barnechea' },
                    { value: 'Consultorio Dr. Aníbal Ariztía', label: 'Consultorio Dr. Aníbal Ariztía' },
                    { value: 'Policlinico Tabancura', label: 'Policlínico Tabancura' }
                  ]}
                  disabled={loading}
                />
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
                  <label className="form-label" htmlFor="edit_medical_center">Institución Asignada</label>
                  <CustomSelect
                    value={editMedicalCenter}
                    onChange={setEditMedicalCenter}
                    options={[
                      { value: '', label: 'Ninguno (Selección libre)' },
                      { value: 'CESFAM Vitacura', label: 'CESFAM Vitacura' },
                      { value: 'CESFAM Lo Barnechea', label: 'CESFAM Lo Barnechea' },
                      { value: 'Consultorio Dr. Aníbal Ariztía', label: 'Consultorio Dr. Aníbal Ariztía' },
                      { value: 'Policlinico Tabancura', label: 'Policlínico Tabancura' }
                    ]}
                    disabled={loading}
                  />
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
    </div>
  );
}
