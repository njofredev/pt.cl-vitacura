import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AuditLogClient from '@/components/AuditLogClient';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Admin-only protection
  if (session.role !== 'admin') {
    redirect('/dashboard');
  }

  return <AuditLogClient />;
}
