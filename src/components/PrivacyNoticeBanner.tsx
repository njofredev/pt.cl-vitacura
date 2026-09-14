'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function PrivacyNoticeBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user dismissed it during this session
    const dismissed = sessionStorage.getItem('privacy_banner_dismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('privacy_banner_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      className="privacy-sticky-banner"
      style={{
        position: 'sticky',
        top: '12px',
        zIndex: 50,
        width: '100%',
        marginBottom: '24px',
        borderRadius: 'var(--radius-md)',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        animation: 'fadeInSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        <div
          className="privacy-banner-icon-box"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            flexShrink: 0
          }}
        >
          <AlertTriangle size={17} strokeWidth={2.4} />
        </div>
        <div className="privacy-banner-text" style={{ fontSize: '0.84rem', lineHeight: '1.45' }}>
          <strong className="privacy-banner-strong" style={{ fontWeight: 700, marginRight: '6px' }}>
            Aviso de Privacidad y Cumplimiento Legal:
          </strong>
          En cumplimiento con la Ley de Protección de Datos Personales, no está permitido exhibir documentos clínicos directos ni anotaciones reservadas de la ficha del paciente sin su consentimiento previo expreso. Lamentamos las molestias que esto pueda ocasionar.
        </div>
      </div>

      <button
        onClick={handleDismiss}
        className="privacy-banner-close"
        title="Entendido / Cerrar aviso"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          flexShrink: 0
        }}
      >
        <X size={16} />
      </button>

      <style jsx>{`
        .privacy-sticky-banner {
          background-color: rgba(254, 243, 199, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(245, 158, 11, 0.35);
          box-shadow: 0 4px 20px rgba(245, 158, 11, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .privacy-banner-icon-box {
          background-color: rgba(245, 158, 11, 0.18);
          border: 1px solid rgba(245, 158, 11, 0.35);
          color: #d97706;
        }

        .privacy-banner-text {
          color: #78350f;
        }

        .privacy-banner-strong {
          color: #92400e;
        }

        .privacy-banner-close {
          color: #b45309;
        }

        .privacy-banner-close:hover {
          background-color: rgba(245, 158, 11, 0.15);
          color: #78350f;
        }

        /* Dark mode normalization */
        :global(.dark) .privacy-sticky-banner {
          background-color: rgba(36, 24, 13, 0.85);
          border: 1px solid rgba(245, 158, 11, 0.3);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35), 0 0 12px rgba(245, 158, 11, 0.1);
        }

        :global(.dark) .privacy-banner-icon-box {
          background-color: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #f59e0b;
        }

        :global(.dark) .privacy-banner-text {
          color: #fef3c7;
        }

        :global(.dark) .privacy-banner-strong {
          color: #fbbf24;
        }

        :global(.dark) .privacy-banner-close {
          color: #f59e0b;
        }

        :global(.dark) .privacy-banner-close:hover {
          background-color: rgba(245, 158, 11, 0.2);
          color: #ffffff;
        }

        @keyframes fadeInSlideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

