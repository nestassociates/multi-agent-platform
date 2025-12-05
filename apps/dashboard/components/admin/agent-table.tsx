'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Search, Eye, UserPlus, ChevronDown, Loader2, Pause, Play, Ban, AlertTriangle } from 'lucide-react';
import { AgentStatusBadge } from '@/components/admin/agent-status-badge';
import type { AgentStatus } from '@nest/shared-types';

interface Agent {
  id: string;
  subdomain: string;
  apex27_branch_id: string | null;
  branch_name: string | null;
  apex27_contact_data?: {
    email?: string;
    phone?: string;
    address?: string;
    firstName?: string;
    lastName?: string;
  } | null;
  status: AgentStatus;
  created_at: string;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

interface AgentTableProps {
  agents: Agent[];
  currentStatusFilter?: string;
}

type BulkAction = 'deactivate' | 'reactivate' | 'suspend' | null;

export function AgentTable({ agents, currentStatusFilter = 'all' }: AgentTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkAction>(null);
  const [bulkReason, setBulkReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle status filter change (T025)
  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('status');
    } else {
      params.set('status', value);
    }
    router.push(`/agents?${params.toString()}`);
  };

  // Filter agents by search query (status already filtered server-side)
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fullName = agent.profile
          ? `${agent.profile.first_name} ${agent.profile.last_name}`.toLowerCase()
          : '';
        const email = agent.profile?.email?.toLowerCase() || '';
        const subdomain = agent.subdomain.toLowerCase();
        const branchId = agent.apex27_branch_id?.toLowerCase() || '';
        const branchName = agent.branch_name?.toLowerCase() || '';

