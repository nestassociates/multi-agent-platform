/**
 * Agent Actions Menu Component
 *
 * Primary action: Sync from Apex27
 * Secondary action: Manually Create Agent
 *
 * Feature: Agent Lifecycle Management UX Improvement
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, Plus, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const LAST_SYNC_KEY = 'agent-last-sync-time';

export function AgentActionsMenu() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Load last sync time from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    if (stored) {
      setLastSyncTime(new Date(stored));
    }
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);

    try {
      const response = await fetch('/api/admin/agents/auto-detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to sync agents');
      }

      // Update last sync time
      const now = new Date();
      setLastSyncTime(now);
      localStorage.setItem(LAST_SYNC_KEY, now.toISOString());

      // Show result toast
      const { new_agents_created } = data.results;

      if (new_agents_created > 0) {
        toast.success(`Found ${new_agents_created} new ${new_agents_created === 1 ? 'agent' : 'agents'} from Apex27`, {
          duration: 5000,
          description: 'Redirecting to draft agents...',
        });

        // Redirect to draft agents view
        setTimeout(() => {
          router.push('/agents?status=draft');
          router.refresh();
        }, 1000);
      } else {
        toast.info('No new agents found', {
          duration: 5000,
          description: 'All Apex27 branches already have agent records.',
        });
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error('Sync failed', {
        duration: 10000,
        description: error.message,
        action: {
          label: 'Retry',
          onClick: () => handleSync(),
        },
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const lastSyncText = lastSyncTime
    ? `Last synced: ${formatDistanceToNow(lastSyncTime, { addSuffix: true })}`
    : 'Never synced manually';

  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button disabled={isSyncing}>
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Agents
                <ChevronDown className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleSync} disabled={isSyncing}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync from Apex27
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/agents/new">
              <Plus className="h-4 w-4 mr-2" />
              Manually Create Agent
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Last synced timestamp */}
      {lastSyncTime && (
        <span className="text-sm text-muted-foreground">
          {lastSyncText}
        </span>
      )}
    </div>
  );
}
