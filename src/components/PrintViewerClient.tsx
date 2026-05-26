'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface CaseData {
  id: string;
  rut: string;
  first_names: string;
  last_names: string;
  nationality?: string;
  birth_date?: string;
  commune?: string;
  person_email?: string;
  mobile?: string;
  medical_center?: string;
  agreement_type?: string;
  dental_diagnosis?: string;
  treatment_needed?: string;
  professional_name?: string;
  professional_title?: string;
  professional_position?: string;
  professional_email?: string;
  professional_address?: string;
  professional_website?: string;
  registered_by_name?: string;
}

export default function PrintViewerClient({ caseData }: { caseData: CaseData }) {
  // Configuration States
  const [showLogoHeader, setShowLogoHeader] = useState(true);
  const [showSignature, setShowSignature] = useState(true);
  const [showWatermark, setShowWatermark] = useState(false);
  const [watermarkText, setWatermarkText] = useState('DERIVACIÓN DIGITAL');
  const [zoomPercent, setZoomPercent] = useState(100);

  // Notification Toast States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info'>('success');

  const triggerToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const caseNumber = caseData.id.split('-')[0].toUpperCase();
  const currentDate = new Date().toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Action: Export metadata as JSON
  const handleExportJSON = () => {
    try {
      const dataStr = JSON.stringify(caseData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.download = `derivacion_${caseData.rut}_${caseNumber}.json`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      triggerToast('✓ Ficha exportada correctamente en formato JSON.', 'success');
    } catch (error) {
      triggerToast('✗ Error al exportar los datos del caso.', 'info');
    }
  };

  // Action: Copy Access Link
  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      triggerToast('✓ Enlace seguro copiado al portapapeles.', 'success');
    } catch (error) {
      triggerToast('✗ No se pudo copiar el enlace automáticamente.', 'info');
    }
  };

  // Action: Simulate Email Send
  const handleSendEmail = () => {
    const patientEmail = caseData.person_email || 'correo@registrado.cl';
    triggerToast(`✓ Enviando derivación digital al paciente a: ${patientEmail}...`, 'info');
    setTimeout(() => {
      triggerToast(`✓ Derivación enviada con éxito al correo: ${patientEmail}`, 'success');
    }, 1500);
  };

  return (
    <div className="print-viewer-layout">
      {/* Toast Notification Notification Banner */}
      {toastMessage && (
        <div 
          className={`toast-notification animate-fade-in ${toastType === 'success' ? 'toast-success' : 'toast-info'}`}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '14px 20px',
            borderRadius: '12px',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.9rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backdropFilter: 'blur(8px)',
            background: toastType === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(59, 130, 246, 0.95)',
            border: toastType === 'success' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(59, 130, 246, 0.2)'
          }}
        >
          {toastType === 'success' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          )}
          {toastMessage}
        </div>
      )}

      {/* Column A: Document Configuration Control Panel (Hidden on Print) */}
      <div className="control-sidebar no-print">
        {/* Header Block with Back Action */}
        <div style={{ marginBottom: '24px' }}>
          <Link href="/dashboard/cases" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--accent-hsl))', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none', marginBottom: '16px', transition: 'opacity 0.2s' }} className="back-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Volver a Casos Sociales
          </Link>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'hsl(var(--foreground-hsl))', letterSpacing: '-0.02em' }}>
            Visor de Documento
          </h2>
          <p style={{ margin: '4px 0 0 0', opacity: 0.6, fontSize: '0.82rem', fontWeight: 500 }}>
            Configura y exporta el comprobante oficial de la derivación.
          </p>
        </div>

        {/* Action Button Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
          <button 
            onClick={() => window.print()} 
            className="btn-primary print-trigger-btn"
            style={{ 
              width: '100%', 
              height: '48px', 
              borderRadius: '12px', 
              fontWeight: 700, 
              fontSize: '0.95rem',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Imprimir / Guardar PDF
          </button>

          <button 
            onClick={handleSendEmail} 
            className="btn-secondary"
            style={{ 
              width: '100%', 
              height: '44px', 
              borderRadius: '12px', 
              fontSize: '0.9rem', 
              fontWeight: 700, 
              display: 'flex', 
              gap: '8px', 
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Enviar Comprobante Digital
          </button>
        </div>

        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
          {/* Zoom Control Slider */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--foreground-hsl))', opacity: 0.85 }}>Escala de Vista</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'hsl(var(--accent-hsl))' }}>{zoomPercent}%</span>
            </div>
            <input 
              type="range" 
              min="80" 
              max="120" 
              value={zoomPercent} 
              onChange={(e) => setZoomPercent(Number(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: 'var(--glass-border)',
                outline: 'none',
                cursor: 'pointer',
                accentColor: 'hsl(var(--accent-hsl))'
              }}
            />
          </div>

          {/* Config switches options */}
          <h3 style={{ margin: '0 0 14px 0', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.5 }}>
            Personalización del PDF
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Toggle: Watermark only */}
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'hsl(var(--foreground-hsl))' }}>Marca de Agua</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.5 }}>Habilitar marca "DERIVACIÓN DIGITAL" en fondo</span>
              </div>
              <input 
                type="checkbox" 
                checked={showWatermark} 
                onChange={(e) => setShowWatermark(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: 'hsl(var(--accent-hsl))', width: '18px', height: '18px' }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Column B: A4 Paper Preview Screen Container */}
      <div className="preview-workspace">
        
        {/* Document A4 Page */}
        <div 
          className="a4-document-preview relative"
          style={{ 
            '--zoom-factor': zoomPercent / 100,
            transform: `scale(${zoomPercent / 100})`,
            transformOrigin: 'top center'
          } as React.CSSProperties}
        >
          {/* Watermark Seal Overlay */}
          {showWatermark && (
            <div className="watermark-overlay">
              {watermarkText}
            </div>
          )}

          {/* Header Block with Vitacura Brand logo */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start', 
            marginBottom: '40px',
            opacity: showLogoHeader ? 1 : 0,
            transition: 'opacity 0.25s ease',
            height: showLogoHeader ? 'auto' : '0px',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Arial, sans-serif', color: '#444' }}>V</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Arial, sans-serif', letterSpacing: '-0.03em', color: '#111', lineHeight: 1 }}>vitacura</span>
                  <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.06em', color: '#666' }}>EL MEJOR LUGAR PARA VIVIR</span>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#333', marginTop: '2px' }}>ILUSTRE MUNICIPALIDAD DE VITACURA</span>
            </div>

            <div style={{ paddingTop: '10px' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#444', fontWeight: 700 }}>Número de Derivación: N° {caseNumber}</p>
            </div>
          </div>

          {!showLogoHeader && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#444', fontWeight: 700 }}>Número de Derivación: N° {caseNumber}</p>
            </div>
          )}

          {/* Document Title Header */}
          <div style={{ textAlign: 'center', margin: '50px 0 40px 0', padding: '0 20px' }}>
            <h1 style={{ 
              fontSize: '1.05rem', 
              fontWeight: 800, 
              fontFamily: 'Arial, sans-serif', 
              textTransform: 'uppercase',
              margin: 0,
              lineHeight: 1.5,
              color: '#000',
              letterSpacing: '0.02em'
            }}>
              {caseData.medical_center ? caseData.medical_center.toUpperCase() + '.' : 'CENTRO DE SALUD FAMILIAR.'}<br/>
              DERIVACIÓN A CONVENIO POLICLÍNICO TABANCURA SIN COSTO.
            </h1>
          </div>

          {/* Document Text Body */}
          <div style={{ fontSize: '0.98rem', lineHeight: 1.65, color: '#111', fontFamily: 'Arial, sans-serif', textAlign: 'justify' }}>
            <p style={{ marginBottom: '20px' }}>Estimados Policlínico Tabancura:</p>
            
            <p style={{ marginBottom: '24px' }}>
              Junto con saludarlos cordialmente y esperando que se encuentren muy bien, les enviamos el presente 
              documento oficial como derivación de <strong>{caseData.first_names} {caseData.last_names}</strong>, RUT: <strong>{caseData.rut}</strong>, quien es usuario registrado y activo de 
              nuestro Centro de Salud Familiar, para acogerse al Convenio Subvencionado Sin Costo de {caseData.agreement_type || 'Atención Odontológica Especializada'}.
            </p>

            <div style={{ 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              padding: '16px 20px', 
              borderRadius: '8px', 
              marginBottom: '24px' 
            }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: 700, color: '#1e293b' }}>
                Diagnóstico Odontológico:
              </p>
              <p style={{ margin: 0, fontStyle: 'italic', color: '#334155', whiteSpace: 'pre-wrap' }}>
                "{caseData.dental_diagnosis || 'No especificado en el registro.'}"
              </p>
            </div>

            <div style={{ marginBottom: '40px', fontWeight: 700, color: '#0f172a' }}>
              Procedimiento Solicitado: <span style={{ whiteSpace: 'pre-wrap', fontWeight: 'normal', display: 'inline-block', verticalAlign: 'top' }}>{caseData.treatment_needed || 'Evaluación y tratamiento según diagnóstico.'}</span>
            </div>
          </div>

          {/* Signature and Professional stamps */}
          {showSignature && (
            <div className="animate-fade-in" style={{ marginTop: '50px', fontFamily: 'Arial, sans-serif' }}>
              <p style={{ marginBottom: '32px', color: '#333' }}>Saluda Atte.</p>
              
              {/* Handwritten Squiggly Line Signature */}
              <div style={{ marginBottom: '14px', position: 'relative', width: '200px' }}>
                <svg width="180" height="50" viewBox="0 0 200 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 35 C 30 15, 45 40, 60 20 C 75 10, 90 45, 110 15 C 130 5, 145 35, 160 15 C 175 5, 185 25, 195 20" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M30 42 L 170 42" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />
                </svg>
                {/* Simulated Stamp Glow */}
                <div style={{
                  position: 'absolute',
                  right: '-20px',
                  top: '-10px',
                  width: '76px',
                  height: '76px',
                  border: '2px solid rgba(13, 148, 136, 0.4)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'rotate(-12deg)',
                  fontSize: '0.52rem',
                  fontWeight: 800,
                  color: 'rgba(13, 148, 136, 0.7)',
                  textAlign: 'center',
                  fontFamily: 'sans-serif',
                  lineHeight: '1.2',
                  pointerEvents: 'none'
                }}>
                  VITACURA<br/>SALUD<br/>CONVENIO
                </div>
              </div>

              <div style={{ fontSize: '0.88rem', lineHeight: 1.45, color: '#333' }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#000' }}>{caseData.professional_name || 'Dr. Profesional'}</p>
                <p style={{ margin: 0, color: '#444' }}>{caseData.professional_title || 'Cirujano Dentista'}</p>
                <p style={{ margin: 0, color: '#444' }}>{caseData.professional_position || 'Programa Odontológico'}</p>
                <p style={{ margin: 0, color: '#444' }}>{caseData.medical_center || 'CESFAM'}</p>
                <p style={{ margin: 0, textDecoration: 'underline', color: 'hsl(var(--primary-hsl))' }}>{caseData.professional_email || 'correo@centro.cl'}</p>
                <p style={{ margin: 0, color: '#666', fontSize: '0.82rem' }}>{caseData.professional_address || 'Dirección registrada'}</p>
              </div>
            </div>
          )}

          {/* Date Footer Block */}
          <div style={{ marginTop: '70px', textAlign: 'right', fontSize: '0.88rem', fontFamily: 'Arial, sans-serif', color: '#444', fontWeight: 600 }}>
            <p style={{ margin: 0 }}>Vitacura, {currentDate}</p>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .print-viewer-layout {
          display: flex;
          height: calc(100vh - 60px);
          width: 100%;
          background-color: hsl(var(--background-hsl));
          position: relative;
          overflow: hidden;
          border-radius: var(--radius-lg);
          border: 1px solid var(--glass-border);
        }
        
        .control-sidebar {
          width: 350px;
          height: 100%;
          background: var(--glass-bg);
          border-right: 1px solid var(--glass-border);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          flex-shrink: 0;
          color: hsl(var(--foreground-hsl));
        }
        
        .preview-workspace {
          flex: 1;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 40px 24px;
          overflow-y: auto;
          background: radial-gradient(circle at center, var(--input-bg) 0%, hsl(var(--background-hsl)) 100%);
        }
        
        .a4-document-preview {
          background-color: white;
          width: 210mm;
          min-height: 297mm;
          padding: 25mm 20mm;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
          box-sizing: border-box;
          position: relative;
          color: #000;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .watermark-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 4.5rem;
          font-weight: 900;
          color: rgba(13, 148, 136, 0.06);
          font-family: 'Arial', sans-serif;
          white-space: nowrap;
          pointer-events: none;
          user-select: none;
          z-index: 5;
          letter-spacing: 0.1em;
          border: 10px solid rgba(13, 148, 136, 0.05);
          padding: 10px 30px;
          border-radius: 20px;
        }

        .back-link:hover {
          opacity: 0.8;
          text-decoration: underline !important;
      }

        .ios-switch {
          width: 44px;
          height: 22px;
        }
        
        @media (max-width: 1023px) {
          .print-viewer-layout {
            flex-direction: column;
            height: auto;
            min-height: calc(100vh - 60px);
            overflow: visible;
            border-radius: 0;
            border: none;
          }
          .control-sidebar {
            width: 100%;
            height: auto;
            border-right: none;
            border-bottom: 1px solid var(--glass-border);
            padding: 24px;
            overflow-y: visible;
          }
          .preview-workspace {
            padding: 20px 8px;
            overflow-x: auto;
            height: auto;
            overflow-y: visible;
          }
          .a4-document-preview {
            width: 210mm;
            /* Allow scaling dynamically to viewport width */
            max-width: 100%;
          }
        }
        
        @media print {
          /* Total clean print style override */
          body * {
            visibility: hidden;
            background-color: transparent !important;
          }
          .print-viewer-layout {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            display: block !important;
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .preview-workspace {
            height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
            background: none !important;
            display: block !important;
            margin: 0 !important;
          }
          .a4-document-preview, .a4-document-preview * {
            visibility: visible;
          }
          .a4-document-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 25mm 20mm;
            box-shadow: none !important;
            transform: scale(1) !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}
