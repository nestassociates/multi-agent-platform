import { createServiceRoleClient } from '@/lib/supabase/server';
import PostcodePageClient from '@/components/admin/postcode-page-client';

export default async function PostcodesPage() {
  const supabase = createServiceRoleClient();

  // Fetch postcodes from database
  const { data: postcodes } = await supabase
    .from('postcodes')
    .select('code, boundary, center_point, area_km2')
    .order('code');

  // Fetch agents for assignment
  const { data: agents } = await supabase
    .from('agents')
    .select(`
      id,
      subdomain,
      profile:profiles!agents_user_id_fkey(first_name, last_name)
    `)
    .eq('status', 'active');

  return (
    <PostcodePageClient
      postcodes={postcodes || []}
      agents={agents || []}
    />
  );
}
