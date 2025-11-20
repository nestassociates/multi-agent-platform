import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import TerritoryPageClient from '@/components/admin/territory-page-client';

export default async function TerritoriesPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch territories and agents from API
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const [territoriesRes, agentsRes] = await Promise.all([
    fetch(`${baseUrl}/api/admin/territories`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/admin/agents`, { cache: 'no-store' }),
  ]);

  const { data: territories } = await territoriesRes.json();
  const { data: agents } = await agentsRes.json();

  return <TerritoryPageClient territories={territories || []} agents={agents || []} />;
}
