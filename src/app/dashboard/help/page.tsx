import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import HelpPageClient from '@/components/HelpPageClient';

export default async function HelpPage() {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  return <HelpPageClient userRole={user.role} />;
}
