import React from 'react';

interface PreloadSkeletonProps {
  path?: string;
}

export default function PreloadSkeleton({ path }: PreloadSkeletonProps) {
  // Skeleton for Table / List views (/dashboard/cases, /dashboard/history, /dashboard/audit, /dashboard/users)
  if (path?.includes('/cases') || path?.includes('/history') || path?.includes('/audit') || path?.includes('/users')) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Header Card Skeleton */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="skeleton-shimmer" style={{ width: '280px', height: '28px', borderRadius: '6px' }} />
            <div className="skeleton-shimmer" style={{ width: '420px', height: '14px', borderRadius: '4px' }} />
          </div>
          <div className="skeleton-shimmer" style={{ width: '130px', height: '38px', borderRadius: '9999px' }} />
        </div>

        {/* Filter Bar Skeleton */}
        <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="skeleton-shimmer" style={{ flex: 1, height: '42px', borderRadius: '12px' }} />
          <div className="skeleton-shimmer" style={{ width: '160px', height: '42px', borderRadius: '12px' }} />
          <div className="skeleton-shimmer" style={{ width: '140px', height: '42px', borderRadius: '12px' }} />
        </div>

        {/* Main Table Skeleton */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div className="skeleton-shimmer" style={{ width: '160px', height: '20px' }} />
            <div className="skeleton-shimmer" style={{ width: '80px', height: '20px' }} />
          </div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div 
              key={i} 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '80px 2fr 1.5fr 1fr 1fr 100px', 
                gap: '16px', 
                padding: '14px 0', 
                borderBottom: '1px solid var(--glass-border)' 
              }}
            >
              <div className="skeleton-shimmer" style={{ height: '18px', width: '50px' }} />
              <div className="skeleton-shimmer" style={{ height: '18px', width: '85%' }} />
              <div className="skeleton-shimmer" style={{ height: '18px', width: '70%' }} />
              <div className="skeleton-shimmer" style={{ height: '18px', width: '60%' }} />
              <div className="skeleton-shimmer" style={{ height: '18px', width: '80px', borderRadius: '9999px' }} />
              <div className="skeleton-shimmer" style={{ height: '18px', width: '60px', justifySelf: 'end' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Skeleton for Form Views (/dashboard/register, /dashboard/ingreso-automatico, /dashboard/aranceles)
  if (path?.includes('/register') || path?.includes('/ingreso') || path?.includes('/aranceles')) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px 30px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="skeleton-shimmer" style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="skeleton-shimmer" style={{ width: '260px', height: '24px', borderRadius: '6px' }} />
            <div className="skeleton-shimmer" style={{ width: '380px', height: '14px', borderRadius: '4px' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="skeleton-shimmer" style={{ width: '180px', height: '22px' }} />
            <div className="skeleton-shimmer" style={{ width: '100%', height: '44px' }} />
            <div className="skeleton-shimmer" style={{ width: '100%', height: '44px' }} />
            <div className="skeleton-shimmer" style={{ width: '100%', height: '44px' }} />
            <div className="skeleton-shimmer" style={{ width: '100%', height: '80px' }} />
          </div>
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="skeleton-shimmer" style={{ width: '160px', height: '22px' }} />
            <div className="skeleton-shimmer" style={{ width: '100%', height: '44px' }} />
            <div className="skeleton-shimmer" style={{ width: '100%', height: '44px' }} />
            <div className="skeleton-shimmer" style={{ width: '100%', height: '120px' }} />
          </div>
        </div>
      </div>
    );
  }

  // Default Dashboard / Telemetry Skeleton (/dashboard)
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px', paddingBottom: '40px' }}>
      {/* Header Panel Skeleton */}
      <div className="glass-panel" style={{ padding: '30px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="skeleton-shimmer" style={{ width: '56px', height: '56px', borderRadius: '50%' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="skeleton-shimmer" style={{ width: '280px', height: '28px', borderRadius: '6px' }} />
            <div className="skeleton-shimmer" style={{ width: '420px', height: '15px', borderRadius: '4px' }} />
          </div>
        </div>
        <div className="skeleton-shimmer" style={{ width: '150px', height: '42px', borderRadius: '9999px' }} />
      </div>

      {/* Grid Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '30px' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Stat Cards 4-grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="skeleton-shimmer" style={{ width: '60%', height: '14px' }} />
                <div className="skeleton-shimmer" style={{ width: '45%', height: '28px' }} />
                <div className="skeleton-shimmer" style={{ width: '80%', height: '10px' }} />
              </div>
            ))}
          </div>

          {/* Table Container Skeleton */}
          <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="skeleton-shimmer" style={{ width: '200px', height: '24px' }} />
              <div className="skeleton-shimmer" style={{ width: '90px', height: '30px', borderRadius: '9999px' }} />
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-shimmer" style={{ width: '100%', height: '44px', borderRadius: '8px' }} />
            ))}
          </div>

          {/* Chart Container Skeleton */}
          <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="skeleton-shimmer" style={{ width: '220px', height: '22px' }} />
            <div className="skeleton-shimmer" style={{ width: '100%', height: '220px', borderRadius: '12px' }} />
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="skeleton-shimmer" style={{ width: '160px', height: '22px' }} />
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-shimmer" style={{ width: '100%', height: '64px', borderRadius: '12px' }} />
            ))}
          </div>

          <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="skeleton-shimmer" style={{ width: '180px', height: '22px' }} />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-shimmer" style={{ width: '100%', height: '48px', borderRadius: '8px' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
