/**
 * Agent Onboarding Checklist Component
 *
 * Displays onboarding progress and activation controls
 *
 * Feature: 004-agent-lifecycle-management
 * Task: T050
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { AgentOnboardingChecklist, Agent } from '@nest/shared-types';

interface AgentOnboardingChecklistProps {
  agent: Agent;
  checklist: AgentOnboardingChecklist | null;
}

export function AgentOnboardingChecklistComponent({
  agent,
  checklist,
}: AgentOnboardingChecklistProps) {
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleActivate = async () => {
    setIsActivating(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/agents/${agent.id}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'Admin approved after profile review',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to activate agent');
      }

      // Refresh page to show new status
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsActivating(false);
    }
  };

  if (!checklist) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No checklist found for this agent.</p>
      </div>
    );
  }

  const canActivate =
    checklist.profile_completed &&
    !checklist.admin_approved &&
    agent.status === 'pending_admin';

  return (
    <div className="space-y-6">
      {/* Checklist Items */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Onboarding Progress</h3>

        <div className="space-y-3">
          <ChecklistItem
            checked={checklist.user_created}
            label="User Account Created"
            description="Admin created Supabase Auth user"
          />
          <ChecklistItem
            checked={checklist.welcome_email_sent}
            label="Welcome Email Sent"
            description="Agent received login credentials"
          />
          <ChecklistItem
            checked={checklist.profile_completed}
            label={`Profile Completed (${checklist.profile_completion_pct}%)`}
            description="Agent filled all required fields"
          />
          <ChecklistItem
            checked={checklist.admin_approved}
            label="Admin Approved"
            description="Admin reviewed and approved for deployment"
          />
          <ChecklistItem
            checked={checklist.site_deployed}
            label="Website Deployed"
            description="Agent microsite is live"
          />
        </div>
      </div>

      {/* Activation Metadata */}
      {checklist.activated_at && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-900 mb-2">Activation Details</h4>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-green-700">Activated:</dt>
            <dd className="text-green-900 font-medium">
              {new Date(checklist.activated_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </dd>
          </dl>
        </div>
      )}

      {/* Deactivation Metadata */}
      {checklist.deactivated_at && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-orange-900 mb-2">Deactivation Details</h4>
          <dl className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <dt className="text-orange-700">Deactivated:</dt>
              <dd className="text-orange-900 font-medium">
                {new Date(checklist.deactivated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </dd>
            </div>
            {checklist.deactivation_reason && (
              <div>
                <dt className="text-orange-700">Reason:</dt>
                <dd className="text-orange-900 mt-1">{checklist.deactivation_reason}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Activation Button */}
      {canActivate && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-2">Ready for Activation</h3>
          <p className="text-gray-600 mb-4">
            This agent has completed their profile and is ready for site deployment.
            Clicking "Approve & Deploy" will:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 mb-6 list-disc list-inside">
            <li>Change agent status to 'active'</li>
            <li>Queue a high-priority site build (P1)</li>
            <li>Send activation email to agent</li>
            <li>Deploy agent microsite to their subdomain</li>
          </ul>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              {error}
            </div>
          )}

          <Button
            onClick={handleActivate}
            disabled={isActivating}
            className="w-full"
          >
            {isActivating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Activating...
              </>
            ) : (
              '✓ Approve & Deploy Site'
            )}
          </Button>
        </div>
      )}

      {/* Not Ready Message */}
      {!canActivate && agent.status !== 'active' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            {!checklist.profile_completed
              ? `Agent's profile is ${checklist.profile_completion_pct}% complete. Waiting for agent to finish.`
              : agent.status === 'draft'
              ? 'Create a user account for this agent first.'
              : 'Agent is not yet ready for activation.'}
          </p>
        </div>
      )}

      {/* Already Active */}
      {agent.status === 'active' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800 font-medium">
            ✅ This agent is active and their website is deployed.
          </p>
          <a
            href={`https://${agent.subdomain}.nestassociates.com`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-700 hover:text-green-900 underline mt-2 inline-block"
          >
            View Live Site →
          </a>
        </div>
      )}
    </div>
  );
}

// Checklist item component
function ChecklistItem({
  checked,
  label,
  description,
}: {
  checked: boolean;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      {checked ? (
        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
      ) : (
        <Circle className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p className={`text-sm font-medium ${checked ? 'text-gray-900' : 'text-gray-500'}`}>
          {label}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
