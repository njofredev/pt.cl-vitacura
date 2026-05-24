'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { createUserAction, toggleUserStatusAction, updateUserAction } from '@/app/actions/userActions';

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
        
        const newUser: User = {
          id: Math.random().toString(), // temporary, they'll get the real UUID on refresh
          name,
          email,
          role,
          active: true,
          created_at: new Date(),
        };
        setUsers([newUser, ...users]);
        
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
          professional_phone
        } : u));

        setTimeout(() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
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
      
      {/* Top Title Bar */}
      {/* Top Title Bar with Glowing Lucide Icon Container */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
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
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
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
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ boxShadow: '0 4px 15px rgba(59, 130, 246, 0.25)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          Nuevo Funcionario
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Nuevo Funcionario">
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

          <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '6px', marginBottom: '4px' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Información de Acceso
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
            <select className="form-select" id="role" name="role" required disabled={loading} style={{ backgroundColor: 'hsl(var(--card-hsl))' }}>
              <option value="internal">Administrativo Interno (Revisión y Convenios)</option>
              <option value="external">Profesional (Inscripción de Casos)</option>
              <option value="admin">Administrador General (Control Total)</option>
            </select>
          </div>

          <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '6px', marginTop: '8px', marginBottom: '4px' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Firma y Datos Profesionales (Opcional)
            </h4>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="professional_title">Profesión / Título</label>
            <input className="form-input" type="text" id="professional_title" name="professional_title" placeholder="Ej: Cirujano Dentista" disabled={loading} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="professional_position">Cargo</label>
            <input className="form-input" type="text" id="professional_position" name="professional_position" placeholder="Ej: Encargado del Programa Odontológico" disabled={loading} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="professional_email">Correo de Contacto Profesional</label>
            <input className="form-input" type="email" id="professional_email" name="professional_email" placeholder="Ej: jcasals@vitacura.cl" disabled={loading} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="professional_address">Dirección del Centro</label>
            <input className="form-input" type="text" id="professional_address" name="professional_address" placeholder="Ej: Indiana Nº 1195, Vitacura" disabled={loading} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="professional_website">Sitio Web Profesional</label>
            <input className="form-input" type="text" id="professional_website" name="professional_website" placeholder="Ej: www.vitacura.cl" disabled={loading} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="professional_phone">Teléfono de Contacto</label>
            <input className="form-input" type="text" id="professional_phone" name="professional_phone" placeholder="Ej: +56957558966" disabled={loading} />
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
      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingUser(null); }} title="Editar Funcionario">
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

            <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '6px', marginBottom: '4px' }}>
              <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Información de Acceso
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
              <select className="form-select" id="edit_role" name="role" required defaultValue={editingUser.role} disabled={loading} style={{ backgroundColor: 'hsl(var(--card-hsl))' }}>
                <option value="internal">Administrativo Interno (Revisión y Convenios)</option>
                <option value="external">Profesional (Inscripción de Casos)</option>
                <option value="admin">Administrador General (Control Total)</option>
              </select>
            </div>

            <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '6px', marginTop: '8px', marginBottom: '4px' }}>
              <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Firma y Datos Profesionales (Autocompletado)
              </h4>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit_professional_title">Profesión / Título</label>
              <input className="form-input" type="text" id="edit_professional_title" name="professional_title" placeholder="Ej: Cirujano Dentista" defaultValue={editingUser.professional_title} disabled={loading} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit_professional_position">Cargo</label>
              <input className="form-input" type="text" id="edit_professional_position" name="professional_position" placeholder="Ej: Encargado del Programa Odontológico" defaultValue={editingUser.professional_position} disabled={loading} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit_professional_email">Correo de Contacto Profesional</label>
              <input className="form-input" type="email" id="edit_professional_email" name="professional_email" placeholder="Ej: jcasals@vitacura.cl" defaultValue={editingUser.professional_email} disabled={loading} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit_professional_address">Dirección del Centro</label>
              <input className="form-input" type="text" id="edit_professional_address" name="professional_address" placeholder="Ej: Indiana Nº 1195, Vitacura" defaultValue={editingUser.professional_address} disabled={loading} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit_professional_website">Sitio Web Profesional</label>
              <input className="form-input" type="text" id="edit_professional_website" name="professional_website" placeholder="Ej: www.vitacura.cl" defaultValue={editingUser.professional_website} disabled={loading} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit_professional_phone">Teléfono de Contacto</label>
              <input className="form-input" type="text" id="edit_professional_phone" name="professional_phone" placeholder="Ej: +56957558966" defaultValue={editingUser.professional_phone} disabled={loading} />
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
