'use client';

import React from 'react';
import { useNavigationPreload } from '@/context/NavigationPreloadContext';
import PreloadSkeleton from '@/components/PreloadSkeleton';
import PrivacyNoticeBanner from '@/components/PrivacyNoticeBanner';

export default function DashboardMainContent({ children }: { children: React.ReactNode }) {
  const { isNavigating, targetPath } = useNavigationPreload();

  return (
    <div
      className="main-content"
      style={{
        padding: '30px',
        boxSizing: 'border-box',
        minHeight: '100vh',
        position: 'relative'
      }}
    >
      {/* Sticky Bar de aviso de cumplimiento de Ley de Protección de Datos */}
      <PrivacyNoticeBanner />

      {isNavigating && targetPath ? (
        <PreloadSkeleton path={targetPath} />
      ) : (
        children
      )}
    </div>
  );
}

