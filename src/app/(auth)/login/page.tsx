'use client';

import React, { useState } from 'react';
import { handleLogin } from '@/app/actions/authActions';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await handleLogin(null, formData);
      if (result && result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('Algo salió mal. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Premium Visual Background Elements */}
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0) 70%)',
        top: '-150px',
        left: '-150px',
        zIndex: -1
      }} />
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(20, 184, 166, 0.12) 0%, rgba(20, 184, 166, 0) 70%)',
        bottom: '-150px',
        right: '-150px',
        zIndex: -1
      }} />

      {/* Login Card */}
      <div 
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '40px 32px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px'
        }}
      >
        {/* Branding header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, hsl(var(--primary-hsl)) 0%, hsl(var(--accent-hsl)) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: '1.4rem',
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
            marginBottom: '12px'
          }}>
            PT
          </div>
          <h1 style={{ 
            fontFamily: 'var(--font-display)', 
            fontWeight: 800, 
            fontSize: '1.8rem',
            textAlign: 'center',
            letterSpacing: '-0.02em',
            margin: 0
          }}>
            Policlínico Tabancura
          </h1>
          <p style={{ 
            fontSize: '0.9rem', 
            opacity: 0.7, 
            textAlign: 'center',
            margin: 0,
            fontWeight: 500
          }}>
            Convenios y Casos Sociales
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {error && (
            <div 
              className="badge-rechazado"
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                lineHeight: '1.4'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Correo Electrónico
            </label>
            <input 
              className="form-input" 
              type="email" 
              id="email" 
              name="email" 
              placeholder="ejemplo@tabancura.cl" 
              required 
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="password">
                Contraseña
              </label>
            </div>
            <input 
              className="form-input" 
              type="password" 
              id="password" 
              name="password" 
              placeholder="••••••••" 
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ 
              marginTop: '10px',
              padding: '14px 18px',
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)'
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '8px'
                }} />
                Iniciando sesión...
              </>
            ) : (
              'Ingresar al Portal'
            )}
          </button>
        </form>

        <div style={{ 
          fontSize: '0.8rem', 
          opacity: 0.5, 
          textAlign: 'center',
          borderTop: '1px solid var(--glass-border)',
          paddingTop: '20px',
          fontWeight: 500
        }}>
          Acceso privado restringido a personal autorizado.
        </div>
      </div>
      
      <style jsx global>{`
        body {
          padding-left: 0 !important; /* Overrides the sidebar padding on login screen */
        }
      `}</style>
    </main>
  );
}
