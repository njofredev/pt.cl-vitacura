'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { handleLogout } from '@/app/actions/authActions';
import { UserSession } from '@/lib/auth';

interface SidebarProps {
  user: UserSession;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  // Detect screen size to close sidebar on mobile by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Theme Toggle State
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Search State
  const [searchVal, setSearchVal] = useState('');

  // Dynamic Clock and greeting states
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [saludo, setSaludo] = useState('Buenos tardes');

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

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      
      // Hour format: hh:mm:ss p.m.
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
      
      // Determine greeting based on time of day
      if (hours >= 6 && hours < 12) {
        setSaludo('Buenos días');
      } else if (hours >= 12 && hours < 20) {
        setSaludo('Buenas tardes');
      } else {
        setSaludo('Buenas noches');
      }
      
      hours = hours % 12;
      hours = hours ? hours : 12; // '0' becomes '12'
      const formattedHours = hours.toString().padStart(2, '0');
      
      setTimeStr(`${formattedHours}:${minutes}:${seconds} ${ampm}`);
      
      // Date format: VIERNES, 22 MAY
      const dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
      const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
      const diaSemana = dias[now.getDay()];
      const diaMes = now.getDate();
      const mes = meses[now.getMonth()];
      
      setDateStr(`${diaSemana}, ${diaMes} ${mes}`);
    }
    
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      roles: ['admin', 'internal', 'external'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
      )
    },
    {
      name: 'Casos Sociales',
      path: '/dashboard/cases',
      roles: ['admin', 'internal', 'external'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      )
    },
    {
      name: 'Inscribir Persona',
      path: '/dashboard/register',
      roles: ['admin', 'external'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
      )
    },
    {
      name: 'Gestionar Usuarios',
      path: '/dashboard/users',
      roles: ['admin'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      )
    }
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

  const roleLabels = {
    admin: 'Administrador General',
    internal: 'Administrativo Interno',
    external: 'Profesional',
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="mobile-nav-toggle btn-secondary"
        style={{
          position: 'fixed',
          top: '15px',
          left: isOpen ? '230px' : '15px',
          zIndex: 100,
          display: 'none',
          padding: '8px',
          borderRadius: 'var(--radius-sm)',
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        )}
      </button>

      {/* Backdrop overlay on mobile when sidebar is open */}
      {isOpen && (
        <div 
          className="mobile-sidebar-backdrop"
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 85,
            display: 'none'
          }}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`glass-panel ${isOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}
        style={{
          width: isOpen ? '280px' : '80px',
          height: 'calc(100vh - 30px)',
          margin: '15px',
          position: 'fixed',
          top: 0,
          left: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 16px',
          zIndex: 90,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Top Branding Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            paddingLeft: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              minWidth: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxSizing: 'border-box'
            }}>
              <img 
                src="/logo.svg" 
                alt="Logo Policlínico Tabancura" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain'
                }} 
              />
            </div>
            {isOpen && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ 
                  fontFamily: 'var(--font-display)', 
                  fontWeight: 800, 
                  fontSize: '1.05rem',
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                  color: 'hsl(var(--foreground-hsl))'
                }}>
                  Policlínico Tabancura
                </span>
                <span style={{ 
                  fontSize: '0.62rem', 
                  fontWeight: 800, 
                  textTransform: 'uppercase',
                  color: 'hsl(var(--accent-hsl))',
                  letterSpacing: '0.08em',
                  opacity: 0.95
                }}>
                  REGISTRO DIGITAL SOCIAL
                </span>
              </div>
            )}
          </div>

          {/* Simulated Search Bar */}
          {isOpen ? (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (searchVal.trim()) {
                  window.location.href = `/dashboard/cases?search=${encodeURIComponent(searchVal.trim())}`;
                }
              }}
              style={{
                padding: '0 4px',
                marginBottom: '2px'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--glass-border)',
                fontSize: '0.82rem',
                color: 'hsl(var(--foreground-hsl))',
                opacity: 0.85
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input 
                    type="text" 
                    placeholder="Buscar en la app..." 
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'hsl(var(--foreground-hsl))',
                      fontSize: '0.82rem',
                      width: '100%',
                      padding: 0
                    }}
                  />
                </div>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  opacity: 0.8,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--glass-border)',
                  whiteSpace: 'nowrap'
                }}>
                  Enter
                </span>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
              <div 
                onClick={() => {
                  window.location.href = '/dashboard/cases';
                }}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.6,
                  cursor: 'pointer'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
            </div>
          )}

          {/* Menu Section Label */}
          {isOpen && (
            <span style={{ 
              fontSize: '0.68rem', 
              fontWeight: 700, 
              opacity: 0.4, 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em',
              paddingLeft: '12px',
              marginTop: '4px',
              marginBottom: '-6px'
            }}>
              Menú Principal
            </span>
          )}

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredMenu.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  href={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 16px',
                    borderRadius: '9999px',
                    color: isActive ? '#022c22' : 'hsl(var(--foreground-hsl))',
                    backgroundColor: isActive ? '#10b981' : 'transparent',
                    textDecoration: 'none',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.95rem',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none',
                    opacity: isActive ? 1 : 0.8
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.opacity = '1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.opacity = '0.8';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </div>
                  {isOpen && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User & Clock Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* User Account Badge */}
          <div style={{ 
            padding: '12px 8px', 
            borderTop: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              minWidth: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: '#10b981',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.05)',
              flexShrink: 0
            }}>
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            {isOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user.name}
                </span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  opacity: 0.6,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {roleLabels[user.role]}
                </span>
              </div>
            )}
          </div>

          {/* Dynamic Clock Widget */}
          {isOpen ? (
            <div style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, opacity: 0.75, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {saludo} <span style={{ fontSize: '0.85rem' }}>{saludo === 'Buenos días' ? '☀️' : saludo === 'Buenas tardes' ? '🌤️' : '🌙'}</span>
                </span>
                <div style={{
                  color: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  padding: '6px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '26px',
                  height: '26px'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
              </div>
              <strong style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'hsl(var(--foreground-hsl))', letterSpacing: '-0.02em' }}>
                {timeStr || '00:00:00 a.m.'}
              </strong>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {dateStr || 'Cargando fecha...'}
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                cursor: 'pointer'
              }} title={timeStr}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isOpen ? 'space-between' : 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--glass-border)',
              color: 'hsl(var(--foreground-hsl))',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxSizing: 'border-box'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.borderColor = 'var(--glass-border)';
              e.currentTarget.style.transform = 'none';
            }}
            title={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme === 'dark' ? 'hsl(var(--accent-hsl))' : 'hsl(var(--primary-hsl))',
                transition: 'transform 0.5s ease',
                transform: theme === 'dark' ? 'rotate(0deg)' : 'rotate(360deg)',
                flexShrink: 0
              }}>
                {theme === 'dark' ? (
                  /* Sun Icon (light mode trigger) */
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                  /* Moon Icon (dark mode trigger) */
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </div>
              {isOpen && (
                <span style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                </span>
              )}
            </div>
            {isOpen && (
              <div style={{
                width: '38px',
                height: '20px',
                borderRadius: '9999px',
                backgroundColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                border: theme === 'dark' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(0, 0, 0, 0.15)',
                position: 'relative',
                transition: 'all 0.3s ease',
                flexShrink: 0
              }}>
                <div style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: theme === 'dark' ? '#10b981' : 'hsl(var(--primary-hsl))',
                  position: 'absolute',
                  top: '2px',
                  left: theme === 'dark' ? '20px' : '2px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />
              </div>
            )}
          </button>

          {/* Logout Button */}
          <button 
            onClick={() => handleLogout()}
            className="btn-secondary"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isOpen ? 'flex-start' : 'center',
              gap: '14px',
              padding: '12px 14px',
              borderRadius: '9999px',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'hsl(var(--danger-hsl))',
              border: '1px solid transparent',
              backgroundColor: 'transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {isOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* CSS injected to handle responsiveness and collapse margins */}
      <style jsx global>{`
        .main-content {
          margin-left: ${isOpen ? '310px' : '110px'};
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (max-width: 768px) {
          .mobile-nav-toggle {
            display: inline-flex !important;
          }
          .mobile-sidebar-backdrop {
            display: block !important;
          }
          aside {
            transform: translateX(${isOpen ? '0' : '-300px'}) !important;
            width: 280px !important;
            margin: 0 !important;
            height: 100vh !important;
            border-radius: 0 !important;
            background: hsl(var(--card-hsl)) !important;
          }
          .main-content {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </>
  );
}
