import { getSession } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import SessionTimeout from '@/components/SessionTimeout';
import SyncTrigger from '@/components/SyncTrigger';
import { redirect } from 'next/navigation';
import React from 'react';

import { NavigationPreloadProvider } from '@/context/NavigationPreloadContext';
import DashboardMainContent from '@/components/DashboardMainContent';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  return (
    <NavigationPreloadProvider>
      <div style={{ minHeight: '100vh', position: 'relative' }}>
        {/* Session Inactivity Timeout Handler */}
        <SessionTimeout />

        {/* Sidebar Navigation */}
        <Sidebar user={user} />

        {/* Main Content Area with instant Container Pre-load Skeleton */}
        <DashboardMainContent>
          {children}
        </DashboardMainContent>
      </div>
    </NavigationPreloadProvider>
  );
}
