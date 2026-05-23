import { getSession } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import { redirect } from 'next/navigation';
import React from 'react';

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
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Sidebar Navigation */}
      <Sidebar user={user} />

      {/* Main Content Area */}
      <div className="main-content" style={{
        padding: '30px',
        boxSizing: 'border-box'
      }}>
        {children}
      </div>
    </div>
  );
}
