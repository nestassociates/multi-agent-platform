/**
 * Admin Properties Page
 * Displays all properties across all agents with sync controls and filtering
 * Client-side filtering and pagination for instant responsiveness
 */

import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { PropertiesTable } from '@/components/admin/properties-table';

export default async function AdminPropertiesPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const supabase = createServiceRoleClient();

  // Get all properties with agent info (client-side filtering is instant)
  const { data: properties } = await supabase
    .from('properties')
    .select(`
      *,
      agent:agents!properties_agent_id_fkey(
        id,
        subdomain,
        apex27_branch_id,
        profile:profiles!agents_user_id_fkey(first_name, last_name)
      )
    `)
    .order('updated_at', { ascending: false });

  // Get total count
  const { count: totalCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Properties</h1>
          <p className="mt-2 text-gray-600">
            {totalCount || 0} total properties synced from Apex27
          </p>
        </div>

        <div className="flex gap-3">
          <form action="/api/cron/sync-properties" method="GET">
            <button
              type="submit"
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Trigger Manual Sync
            </button>
          </form>
        </div>
      </div>

      <PropertiesTable
        properties={properties || []}
        totalCount={totalCount || 0}
      />
    </div>
  );
}
