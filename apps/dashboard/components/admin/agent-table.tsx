'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Search, Eye } from 'lucide-react';

interface Agent {
  id: string;
  subdomain: string;
  apex27_branch_id: string | null;
  status: string;
  created_at: string;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface AgentTableProps {
  agents: Agent[];
  onRefresh?: () => void;
}

export function AgentTable({ agents, onRefresh }: AgentTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter and search agents
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      // Status filter
      if (statusFilter !== 'all' && agent.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fullName = `${agent.profile?.first_name} ${agent.profile?.last_name}`.toLowerCase();
        const email = agent.profile?.email?.toLowerCase() || '';
        const subdomain = agent.subdomain.toLowerCase();
        const branchId = agent.apex27_branch_id?.toLowerCase() || '';

        return (
          fullName.includes(query) ||
          email.includes(query) ||
          subdomain.includes(query) ||
          branchId.includes(query)
        );
      }

      return true;
    });
  }, [agents, searchQuery, statusFilter]);

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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
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
                    {agent.profile?.first_name} {agent.profile?.last_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {agent.profile?.email}
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                      {agent.subdomain}
                    </code>
                  </TableCell>
                  <TableCell>
                    {agent.apex27_branch_id ? (
                      <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                        {agent.apex27_branch_id}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        agent.status === 'active'
                          ? 'default'
                          : agent.status === 'inactive'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {agent.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
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
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'No agents have been created yet.'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
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
