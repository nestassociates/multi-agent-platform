import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

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
          <p className="text-muted-foreground">Manage your real estate agents</p>
        </div>
        <Button asChild>
          <Link href="/agents/new">Create Agent</Link>
        </Button>
      </div>

      {agents && agents.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All Agents</CardTitle>
            <CardDescription>
              {agents.length} {agents.length === 1 ? 'agent' : 'agents'} registered
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subdomain</TableHead>
                  <TableHead>Branch ID</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent: any) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">
                      {agent.profile?.first_name} {agent.profile?.last_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {agent.profile?.email}
                    </TableCell>
                    <TableCell>
                      <code className="text-sm">{agent.subdomain}</code>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm">{agent.apex27_branch_id || '—'}</code>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                        {agent.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No agents yet</p>
            <Button asChild>
              <Link href="/agents/new">Create Your First Agent</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
