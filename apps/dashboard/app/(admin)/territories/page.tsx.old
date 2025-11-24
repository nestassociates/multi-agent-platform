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

  // Fetch all territories
  const { data: rawTerritories, error: territoriesError } = await supabase
    .from('territories')
    .select(`
      id,
      name,
      agent_id,
      property_count,
      created_at,
      updated_at,
      agent:agents!territories_agent_id_fkey(
        id,
        subdomain,
        profile:profiles!agents_user_id_fkey(first_name, last_name)
      )
    `)
    .order('created_at', { ascending: false });

  // For each territory, fetch boundary as GeoJSON using ST_AsGeoJSON
  const territoriesWithBoundaries = await Promise.all(
    (rawTerritories || []).map(async (territory: any) => {
      const { data } = await supabase.rpc('get_territory_boundary_geojson', {
        territory_id: territory.id
      });
      return {
        ...territory,
        boundary: data ? JSON.parse(data) : null
      };
    })
  );

  const territories = territoriesWithBoundaries;

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
  const territoriesWithColors = (territories || []).map((territory: any, index: number) => ({
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
