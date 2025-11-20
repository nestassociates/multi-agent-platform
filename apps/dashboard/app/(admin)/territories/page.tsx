import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createServiceRoleClient } from '@/lib/supabase/server';
import TerritoryPageClient from '@/components/admin/territory-page-client';
import { getAgentColor } from '@/lib/color-generator';

export default async function TerritoriesPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = createServiceRoleClient();

  // Fetch territories directly from database (avoid internal API call)
  const { data: territories, error: territoriesError } = await supabase
    .from('territories')
    .select(`
      *,
      agent:agents!territories_agent_id_fkey(
        id,
        subdomain,
        profile:profiles!agents_user_id_fkey(
          first_name,
          last_name
        )
      )
    `)
    .order('created_at', { ascending: false });

  // Fetch agents
  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('id, subdomain, profile:profiles!agents_user_id_fkey(first_name, last_name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (territoriesError || agentsError) {
    console.error('Error fetching data:', territoriesError || agentsError);
  }

  // Add colors to territories
  const territoriesWithColors = (territories || []).map((territory, index) => ({
    ...territory,
    color: getAgentColor(territory.agent_id, index),
  }));

  return (
    <TerritoryPageClient
      territories={territoriesWithColors}
      agents={agents || []}
    />
  );
}
