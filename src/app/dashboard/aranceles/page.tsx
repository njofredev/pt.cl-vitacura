import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ArancelManager from '@/components/ArancelManager';
import PageHeader from '@/components/ui/PageHeader';
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

      {/* Title Header */}
      <PageHeader
        title="Aranceles"
        description="Seleccione qué prestaciones dentales de la plataforma Dentalink se mostrarán en el odontograma interactivo."
      />

      {/* Main interactive ArancelManager */}
      <ArancelManager />

    </div>
  );
}
