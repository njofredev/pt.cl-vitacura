'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { handleLogin, checkEmailExists } from '@/app/actions/authActions';
import ShowcaseInteractive from '@/components/ShowcaseInteractive';

const partnerLogos = [
  { name: 'Municipalidad de Vitacura', path: '/logos_convenios_prevision/mivita_trans.png' },
  { name: 'FONASA', path: '/logos_convenios_prevision/logoFonasa.svg' },
  { name: 'Banmédica', path: '/logos_convenios_prevision/banmedica.png' },
  { name: 'Vida Tres', path: '/logos_convenios_prevision/vidatres.png' },
  { name: 'IMED', path: '/logos_convenios_prevision/logoImed.svg' },
  { name: 'Dentalink', path: '/logos_convenios_prevision/logoDentalink.svg' },
  { name: 'Medilink', path: '/logos_convenios_prevision/logoMedilink.svg' },
  { name: 'Klap', path: '/logos_convenios_prevision/logoKlap.svg' },
  { name: 'Dentsply', path: '/logos_convenios_prevision/logoDentsply.svg' },
  { name: 'DTX', path: '/logos_convenios_prevision/logoDTX.svg' },
  { name: 'Betterland', path: '/logos_convenios_prevision/betterland.png' },
  { name: 'UTFSM', path: '/logos_convenios_prevision/utfsm.png' },
  { name: 'Colegio Everest', path: '/logos_convenios_prevision/colegio_everest.png' },
  { name: 'Santa Úrsula', path: '/logos_convenios_prevision/staursula.png' },
  { name: 'Amanda Labarca', path: '/logos_convenios_prevision/amanda_labarca.png' },
  { name: 'Antártica Chilena', path: '/logos_convenios_prevision/antartica_chilena.png' },
  { name: 'Maestra Luisa Bombal', path: '/logos_convenios_prevision/mraluisabombal.png' },
  { name: 'Sirio', path: '/logos_convenios_prevision/sirio.png' }
];

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Verification states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailChecked, setEmailChecked] = useState(false);

  // Theme Toggle State
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Sincronizar el tema inicial desde localStorage o preferencia de sistema
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(storedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(initialTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(nextTheme);
  };

  async function performEmailVerification() {
    if (!email) {
      setError('Por favor ingrese su correo electrónico');
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setChecking(true);

    try {
      const res = await checkEmailExists(email);
      if (res.success) {
        setEmailChecked(true);
        setShowPassword(false); // Mantener oculta la contraseña por defecto por seguridad
        setPassword(''); // Dejar la contraseña vacía para que el usuario la ingrese de forma segura
        setSuccessMessage('¡Cuenta encontrada! Por favor ingrese su contraseña para ingresar al portal.');
      } else {
        setError(res.error || 'El correo no coincide con ninguna cuenta activa');
      }
    } catch (err) {
      setError('Error al verificar la cuenta en el servidor.');
    } finally {
      setChecking(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Si aún no se ha verificado el correo, buscar la cuenta primero
    if (!emailChecked) {
      await performEmailVerification();
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const result = await handleLogin(null, formData);
      if (result && result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      // Evitar capturar redirecciones internas de Next.js que causan mensajes de error falsos
      if (err.message?.includes('NEXT_REDIRECT') || err.digest?.includes('NEXT_REDIRECT')) {
        throw err;
      }
      setError('Algo salió mal. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyEmail(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    await performEmailVerification();
  }

  function handleResetVerification() {
    setEmailChecked(false);
    setPassword('');
    setSuccessMessage(null);
    setError(null);
  }

  return (
    <main className="login-container">
      {/* Panel Izquierdo: Formulario de Login */}
      <div className="login-form-panel animate-fade-in" style={{ position: 'relative', padding: '64px 32px 40px 32px' }}>
        {/* Floating Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--glass-border)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'hsl(var(--foreground-hsl))',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 10,
            padding: 0
          }}
          aria-label="Cambiar tema"
          title={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'rotate(15deg) scale(1.05)';
            e.currentTarget.style.borderColor = 'hsl(var(--accent-hsl))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
          }}
        >
          {theme === 'dark' ? (
            /* Sun Icon (light mode) */
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'hsl(var(--accent-hsl))' }}>
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            /* Moon Icon (dark mode) */
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'hsl(var(--primary-hsl))' }}>
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
        {/* Bloque Central: Tarjeta de Formulario (Glassmorphic Container) */}
        <div
          className="glass-card animate-fade-in"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            width: '100%',
            maxWidth: '460px',
            margin: '40px auto 0 auto',
            padding: '36px 32px',
            borderRadius: '24px',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          {/* Formulario */}
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Logo y Encabezado integrado dentro de la tarjeta (Centrado y ultra-limpio) */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '14px',
              width: '100%',
              marginBottom: '16px'
            }}>
              <div style={{
                position: 'relative',
                width: '56px',
                height: '56px',
                flexShrink: 0
              }}>
                <Image
                  src="/logo.svg"
                  alt="Policlínico Logo"
                  fill
                  style={{
                    objectFit: 'contain',
                    filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none',
                    transition: 'filter 0.3s ease'
                  }}
                  priority
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                <h1 style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: '1.45rem',
                  letterSpacing: '-0.025em',
                  margin: 0,
                  color: 'hsl(var(--foreground-hsl))',
                  lineHeight: '1.2'
                }}>
                  Portal de Derivación Digital
                </h1>
                <p style={{
                  fontSize: '0.86rem',
                  opacity: 0.65,
                  margin: '2px 0 0 0',
                  lineHeight: '1.45',
                  fontWeight: 500,
                  maxWidth: '340px'
                }}>
                  Realice derivaciones clínicas digitales de forma rápida, segura y 100% en línea.
                </p>
              </div>
            </div>

            {error && (
              <div
                className="badge-rechazado animate-fade-in"
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  lineHeight: '1.4',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {successMessage && (
              <div
                className="badge-aprobado animate-fade-in"
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  lineHeight: '1.4',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  color: 'hsl(var(--success-hsl))'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {successMessage}
              </div>
            )}

            {!emailChecked ? (
              <>
                <div className="form-group" style={{ gap: '8px' }}>
                  <label className="form-label" htmlFor="email" style={{ fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', width: '100%', marginBottom: '12px' }}>
                    Ingrese su correo electrónico
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type="email"
                      id="email"
                      name="email"
                      placeholder="ejemplo@vitacura.cl"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      disabled={checking}
                      style={{
                        width: '100%',
                        paddingLeft: '44px',
                        borderRadius: '12px',
                        height: '50px'
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'hsl(var(--foreground-hsl))',
                      opacity: 0.4,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Verify / Search Button */}
                <button
                  type="submit"
                  className="premium-action-btn"
                  style={{
                    marginTop: '10px',
                    width: '200px',
                    margin: '10px auto 0 auto'
                  }}
                  disabled={checking}
                >
                  {checking ? 'Buscando cuenta...' : 'Buscar cuenta'}
                  <div className="btn-badge">
                    {checking ? (
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2.5px solid rgba(255, 255, 255, 0.2)',
                        borderTop: '2.5px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    )}
                  </div>
                </button>
              </>
            ) : (
              <>
                {/* Email Read-only Display with Change Link */}
                <div className="form-group" style={{ gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', width: '100%', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.8, textAlign: 'center' }}>
                      Correo Electrónico de funcionario
                    </span>
                    <button
                      type="button"
                      onClick={handleResetVerification}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'hsl(var(--accent-hsl))',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: 0
                      }}
                    >
                      Cambiar Correo
                    </button>
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'var(--input-bg)',
                    border: '1.5px solid var(--input-border)',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'hsl(var(--foreground-hsl))',
                    opacity: 0.9,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    {email}
                    {/* Hidden input to pass email to form submission */}
                    <input type="hidden" name="email" value={email} />
                  </div>
                </div>

                {/* Password Input for secure entry */}
                <div className="form-group" style={{ gap: '8px' }}>
                  <label className="form-label" htmlFor="password" style={{ fontSize: '0.85rem', fontWeight: 600, textAlign: 'left', width: '100%' }}>
                    Contraseña de acceso
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      disabled={loading}
                      style={{
                        width: '100%',
                        paddingLeft: '44px',
                        paddingRight: '44px',
                        borderRadius: '12px',
                        height: '50px'
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'hsl(var(--foreground-hsl))',
                      opacity: 0.4,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        padding: '6px',
                        cursor: 'pointer',
                        color: 'hsl(var(--foreground-hsl))',
                        opacity: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'opacity 0.2s',
                        width: 'auto',
                        height: 'auto'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Final Submit Button */}
                <button
                  type="submit"
                  className="premium-action-btn"
                  style={{
                    marginTop: '10px',
                    width: '200px',
                    margin: '10px auto 0 auto'
                  }}
                  disabled={loading}
                >
                  {loading ? 'Iniciando sesión...' : 'Ingresar al Portal'}
                  <div className="btn-badge">
                    {loading ? (
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2.5px solid rgba(255, 255, 255, 0.2)',
                        borderTop: '2.5px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                    )}
                  </div>
                </button>
              </>
            )}

            {/* Pregunta de Soporte y Acceso Unificada (Solo derivaciones) */}
            <div style={{
              marginTop: '16px',
              borderTop: '1px solid var(--glass-border)',
              paddingTop: '18px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '0.78rem', margin: 0, opacity: 0.75, color: 'hsl(var(--foreground-hsl))', lineHeight: '1.5' }}>
                ¿No tienes cuenta, necesitas acceso o tienes problemas con ella? <br />
                Escríbenos a{' '}
                <a
                  href="mailto:derivaciones@policlinicotabancura.cl"
                  style={{
                    color: 'hsl(var(--accent-hsl))',
                    textDecoration: 'underline',
                    fontWeight: 700
                  }}
                >
                  derivaciones@policlinicotabancura.cl
                </a>
              </p>
            </div>
          </form>
        </div>

        {/* Pie de Página del Formulario */}
        <div style={{
          fontSize: '0.82rem',
          opacity: 0.5,
          textAlign: 'center',
          borderTop: '1px solid var(--glass-border)',
          paddingTop: '24px',
          fontWeight: 500,
          width: '100%',
          maxWidth: '460px',
          margin: '24px auto 0 auto'
        }}>
          Acceso privado restringido a personal autorizado.
        </div>
      </div>

      {/* Panel Derecho: Gradiente y Cita Testimonial */}
      <div className="login-sidebar-panel animate-fade-in" style={{ zIndex: 2 }}>

        {/* Componente Interactivo de Demostración Clínica */}
        <ShowcaseInteractive />

        {/* Footer del Sidebar con Alianzas y Previsiones (Carrusel) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 10, width: '100%', overflow: 'hidden' }}>
          <span style={{
            fontSize: '0.72rem',
            color: 'rgba(255, 255, 255, 0.45)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontWeight: 700
          }}>
            ¿Conoces nuestras alianzas y previsiones?
          </span>
          <div
            className="marquee-container"
          >
            <div className="marquee-track">
              {partnerLogos.map((logo, idx) => (
                <div
                  key={`logo-1-${idx}`}
                  className="marquee-item"
                  title={logo.name}
                >
                  <img
                    src={logo.path}
                    alt={logo.name}
                    className="marquee-img"
                    loading="lazy"
                  />
                </div>
              ))}
              {/* Duplicar para efecto infinito continuo */}
              {partnerLogos.map((logo, idx) => (
                <div
                  key={`logo-2-${idx}`}
                  className="marquee-item"
                  title={logo.name}
                >
                  <img
                    src={logo.path}
                    alt={logo.name}
                    className="marquee-img"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        body {
          padding-left: 0 !important; /* Anula el padding del sidebar en la pantalla de login */
        }

        .dark .login-form-panel {
          background-color: #0c0e12 !important;
        }

        .light .login-form-panel {
          background-color: #f7f5f0 !important;
        }

        .dark .glass-card {
          background: rgba(18, 22, 28, 0.65) !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3) !important;
        }

        .light .glass-card {
          background: rgba(255, 255, 255, 0.7) !important;
          border: 1px solid rgba(139, 131, 114, 0.12) !important;
          box-shadow: 0 10px 30px rgba(139, 131, 114, 0.05) !important;
        }

        .dark .form-input {
          background-color: rgba(3, 6, 12, 0.8) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
        }

        .dark .form-input:focus {
          border-color: rgba(255, 255, 255, 0.25) !important;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2) !important;
        }



        .marquee-container {
          overflow: hidden;
          user-select: none;
          display: flex;
          position: relative;
          width: 100%;
          mask-image: linear-gradient(to right, transparent, white 15%, white 85%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, white 15%, white 85%, transparent);
        }

        .marquee-track {
          display: flex;
          align-items: center;
          gap: 48px;
          width: max-content;
          animation: marquee-scroll 55s linear infinite;
        }

        @keyframes marquee-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .marquee-item {
          flex-shrink: 0;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .marquee-img {
          max-height: 100%;
          max-width: 175px;
          width: auto;
          object-fit: contain;
          opacity: 0.45;
          filter: grayscale(100%) brightness(1.8) contrast(0.8);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .marquee-img:hover {
          opacity: 0.85;
          filter: grayscale(0%) brightness(1.2);
        }
      `}</style>
    </main>
  );
}
