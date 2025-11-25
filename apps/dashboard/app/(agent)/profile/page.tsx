import { createClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProfileEditor from '@/components/agent/profile-editor';

export default async function AgentProfilePage() {
  const agent = await getCurrentAgent();

  if (!agent) {
    redirect('/login');
  }

  const supabase = createClient();

  // Get agent with profile
  const { data: agentWithProfile } = await supabase
    .from('agents')
    .select(
      `
      *,
      profile:profiles!agents_user_id_fkey(*)
    `
    )
    .eq('id', agent.id)
    .single();

  if (!agentWithProfile) {
    redirect('/login');
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-gray-600 mt-1">
          Manage your professional profile and microsite information
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <ProfileEditor agent={agentWithProfile} />
      </div>
    </div>
  );
}
