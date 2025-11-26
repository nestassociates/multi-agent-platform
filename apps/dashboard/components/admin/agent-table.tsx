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
import { Search, Eye, UserPlus } from 'lucide-react';
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

export function AgentTable({ agents, currentStatusFilter = 'all' }: AgentTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
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
                <TableRow key={agent.id}>
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
    </div>
  );
}

export default AgentTable;