        return (
          fullName.includes(query) ||
          email.includes(query) ||
          subdomain.includes(query) ||
          branchId.includes(query) ||
          branchName.includes(query)
        );
      }

      return true;
    });
  }, [agents, searchQuery]);

  // Handle selection
  const toggleSelect = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAgents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAgents.map(a => a.id)));
    }
  };

  // Handle bulk action
  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.size === 0) return;

    if (['deactivate', 'suspend'].includes(bulkAction) && bulkReason.trim().length < 10) {
      setBulkError('Reason must be at least 10 characters');
      return;
    }

    setIsProcessing(true);
    setBulkError(null);

    try {
      const response = await fetch('/api/admin/agents/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_ids: Array.from(selectedIds),
          action: bulkAction,
          reason: bulkReason.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Bulk update failed');
      }

      // Reset state and refresh
      setBulkAction(null);
      setBulkReason('');
      setSelectedIds(new Set());
      router.refresh();
    } catch (err: any) {
      setBulkError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const closeBulkModal = () => {
    if (isProcessing) return;
    setBulkAction(null);
    setBulkReason('');
    setBulkError(null);
  };

  // Bulk action modal config
  const getBulkModalConfig = () => {
    switch (bulkAction) {
      case 'deactivate':
        return {
          title: 'Deactivate Agents',
          description: `Deactivate ${selectedIds.size} agent(s). Sites will remain live but no new builds will be processed.`,
          buttonText: 'Deactivate All',
          buttonVariant: 'outline' as const,
          icon: <Pause className="h-5 w-5 text-orange-600" />,
          requireReason: true,
        };
      case 'reactivate':
        return {
          title: 'Reactivate Agents',
          description: `Reactivate ${selectedIds.size} agent(s). Sites will resume normal build processing.`,
          buttonText: 'Reactivate All',
          buttonVariant: 'default' as const,
          icon: <Play className="h-5 w-5 text-green-600" />,
          requireReason: false,
        };
      case 'suspend':
        return {
          title: 'Suspend Agents',
          description: `Suspend ${selectedIds.size} agent(s). Sites will be removed from public access and pending builds will be cancelled.`,
          buttonText: 'Suspend All',
          buttonVariant: 'destructive' as const,
          icon: <Ban className="h-5 w-5 text-red-600" />,
          requireReason: true,
        };
      default:
        return null;
    }
  };

  const bulkModalConfig = getBulkModalConfig();

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, subdomain, or branch ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {/* T025: Status filter with new lifecycle states */}
        <Select value={currentStatusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_profile">Pending Profile</SelectItem>
            <SelectItem value="pending_admin">Pending Approval</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        {/* T075: Bulk Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              disabled={selectedIds.size === 0}
              className="w-full sm:w-auto"
            >
              Bulk Actions ({selectedIds.size})
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setBulkAction('deactivate')}>
              <Pause className="h-4 w-4 mr-2 text-orange-600" />
              Deactivate Selected
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBulkAction('reactivate')}>
              <Play className="h-4 w-4 mr-2 text-green-600" />
              Reactivate Selected
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setBulkAction('suspend')} className="text-red-600">
              <Ban className="h-4 w-4 mr-2" />
              Suspend Selected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredAgents.length} of {agents.length} agents
      </div>

      {/* Table */}
      {filteredAgents.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === filteredAgents.length && filteredAgents.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subdomain</TableHead>
                <TableHead>Branch ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent) => (
                <TableRow key={agent.id} className={selectedIds.has(agent.id) ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(agent.id)}
                      onCheckedChange={() => toggleSelect(agent.id)}
                      aria-label={`Select ${agent.profile?.first_name || agent.subdomain}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {agent.profile ? (
                      `${agent.profile.first_name} ${agent.profile.last_name}`
                    ) : agent.apex27_contact_data?.firstName && agent.apex27_contact_data?.lastName ? (
                      <span>
                        {agent.apex27_contact_data.firstName} {agent.apex27_contact_data.lastName}
                        <span className="ml-2 text-xs text-muted-foreground">(draft)</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">
                        {agent.branch_name || `(Auto) ${agent.apex27_branch_id}`}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {agent.profile?.email || agent.apex27_contact_data?.email || '—'}
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                      {agent.subdomain}
                    </code>
                  </TableCell>
                  <TableCell>
                    {agent.apex27_branch_id ? (
                      <div>
                        <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                          {agent.apex27_branch_id}
                        </code>
                        {agent.branch_name && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {agent.branch_name}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {/* T023: Use new status badge component */}
                    <AgentStatusBadge status={agent.status} showTooltip />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* T026: Setup button for draft agents */}
                      {agent.status === 'draft' && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href={`/agents/new?draft_agent_id=${agent.id}`}>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Setup
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link href={`/agents/${agent.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-md border border-dashed p-12 text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <Search className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="font-semibold">No agents found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {searchQuery || currentStatusFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'No agents have been created yet.'}
            </p>
            {!searchQuery && currentStatusFilter === 'all' && (
              <Button asChild className="mt-4">
                <Link href="/agents/new">Create Agent</Link>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Bulk Action Confirmation Modal (T076) */}
      <Dialog open={bulkAction !== null} onOpenChange={() => closeBulkModal()}>
        {bulkModalConfig && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                {bulkModalConfig.icon}
                <DialogTitle>{bulkModalConfig.title}</DialogTitle>
              </div>
              <DialogDescription className="pt-2">
                {bulkModalConfig.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Selected Agents Summary */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900">
                  {selectedIds.size} agent(s) selected
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {filteredAgents
                    .filter(a => selectedIds.has(a.id))
                    .slice(0, 3)
                    .map(a => a.profile?.first_name || a.subdomain)
                    .join(', ')}
                  {selectedIds.size > 3 && ` and ${selectedIds.size - 3} more...`}
                </p>
              </div>

              {/* Reason Input */}
              {bulkModalConfig.requireReason && (
                <div className="space-y-2">
                  <Label htmlFor="bulk-reason">
                    Reason <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="bulk-reason"
                    value={bulkReason}
                    onChange={(e) => setBulkReason(e.target.value)}
                    placeholder="Please provide a reason (minimum 10 characters)..."
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">{bulkReason.length}/10 characters minimum</p>
                </div>
              )}

              {/* Warning for Suspend */}
              {bulkAction === 'suspend' && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">This is a severe action</p>
                    <p className="mt-1">
                      All selected agents&apos; sites will be removed from public access.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {bulkError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                  {bulkError}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeBulkModal} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                variant={bulkModalConfig.buttonVariant}
                onClick={handleBulkAction}
                disabled={isProcessing || (bulkModalConfig.requireReason && bulkReason.trim().length < 10)}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  bulkModalConfig.buttonText
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

export default AgentTable;
