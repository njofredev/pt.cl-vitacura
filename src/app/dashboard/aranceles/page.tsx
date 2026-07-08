import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ArancelManager from '@/components/ArancelManager';
import { Sparkles, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Aranceles | Policlínico Tabancura',
  description: 'Gestione las prestaciones dentales del odontograma interactivo.',
};

export default async function ArancelesPage() {
  const session = await getSession();

  // Validate admin permission
  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'admin') {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        <div className="glass-panel" style={{
          padding: '40px',
          maxWidth: '480px',
          textAlign: 'center',
          borderLeft: '4px solid hsl(var(--danger-hsl))'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'hsl(var(--danger-hsl))', marginBottom: '12px' }}>
            Acceso Restringido
          </h2>
          <p style={{ opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
            No tiene los permisos necesarios para acceder a esta área de configuración de aranceles.
            Esta página está reservada exclusivamente para Administradores Generales.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Title Header with Glowing Lucide Shield Icon */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 30px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(20, 184, 166, 0.01) 100%), var(--glass-bg)',
          borderLeft: '4px solid #10b981',
          borderRadius: 'var(--radius-md)'
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
          <ShieldCheck size={26} style={{ strokeWidth: 2.2 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 800, margin: 0 }}>
            Aranceles
          </h2>
          <p style={{ opacity: 0.7, margin: 0, fontSize: '0.9rem' }}>
            Seleccione qué prestaciones dentales de la plataforma Dentalink se mostrarán en el odontograma interactivo.
          </p>
        </div>
      </div>

      {/* Main interactive ArancelManager */}
      <ArancelManager />

    </div>
  );
}
