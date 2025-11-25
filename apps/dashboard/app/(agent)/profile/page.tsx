import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProfileEditor from '@/components/agent/profile-editor';
import { calculateProfileCompletion } from '@/lib/services/profile-completion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default async function AgentProfilePage() {
  const agent = await getCurrentAgent();

  if (!agent) {
    redirect('/login');
  }

  const supabase = createClient();
  const serviceRoleClient = createServiceRoleClient();

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

  // Get onboarding checklist (T040-T041)
  const { data: checklist } = await serviceRoleClient
    .from('agent_onboarding_checklist')
    .select('*')
    .eq('agent_id', agent.id)
    .single();

  // Calculate current completion
  const completion = calculateProfileCompletion(
    agentWithProfile.profile,
    agentWithProfile
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-gray-600 mt-1">
          Manage your professional profile and microsite information
        </p>
      </div>

      {/* T040: Profile completion progress bar */}
      {agentWithProfile.status !== 'active' && (
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Profile Completion</h2>
              <p className="text-sm text-gray-600">
                {completion.isComplete
                  ? 'Your profile is complete and ready for admin review'
                  : `Complete your profile to activate your website (${completion.completionPct}% done)`}
              </p>
            </div>
            {completion.isComplete ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full transition-all ${
                completion.isComplete ? 'bg-green-600' : 'bg-blue-600'
              }`}
              style={{ width: `${completion.completionPct}%` }}
            />
          </div>

          {/* T041: Checklist of required fields */}
          {!completion.isComplete && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Required Fields:</p>
              <ul className="space-y-1">
                {completion.missingFields.map((field) => (
                  <li key={field} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-red-500">○</span>
                    {field}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {completion.isComplete && agentWithProfile.status === 'pending_admin' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ Your profile is complete! An admin will review and activate your website soon.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <ProfileEditor agent={agentWithProfile} />
      </div>
    </div>
  );
}
