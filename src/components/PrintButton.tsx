'use client';

import React from 'react';

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="btn-primary"
      style={{ 
        padding: '10px 20px', 
        display: 'inline-flex', 
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer'
      }}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="18" 
        height="18" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
      Imprimir / Guardar PDF
    </button>
  );
}
