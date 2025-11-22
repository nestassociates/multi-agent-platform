import { createServiceRoleClient } from '@/lib/supabase/server';
import PostcodePageClient from '@/components/admin/postcode-page-client';

export default async function PostcodesPage() {
  const supabase = createServiceRoleClient();

  // Fetch agents for assignment
  const { data: agents } = await supabase
    .from('agents')
    .select(`
      id,
      subdomain,
      profile:profiles!agents_user_id_fkey(first_name, last_name)
    `)
    .eq('status', 'active');

  // Don't load postcodes server-side - too much data
  // Client will load them via API after page renders
  return (
    <PostcodePageClient
      agents={agents || []}
    />
  );
}
