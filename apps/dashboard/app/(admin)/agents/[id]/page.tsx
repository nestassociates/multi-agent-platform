import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ExternalLink, Edit } from 'lucide-react';
import { AgentOverview } from '@/components/admin/agent-overview';
import { AgentContentTab } from '@/components/admin/agent-content-tab';
import { AgentPropertiesTab } from '@/components/admin/agent-properties-tab';
import { AgentAnalyticsTab } from '@/components/admin/agent-analytics-tab';
import { AgentSettingsTab } from '@/components/admin/agent-settings-tab';
import { EditAgentButton } from '@/components/admin/edit-agent-button';
import { AgentOnboardingChecklistComponent } from '@/components/admin/agent-onboarding-checklist';
import { AgentStatusHistory } from '@/components/admin/agent-status-history';
import { getAgentStatusHistory } from '@/lib/services/status-history';

export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  // Use service role to bypass RLS
  const supabase = createServiceRoleClient();

  // Fetch agent with profile
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('*, profile:profiles!agents_user_id_fkey(first_name, last_name, email, phone, avatar_url)')
    .eq('id', params.id)
    .single();

  if (agentError || !agent) {
    notFound();
  }

  // T052: Fetch stats and checklist
  // T079: Fetch status history
  const [contentResult, propertiesResult, buildsResult, checklistResult, statusHistory] = await Promise.all([
    supabase
      .from('content_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', params.id)
      .eq('status', 'approved'),
    supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', params.id)
      .eq('status', 'active'),
    supabase
      .from('build_queue')
      .select('completed_at')
      .eq('agent_id', params.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('agent_onboarding_checklist')
      .select('*')
      .eq('agent_id', params.id)
      .maybeSingle(),
    getAgentStatusHistory(params.id),
  ]);

  const stats = {
    contentCount: contentResult.count || 0,
    propertiesCount: propertiesResult.count || 0,
    lastBuildDate: buildsResult.data?.completed_at || null,
  };

  const checklist = checklistResult.data;

  const micrositeUrl = `https://${agent.subdomain}.nestassociates.co.uk`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/agents">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Agents
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href={micrositeUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              View Live Site
            </a>
          </Button>
          <EditAgentButton agent={agent} />
        </div>
      </div>

      {/* T052-T054: Tabs with onboarding */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="onboarding">
            Onboarding
            {agent.status !== 'active' && (
              <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                {agent.status === 'pending_admin' ? 'Ready' : 'In Progress'}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="content">
            Content
            {stats.contentCount > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {stats.contentCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="properties">
            Properties
            {stats.propertiesCount > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {stats.propertiesCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AgentOverview agent={agent} stats={stats} />
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-6">
          <AgentOnboardingChecklistComponent agent={agent} checklist={checklist} />
          {/* T078: Status History Timeline */}
          <AgentStatusHistory history={statusHistory} />
        </TabsContent>

        <TabsContent value="content">
          <AgentContentTab agentId={params.id} />
        </TabsContent>

        <TabsContent value="properties">
          <AgentPropertiesTab agentId={params.id} />
        </TabsContent>

        <TabsContent value="analytics">
          <AgentAnalyticsTab agentId={params.id} />
        </TabsContent>

        <TabsContent value="settings">
          <AgentSettingsTab agent={agent} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
