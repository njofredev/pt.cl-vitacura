'use client';

import React, { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
  category: 'general' | 'roles' | 'dentalink' | 'cases';
  allowedRoles: ('admin' | 'internal' | 'external' | 'reader')[];
}

interface HelpPageClientProps {
  userRole: 'admin' | 'internal' | 'external' | 'reader';
}

export default function HelpPageClient({ userRole }: HelpPageClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      category: 'general',
      question: '¿Qué es el Correlativo Anual (ID) de los casos?',
      answer: 'Es un identificador único en formato "0001", "0002" asignado automáticamente a cada caso social derivado. Este número se genera correlativamente basado en el año de registro para mantener una trazabilidad organizada y simple.',
      allowedRoles: ['admin', 'internal', 'external', 'reader']
    },
    {
      category: 'cases',
      question: '¿Cómo funciona la Derivación Digital?',
      answer: 'Los usuarios de rol Externo (profesionales externos) pueden inscribir nuevos casos ingresando los datos del postulante, seleccionando el convenio y rellenando el Odontograma Clínico Interactivo (Adulto o Infantil). Al seleccionar un convenio, el sistema pre-carga automáticamente la información de contacto registrada.',
      allowedRoles: ['admin', 'external']
    },
    {
      category: 'dentalink',
      question: '¿Cómo se sincronizan los convenios con Dentalink?',
      answer: 'El sistema se conecta directamente con la API de Dentalink. A través del módulo "Ingreso Dentalink", se descargan los convenios y procedimientos vigentes. Esto actualiza la base de datos local y permite asignar convenios reales a los usuarios sin necesidad de crearlos de forma manual.',
      allowedRoles: ['admin', 'internal']
    },
    {
      category: 'general',
      question: '¿Por qué no puedo añadir o eliminar instituciones manualmente?',
      answer: 'Para mantener la consistencia con Dentalink, la creación y eliminación manual de instituciones está deshabilitada. Todo el flujo de centros médicos e instituciones se gestiona importando la información real directamente desde Dentalink.',
      allowedRoles: ['admin']
    },
    {
      category: 'cases',
      question: '¿Qué significan los diferentes estados de un caso?',
      answer: '• Ingresado: Derivación registrada por el usuario Externo.\n• Sincronizado: Datos validados y sincronizados con Dentalink.\n• Agendado: Cita médica coordinada para el paciente.\n• En Tratamiento: Paciente realizando sus procedimientos.\n• Finalizado: Tratamiento concluido con éxito.',
      allowedRoles: ['admin', 'internal', 'external', 'reader']
    },
    {
      category: 'roles',
      question: '¿Qué acciones realiza el rol Interno?',
      answer: 'Los usuarios de rol Interno son responsables de revisar los casos entrantes en la "Bandeja de Casos Sociales", evaluar la pertinencia del caso, actualizar sus estados y sincronizar el paciente final con la plataforma de Dentalink.',
      allowedRoles: ['admin', 'internal']
    }
  ];

  // Filter FAQs by user role and search query
  const filteredFaqs = faqs.filter(faq => {
    const matchesRole = faq.allowedRoles.includes(userRole);
    if (!matchesRole) return false;

    const matchesSearch = 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleAccordion = (index: number) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Title banner */}
      <div
        className="glass-panel"
        style={{
          padding: '30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(20, 184, 166, 0.01) 100%), var(--glass-bg)',
          borderLeft: '4px solid #10b981',
          borderRadius: 'var(--radius-md)',
          width: '100%',
          flexWrap: 'wrap',
          gap: '20px'
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
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 800, margin: 0 }}>
              Centro de Ayuda y Guía de Uso
            </h2>
            <p style={{ opacity: 0.7, margin: 0, fontSize: '0.9rem' }}>
              Encuentre tutoriales, documentación de módulos y respuestas a preguntas frecuentes sobre la plataforma.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Role Guide Cards (Filtered by User Role) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Card: Externo (Visible to Admin and External) */}
        {(userRole === 'admin' || userRole === 'external' || userRole === 'reader') && (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.75rem' }}>🩺</span>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Rol Externo</h3>
            </div>
            <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0, lineHeight: '1.5' }}>
              Acceso para profesionales externos al Policlínico. Permite registrar nuevos postulantes a convenios y hacer seguimiento interactivo a sus derivaciones dentales y de rayos X.
            </p>
            <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', opacity: 0.7, margin: '8px 0 0 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Creación rápida de casos mediante formulario de derivación digital.</li>
              <li>Uso del Odontograma interactivo para marcar tratamientos específicos.</li>
              <li>Autocompletado de datos del convenio seleccionado.</li>
            </ul>
          </div>
        )}

        {/* Card: Lector (Visible to Admin and Reader) */}
        {(userRole === 'admin' || userRole === 'reader') && (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.75rem' }}>📖</span>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Rol Lector</h3>
            </div>
            <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0, lineHeight: '1.5' }}>
              Acceso de consulta para profesionales de convenios. Permite visualizar la información de los casos de su institución asignada y exportar reportes.
            </p>
            <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', opacity: 0.7, margin: '8px 0 0 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Consulta de bandeja de casos pertenecientes a su convenio/institución.</li>
              <li>Revisión de detalles clínicos y de diagnóstico (modo lectura).</li>
              <li>Reportería y análisis de estadísticas de los casos ingresados.</li>
            </ul>
          </div>
        )}

        {/* Card: Interno (Visible to Admin and Internal) */}
        {(userRole === 'admin' || userRole === 'internal') && (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.75rem' }}>🖥️</span>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Rol Interno</h3>
            </div>
            <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0, lineHeight: '1.5' }}>
              Acceso para funcionarios del Policlínico. Administran la bandeja de casos sociales y validan las derivaciones para agendamientos y sincronizaciones.
            </p>
            <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', opacity: 0.7, margin: '8px 0 0 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Control de estados de derivación (Ingresado, Agendado, En Tratamiento, Finalizado).</li>
              <li>Evaluación clínica de tratamientos y asignación de observaciones.</li>
              <li>Sincronización directa del paciente evaluado con Dentalink.</li>
            </ul>
          </div>
        )}

        {/* Card: Admin (Visible to Admin only) */}
        {userRole === 'admin' && (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.75rem' }}>⚙️</span>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Rol Admin</h3>
            </div>
            <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0, lineHeight: '1.5' }}>
              Acceso completo al sistema de auditorías, gestión de aranceles, usuarios, instituciones, convenios y configuraciones de sincronización de la API de Dentalink.
            </p>
            <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', opacity: 0.7, margin: '8px 0 0 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Edición directa de datos clínicos e información en fichas sociales.</li>
              <li>Gestión de credenciales, roles y convenios asignados.</li>
              <li>Registro de auditoría del sistema de acciones críticas realizadas por usuarios.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Main Section: Search and Interactive Accordion FAQs */}
      <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Category & Search Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'general', label: 'General' },
              { id: 'cases', label: 'Derivaciones' },
              ...(userRole !== 'external' ? [{ id: 'dentalink', label: 'Dentalink API' }] : []),
              ...(userRole === 'admin' ? [{ id: 'roles', label: 'Roles' }] : [])
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`btn ${activeCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: '20px' }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div style={{ minWidth: '280px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Buscar en preguntas frecuentes..."
              className="form-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '40px' }}
            />
            <div style={{ position: 'absolute', left: '14px', top: '14px', opacity: 0.5 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
          </div>
        </div>

        {/* FAQs Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredFaqs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.6 }}>
              No se encontraron preguntas frecuentes que coincidan con su búsqueda.
            </div>
          ) : (
            filteredFaqs.map((faq, index) => {
              const isOpen = openAccordion === index;
              return (
                <div 
                  key={index} 
                  style={{
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    backgroundColor: isOpen ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Accordion Trigger */}
                  <button
                    onClick={() => toggleAccordion(index)}
                    style={{
                      width: '100%',
                      padding: '18px 24px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      textAlign: 'left',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.98rem'
                    }}
                  >
                    <span>{faq.question}</span>
                    <span style={{ 
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      fontSize: '0.8rem',
                      opacity: 0.7
                    }}>
                      ▼
                    </span>
                  </button>

                  {/* Accordion Content */}
                  {isOpen && (
                    <div 
                      style={{ 
                        padding: '0 24px 20px 24px', 
                        opacity: 0.9, 
                        fontSize: '0.9rem', 
                        lineHeight: '1.6', 
                        whiteSpace: 'pre-line',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        paddingTop: '16px'
                      }}
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
