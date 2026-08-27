import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import StatusHistoryClient from '@/components/StatusHistoryClient';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Admin and Internal only
  if (session.role !== 'admin' && session.role !== 'internal') {
    redirect('/dashboard');
  }

  return <StatusHistoryClient userRole={session.role} />;
}
