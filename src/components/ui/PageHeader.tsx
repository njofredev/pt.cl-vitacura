import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function PageHeader({
  title,
  description,
  action
}: PageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            margin: 0,
            lineHeight: 1.2
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            style={{
              margin: 0,
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              lineHeight: 1.4
            }}
          >
            {description}
          </p>
        )}
      </div>

      {action && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {action}
        </div>
      )}
    </div>
  );
}
