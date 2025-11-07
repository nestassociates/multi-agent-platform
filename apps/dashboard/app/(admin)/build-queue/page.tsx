import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default async function BuildQueuePage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = createServiceRoleClient();

  // Fetch build queue with agent info
  const { data: builds, error } = await supabase
    .from('build_queue')
    .select(
      `
      *,
      agent:agents (
        id,
        subdomain,
        profile:profiles!agents_user_id_fkey (
          first_name,
          last_name
        )
      )
    `
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching build queue:', error);
  }

  // Calculate stats
  const stats = {
    pending: builds?.filter((b) => b.status === 'pending').length || 0,
    building: builds?.filter((b) => b.status === 'building').length || 0,
    completed: builds?.filter((b) => b.status === 'completed').length || 0,
    failed: builds?.filter((b) => b.status === 'failed').length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Build Queue</h1>
        <p className="text-muted-foreground">Monitor and manage agent site deployments</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Building</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.building}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Build Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Builds</CardTitle>
          <CardDescription>Last 100 build jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {builds && builds.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Subdomain</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {builds.map((build: any) => {
                  const agentName = build.agent?.profile
                    ? `${build.agent.profile.first_name} ${build.agent.profile.last_name}`
                    : 'Unknown';

                  const statusVariant =
                    build.status === 'completed'
                      ? 'default'
                      : build.status === 'failed'
                        ? 'destructive'
                        : build.status === 'building'
                          ? 'secondary'
                          : 'outline';

                  const priorityLabel = `P${build.priority}`;

                  return (
                    <TableRow key={build.id}>
                      <TableCell className="font-medium">{agentName}</TableCell>
                      <TableCell>
                        <code className="text-sm">{build.agent?.subdomain}</code>
                      </TableCell>
                      <TableCell className="text-sm">{build.trigger_reason || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{priorityLabel}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant}>{build.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(build.created_at).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {build.status === 'failed' && (
                          <Button variant="ghost" size="sm">
                            Retry
                          </Button>
                        )}
                        {build.build_url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={build.build_url} target="_blank" rel="noopener noreferrer">
                              View
                            </a>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No build jobs yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
