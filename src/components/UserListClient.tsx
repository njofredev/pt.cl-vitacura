'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { createUserAction, toggleUserStatusAction } from '@/app/actions/userActions';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'internal' | 'external';
  active: boolean;
  created_at: Date;
}

interface UserListClientProps {
  initialUsers: User[];
  currentUserId: string;
}

export default function UserListClient({ initialUsers, currentUserId }: UserListClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const roleLabels = {
    admin: 'Administrador General',
    internal: 'Administrativo Interno',
    external: 'Administrativo Externo',
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
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await createUserAction(formData);
      if (result.success) {
        setSuccess('Usuario creado exitosamente.');
        e.currentTarget.reset();
        
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

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Title Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 800, margin: 0 }}>
            Gestión de Personal
          </h2>
          <p style={{ opacity: 0.7, margin: 0, fontSize: '0.9rem' }}>
            Registra y administra las cuentas de administrativos internos y externos.
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ boxShadow: '0 4px 15px rgba(59, 130, 246, 0.25)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          Nuevo Administrativo
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
                    {u.id !== currentUserId ? (
                      <button 
                        onClick={() => handleToggleStatus(u.id, u.active)}
                        className={u.active ? 'btn-secondary' : 'btn-accent'}
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        {u.active ? 'Desactivar' : 'Activar'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', opacity: 0.5, fontStyle: 'italic', paddingRight: '12px' }}>Tu cuenta</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Nuevo Administrativo">
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
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

          <div className="form-group">
            <label className="form-label" htmlFor="name">Nombre Completo</label>
            <input className="form-input" type="text" id="name" name="name" required placeholder="Ej: Juan Pérez Morales" disabled={loading} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Correo Electrónico</label>
            <input className="form-input" type="email" id="email" name="email" required placeholder="ejemplo@tabancura.cl" disabled={loading} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña Temporal</label>
            <input className="form-input" type="password" id="password" name="password" required placeholder="••••••••" disabled={loading} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="role">Nivel de Acceso (Rol)</label>
            <select className="form-select" id="role" name="role" required disabled={loading} style={{ backgroundColor: 'hsl(var(--card-hsl))' }}>
              <option value="internal">Administrativo Interno (Revisión y Convenios)</option>
              <option value="external">Administrativo Externo (Inscripción de Casos)</option>
              <option value="admin">Administrador General (Control Total)</option>
            </select>
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
    </div>
  );
}
