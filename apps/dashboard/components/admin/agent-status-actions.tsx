/**
 * Agent Status Actions Component
 *
 * Provides action buttons for deactivating, reactivating, and suspending agents
 *
 * Feature: 004-agent-lifecycle-management
 * Tasks: T071-T074
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Loader2, Pause, Play, Ban } from 'lucide-react';
import {
  canBeDeactivated,
  canBeReactivated,
  canBeSuspended,
} from '@/lib/services/status-validator';
import type { AgentStatusType } from '@nest/validation';

// Local interface that includes joined profile data
interface AgentWithProfile {
  id: string;
  subdomain: string;
  status: string;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

interface AgentStatusActionsProps {
  agent: AgentWithProfile;
  onStatusChange?: () => void;
}

type ActionType = 'deactivate' | 'reactivate' | 'suspend' | null;

export function AgentStatusActions({ agent, onStatusChange }: AgentStatusActionsProps) {
  const router = useRouter();
  const [currentAction, setCurrentAction] = useState<ActionType>(null);
  const [reason, setReason] = useState('');
  const [queueBuild, setQueueBuild] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agentStatus = agent.status as AgentStatusType;
  const showDeactivate = canBeDeactivated(agentStatus);
  const showReactivate = canBeReactivated(agentStatus);
  const showSuspend = canBeSuspended(agentStatus);

  // Don't render anything if no actions are available
  if (!showDeactivate && !showReactivate && !showSuspend) {
    return null;
  }

  const handleAction = async () => {
    if (!currentAction) return;

    setIsProcessing(true);
    setError(null);

    try {
      const endpoint = `/api/admin/agents/${agent.id}/${currentAction}`;
      const body: any = {};

      if (currentAction === 'deactivate' || currentAction === 'suspend') {
        if (reason.trim().length < 10) {
          setError('Reason must be at least 10 characters');
          setIsProcessing(false);
          return;
        }
        body.reason = reason.trim();
      }

      if (currentAction === 'reactivate') {
        if (reason.trim()) {
          body.reason = reason.trim();
        }
        body.queueBuild = queueBuild;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `Failed to ${currentAction} agent`);
      }

      // Success - close modal and refresh
      setCurrentAction(null);
      setReason('');
      setQueueBuild(false);
      router.refresh();
      onStatusChange?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const closeModal = () => {
    if (isProcessing) return;
    setCurrentAction(null);
    setReason('');
    setQueueBuild(false);
    setError(null);
  };

  const getModalConfig = () => {
    switch (currentAction) {
      case 'deactivate':
        return {
          title: 'Deactivate Agent',
          description:
            'Deactivating this agent will stop new site builds from being processed. The existing site will remain live.',
          buttonText: 'Deactivate Agent',
          buttonVariant: 'outline' as const,
          icon: <Pause className="h-5 w-5 text-orange-600" />,
          requireReason: true,
          showQueueBuild: false,
        };
      case 'reactivate':
        return {
          title: 'Reactivate Agent',
          description:
            'Reactivating this agent will allow site builds to be processed again. Optionally queue a new build immediately.',
          buttonText: 'Reactivate Agent',
          buttonVariant: 'default' as const,
          icon: <Play className="h-5 w-5 text-green-600" />,
          requireReason: false,
          showQueueBuild: true,
        };
      case 'suspend':
        return {
          title: 'Suspend Agent',
          description:
            'Suspending this agent is a severe action. The site will be removed from public access and all pending builds will be cancelled.',
          buttonText: 'Suspend Agent',
          buttonVariant: 'destructive' as const,
          icon: <Ban className="h-5 w-5 text-red-600" />,
          requireReason: true,
          showQueueBuild: false,
        };
      default:
        return null;
    }
  };

  const config = getModalConfig();

  return (
    <>
      {/* Action Buttons */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Status Actions</h3>
        <div className="flex flex-wrap gap-3">
          {showDeactivate && (
            <Button
              variant="outline"
              onClick={() => setCurrentAction('deactivate')}
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Pause className="h-4 w-4 mr-2" />
              Deactivate
            </Button>
          )}

          {showReactivate && (
            <Button
              variant="outline"
              onClick={() => setCurrentAction('reactivate')}
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <Play className="h-4 w-4 mr-2" />
              Reactivate
            </Button>
          )}

          {showSuspend && (
            <Button
              variant="outline"
              onClick={() => setCurrentAction('suspend')}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <Ban className="h-4 w-4 mr-2" />
              Suspend
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-3">
          {agent.status === 'active' &&
            'Agent is currently active. Deactivate to pause builds, or suspend for policy violations.'}
          {agent.status === 'inactive' &&
            'Agent is deactivated. Reactivate to resume normal operation, or suspend if needed.'}
          {agent.status === 'suspended' &&
            'Agent is suspended. Reactivate to restore their account.'}
        </p>
      </div>

      {/* Action Modal */}
      <Dialog open={currentAction !== null} onOpenChange={() => closeModal()}>
        {config && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                {config.icon}
                <DialogTitle>{config.title}</DialogTitle>
              </div>
              <DialogDescription className="pt-2">{config.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Agent Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900">
                  {agent.profile?.first_name} {agent.profile?.last_name}
                </p>
                <p className="text-xs text-gray-500">{agent.subdomain}.nestassociates.com</p>
              </div>

              {/* Reason Input */}
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Reason {config.requireReason && <span className="text-red-500">*</span>}
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    config.requireReason
                      ? 'Please provide a reason (minimum 10 characters)...'
                      : 'Optional reason...'
                  }
                  rows={3}
                />
                {config.requireReason && (
                  <p className="text-xs text-gray-500">{reason.length}/10 characters minimum</p>
                )}
              </div>

              {/* Queue Build Checkbox for Reactivation */}
              {config.showQueueBuild && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="queueBuild"
                    checked={queueBuild}
                    onCheckedChange={(checked) => setQueueBuild(checked === true)}
                  />
                  <Label htmlFor="queueBuild" className="text-sm cursor-pointer">
                    Queue a new site build immediately (P1 priority)
                  </Label>
                </div>
              )}

              {/* Warning for Suspend */}
              {currentAction === 'suspend' && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">This is a severe action</p>
                    <p className="mt-1">
                      The agent&apos;s site will be removed from public access and they will not be
                      able to log in.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                  {error}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeModal} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                variant={config.buttonVariant}
                onClick={handleAction}
                disabled={isProcessing || (config.requireReason && reason.trim().length < 10)}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  config.buttonText
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
