import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AgentTable } from '@/components/admin/agent-table';
import { AgentAutoDetectBanner } from '@/components/admin/agent-auto-detect-banner';
import { AgentActionsMenu } from '@/components/admin/agent-actions-menu';
import type { AgentStatus } from '@nest/shared-types';

interface AgentsPageProps {
  searchParams: {
    status?: string;
  };
}

export default async function AgentsPage({ searchParams }: AgentsPageProps) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  // Use service role to bypass RLS
  const supabase = createServiceRoleClient();

  // Build query with status filter (T025, T030, T031)
  let query = supabase
    .from('agents')
    .select('id, subdomain, apex27_branch_id, branch_name, apex27_contact_data, status, created_at, profile:profiles!agents_user_id_fkey(first_name, last_name, email)');

  // Apply status filter if provided
  const statusFilter = searchParams.status;
  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data: agents, error } = await query.order('created_at', { ascending: false }) as { data: any; error: any };

  if (error) {
    console.error('Error fetching agents:', error);
  }

  // Get count of draft agents for banner
  const { count: draftCount } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'draft');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground">
            Manage your real estate agents ({agents?.length || 0} total)
          </p>
        </div>
        <AgentActionsMenu />
      </div>

      {/* T024: Auto-detect banner */}
      <AgentAutoDetectBanner draftAgentCount={draftCount || 0} />

      <Card>
        <CardHeader>
          <CardTitle>All Agents</CardTitle>
          <CardDescription>
            Search, filter, and manage your real estate agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* T025, T026: Pass current status filter and show status badges */}
          <AgentTable
            agents={agents || []}
            currentStatusFilter={statusFilter || 'all'}
          />
        </CardContent>
      </Card>
    </div>
  );
}
