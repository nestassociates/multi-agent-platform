import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Building2, FileText, Edit3, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function AgentDashboardPage() {
  const supabase = createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Get agent profile
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (agentError || !agent) {
    redirect('/login');
  }

  // Fetch agent-specific stats
  const [propertiesResult, contentResult, publishedContentResult] =
    await Promise.all([
      supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('agent_id', agent.id)
        .eq('status', 'available'),
      supabase
        .from('content_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('agent_id', agent.id)
        .eq('status', 'pending_review'),
      supabase
        .from('content_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('agent_id', agent.id)
        .eq('status', 'published'),
    ]);

  const stats = [
    {
      label: 'Active Properties',
      value: propertiesResult.count || 0,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Published Content',
      value: publishedContentResult.count || 0,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Pending Review',
      value: contentResult.count || 0,
      icon: Edit3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      label: 'Site Analytics',
      value: '—',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      subtitle: 'Coming soon',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your properties, content, and microsite
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get started</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Button variant="outline" className="h-auto justify-start" asChild>
            <Link href="/content/new" className="flex flex-col items-start gap-2 p-4">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                <span className="font-semibold">Create Content</span>
              </div>
              <p className="text-sm text-muted-foreground text-left">
                Write a blog post or guide
              </p>
            </Link>
          </Button>

          <Button variant="outline" className="h-auto justify-start" asChild>
            <Link href="/profile" className="flex flex-col items-start gap-2 p-4">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                <span className="font-semibold">Edit Profile</span>
              </div>
              <p className="text-sm text-muted-foreground text-left">
                Update your bio and details
              </p>
            </Link>
          </Button>

          <Button variant="outline" className="h-auto justify-start" asChild>
            <Link href="/my-properties" className="flex flex-col items-start gap-2 p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="font-semibold">View Properties</span>
              </div>
              <p className="text-sm text-muted-foreground text-left">
                {propertiesResult.count || 0} active listings
              </p>
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Coming soon</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Activity feed will show recent property updates, content submissions, and site builds
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
