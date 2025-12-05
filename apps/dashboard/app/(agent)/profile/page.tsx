import { createClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProfileEditor from '@/components/agent/profile-editor';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

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

  const isPendingProfile = agentWithProfile.status === 'pending_profile';
  const isPendingAdmin = agentWithProfile.status === 'pending_admin';
  const isActive = agentWithProfile.status === 'active';
  const isOnboarding = isPendingProfile || isPendingAdmin;

  return (
    <div className="p-8">
      {/* Onboarding Banner for pending_profile agents */}
      {isPendingProfile && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-blue-900">Welcome! Complete your profile to get started</h2>
              <p className="text-sm text-blue-700 mt-1">
                Fill in your professional details below. Once submitted, an admin will review your profile
                and activate your microsite. You won&apos;t be able to access other features until your
                profile is complete.
              </p>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-blue-800">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</div>
                  <span className="font-medium">Complete Profile</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-400">
                  <div className="w-6 h-6 rounded-full bg-blue-200 text-blue-500 flex items-center justify-center text-xs font-bold">2</div>
                  <span>Admin Review</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-400">
                  <div className="w-6 h-6 rounded-full bg-blue-200 text-blue-500 flex items-center justify-center text-xs font-bold">3</div>
                  <span>Site Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Admin Review Banner */}
      {isPendingAdmin && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-yellow-900">Profile submitted! Awaiting admin review</h2>
              <p className="text-sm text-yellow-700 mt-1">
                Your profile has been submitted for review. An admin will review your details and activate
                your microsite shortly. You&apos;ll receive an email when your site goes live.
              </p>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="font-medium">Profile Complete</span>
                </div>
                <div className="flex items-center gap-1.5 text-yellow-800">
                  <div className="w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center text-xs font-bold">2</div>
                  <span className="font-medium">Admin Review</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold">3</div>
                  <span>Site Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active - Site Live Banner */}
      {isActive && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-green-900">Your microsite is live!</h2>
              <p className="text-sm text-green-700 mt-1">
                Your profile changes will be reflected on your microsite after the next build.
              </p>
              <a
                href={`https://${agentWithProfile.subdomain}.nestassociates.co.uk`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-sm text-green-700 hover:text-green-900 underline"
              >
                View your live site →
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {isPendingProfile
            ? 'Complete Your Profile'
            : isPendingAdmin
              ? 'Profile Under Review'
              : 'My Profile'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isPendingProfile
            ? 'Tell us about yourself so we can set up your professional microsite'
            : isPendingAdmin
              ? 'Your profile is being reviewed. You can still make edits if needed.'
              : 'Manage your professional profile and microsite information'
          }
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <ProfileEditor agent={agentWithProfile} isOnboarding={isPendingProfile} />
      </div>
    </div>
  );
}
