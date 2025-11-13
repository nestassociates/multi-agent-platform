import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AgentTable } from '@/components/admin/agent-table';

export default async function AgentsPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  // Use service role to bypass RLS
  const supabase = createServiceRoleClient();

  const { data: agents, error } = await supabase
    .from('agents')
    .select('*, profile:profiles!agents_user_id_fkey(first_name, last_name, email)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching agents:', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground">
            Manage your real estate agents ({agents?.length || 0} total)
          </p>
        </div>
        <Button asChild>
          <Link href="/agents/new">Create Agent</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Agents</CardTitle>
          <CardDescription>
            Search, filter, and manage your real estate agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgentTable agents={agents || []} />
        </CardContent>
      </Card>
    </div>
  );
}
