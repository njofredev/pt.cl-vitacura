import React from 'react';

export default function Loader({ size = 'medium', label }: { size?: 'small' | 'medium' | 'large'; label?: string }) {
  const sizes = {
    small: '24px',
    medium: '40px',
    large: '60px'
  };

  const borderThicknesses = {
    small: '2px',
    medium: '3px',
    large: '4px'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '20px'
    }}>
      <div style={{
        width: sizes[size],
        height: sizes[size],
        border: `${borderThicknesses[size]} solid rgba(255, 255, 255, 0.1)`,
        borderTop: `${borderThicknesses[size]} solid hsl(var(--primary-hsl))`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        boxShadow: '0 0 15px rgba(59, 130, 246, 0.2)'
      }} />
      {label && <span style={{ fontSize: '0.85rem', opacity: 0.8, fontWeight: 500 }}>{label}</span>}
      
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
