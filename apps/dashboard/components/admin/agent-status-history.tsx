/**
 * Agent Status History Component
 *
 * Displays a timeline of status changes for an agent
 *
 * Feature: 004-agent-lifecycle-management
 * Tasks: T078, T080
 */

import { Clock, User, ArrowRight, Play, Pause, Ban, CheckCircle2 } from 'lucide-react';
import type { StatusHistoryEntry } from '@/lib/services/status-history';
import {
  getActionLabel,
  getActionColor,
  getActionBgColor,
} from '@/lib/services/status-history';
import { STATUS_LABELS } from '@/lib/services/status-validator';
import type { AgentStatusType } from '@nest/validation';

interface AgentStatusHistoryProps {
  history: StatusHistoryEntry[];
}

export function AgentStatusHistory({ history }: AgentStatusHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Status History</h3>
        <div className="text-center py-8 text-gray-500">
          <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No status changes recorded yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">Status History</h3>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-6">
          {history.map((entry, index) => (
            <StatusHistoryItem key={entry.id} entry={entry} isFirst={index === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusHistoryItem({
  entry,
  isFirst,
}: {
  entry: StatusHistoryEntry;
  isFirst: boolean;
}) {
  const actionColor = getActionColor(entry.action);
  const actionBgColor = getActionBgColor(entry.action);
  const Icon = getActionIcon(entry.action);

  const previousLabel = entry.previousStatus
    ? STATUS_LABELS[entry.previousStatus as AgentStatusType] || entry.previousStatus
    : null;
  const newLabel = entry.newStatus
    ? STATUS_LABELS[entry.newStatus as AgentStatusType] || entry.newStatus
    : null;

  return (
    <div className="relative flex gap-4">
      {/* Icon */}
      <div
        className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ${actionBgColor} ${isFirst ? 'ring-4 ring-white' : ''}`}
      >
        <Icon className={`h-5 w-5 ${actionColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-gray-900">{getActionLabel(entry.action)}</p>

            {/* Status transition */}
            {(previousLabel || newLabel) && (
              <div className="flex items-center gap-2 mt-1 text-sm">
                {previousLabel && (
                  <span className="text-gray-500">{previousLabel}</span>
                )}
                {previousLabel && newLabel && (
                  <ArrowRight className="h-3 w-3 text-gray-400" />
                )}
                {newLabel && (
                  <span className={`font-medium ${getStatusTextColor(entry.newStatus)}`}>
                    {newLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Timestamp */}
          <time className="text-xs text-gray-500 whitespace-nowrap">
            {formatDateTime(entry.createdAt)}
          </time>
        </div>

        {/* Reason */}
        {entry.reason && (
          <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded p-2 border-l-2 border-gray-300">
            &ldquo;{entry.reason}&rdquo;
          </p>
        )}

        {/* Performed by */}
        {entry.performedBy && (
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
            <User className="h-3 w-3" />
            <span>
              by {entry.performedBy.name}{' '}
              <span className="text-gray-400">({entry.performedBy.email})</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function getActionIcon(action: string) {
  if (action.includes('suspend')) return Ban;
  if (action.includes('deactivat')) return Pause;
  if (action.includes('reactivat')) return Play;
  if (action.includes('activat')) return CheckCircle2;
  return Clock;
}

function getStatusTextColor(status: string | null): string {
  switch (status) {
    case 'active':
      return 'text-green-600';
    case 'inactive':
      return 'text-orange-600';
    case 'suspended':
      return 'text-red-600';
    case 'pending_admin':
      return 'text-blue-600';
    case 'pending_profile':
      return 'text-yellow-600';
    case 'draft':
      return 'text-gray-600';
    default:
      return 'text-gray-900';
  }
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Relative time for recent events
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  // Absolute date for older events
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export default AgentStatusHistory;
