'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Loader2, ExternalLink, Trash2, AlertTriangle } from 'lucide-react';
import { DeleteAgentDialog } from './delete-agent-dialog';

interface AgentSettingsTabProps {
  agent: {
    id: string;
    subdomain: string;
    status: string;
    profile?: {
      first_name: string;
      last_name: string;
    };
  };
  onUpdate?: () => void;
}

export function AgentSettingsTab({ agent, onUpdate }: AgentSettingsTabProps) {
  const router = useRouter();
  const [status, setStatus] = useState(agent.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusUpdate = async (newStatus: string) => {
    setError(null);
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/admin/agents/${agent.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to update status');
      }

      setStatus(newStatus);
      onUpdate?.();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setStatus(agent.status); // Revert on error
    } finally {
      setIsUpdating(false);
    }
  };

  const triggerRebuild = async () => {
    setError(null);
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/admin/build-queue/${agent.id}/trigger`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to trigger rebuild');
      }

      alert('Build queued successfully! The site will be rebuilt shortly.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const micrositeUrl = `https://${agent.subdomain}.agents.nestassociates.com`;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Status Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Agent Status
          </CardTitle>
          <CardDescription>
            Control whether this agent's microsite is active or inactive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Current Status</Label>
            <div className="flex items-center gap-4">
              <Select
                value={status}
                onValueChange={handleStatusUpdate}
                disabled={isUpdating}
              >
                <SelectTrigger id="status" className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {status === 'active' && (
              <p>
                ✓ Agent microsite is <strong>active</strong> and publicly accessible.
              </p>
            )}
            {status === 'inactive' && (
              <p>
                Agent microsite is <strong>inactive</strong>. The site will show a maintenance
                message.
              </p>
            )}
            {status === 'suspended' && (
              <p className="text-destructive">
                ⚠ Agent microsite is <strong>suspended</strong>. Access is completely blocked.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Build Management */}
      <Card>
        <CardHeader>
          <CardTitle>Site Deployment</CardTitle>
          <CardDescription>
            Manage the agent's microsite build and deployment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Microsite URL</p>
              <a
                href={micrositeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                {micrositeUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <div className="pt-2">
            <Button
              onClick={triggerRebuild}
              disabled={isUpdating}
              variant="outline"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Queueing Build...
                </>
              ) : (
                <>
                  <Settings className="mr-2 h-4 w-4" />
                  Trigger Manual Rebuild
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Manually trigger a rebuild of this agent's microsite. Use this after updating
              content or settings.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that permanently affect this agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete Agent</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this agent and all associated data
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isUpdating}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Agent
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteAgentDialog
        agent={agent}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </div>
  );
}

export default AgentSettingsTab;
