'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface ContentFilters {
  content_type?: string;
  agent_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

interface Agent {
  id: string;
  business_name: string;
  subdomain: string;
  email: string;
}

interface ContentFilterBarProps {
  onFilterChange: (filters: ContentFilters) => void;
}

const contentTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'blog_post', label: 'Blog Post' },
  { value: 'area_guide', label: 'Area Guide' },
  { value: 'review', label: 'Customer Review' },
  { value: 'fee_structure', label: 'Fee Structure' },
];

export function ContentFilterBar({ onFilterChange }: ContentFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter state
  const [contentType, setContentType] = useState(searchParams.get('type') || 'all');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('to') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');

  // Combobox state
  const [open, setOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  // Load agents for dropdown
  useEffect(() => {
    const fetchAgents = async () => {
      setLoadingAgents(true);
      try {
        const response = await fetch('/api/admin/agents?limit=100');
        if (response.ok) {
          const data = await response.json();
          setAgents(data.agents || []);

          // If agent_id in URL params, find and set selected agent
          const agentIdParam = searchParams.get('agent');
          if (agentIdParam) {
            const agent = (data.agents || []).find((a: Agent) => a.id === agentIdParam);
            if (agent) setSelectedAgent(agent);
          }
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setLoadingAgents(false);
      }
    };

    fetchAgents();
  }, [searchParams]);

  // Apply filters and update URL
  const applyFilters = () => {
    const filters: ContentFilters = {};
    const params = new URLSearchParams();

    if (contentType && contentType !== 'all') {
      filters.content_type = contentType;
      params.set('type', contentType);
    }

    if (selectedAgent) {
      filters.agent_id = selectedAgent.id;
      params.set('agent', selectedAgent.id);
    }

    if (dateFrom) {
      filters.date_from = dateFrom;
      params.set('from', dateFrom);
    }

    if (dateTo) {
      filters.date_to = dateTo;
      params.set('to', dateTo);
    }

    if (search) {
      filters.search = search;
      params.set('search', search);
    }

    // Update URL with filters (for bookmarking)
    router.push(`?${params.toString()}`, { scroll: false });

    // Trigger filter change callback
    onFilterChange(filters);
  };

  // Reset all filters
  const resetFilters = () => {
    setContentType('all');
    setSelectedAgent(null);
    setDateFrom('');
    setDateTo('');
    setSearch('');
    router.push('/content-moderation', { scroll: false });
    onFilterChange({});
  };

  // Auto-apply filters when search changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters();
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Check if any filters are active
  const hasActiveFilters =
    contentType !== 'all' || selectedAgent !== null || dateFrom || dateTo || search;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Desktop: Single row layout, Mobile: Stacked */}
      <div className="flex flex-col lg:flex-row lg:items-end gap-3">
        {/* Content Type Filter */}
        <div className="w-full lg:w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
          <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              {contentTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Agent Filter (Combobox) */}
        <div className="w-full lg:w-56">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Agent</label>
          <div className="flex items-center gap-1">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {selectedAgent ? (
                    <span className="truncate">{selectedAgent.business_name}</span>
                  ) : (
                    'All agents'
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0">
                <Command>
                  <CommandInput placeholder="Search agents..." />
                  <CommandList>
                    <CommandEmpty>
                      {loadingAgents ? 'Loading agents...' : 'No agent found.'}
                    </CommandEmpty>
                    <CommandGroup>
                      {agents.map((agent) => (
                        <CommandItem
                          key={agent.id}
                          value={agent.business_name}
                          onSelect={() => {
                            setSelectedAgent(agent);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedAgent?.id === agent.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{agent.business_name}</span>
                            <span className="text-xs text-muted-foreground">{agent.email}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedAgent && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => setSelectedAgent(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search Filter */}
        <div className="w-full lg:flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Search</label>
          <Input
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Date Range Filters */}
        <div className="w-full lg:w-40">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">From</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className="w-full lg:w-40">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">To</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 lg:pb-0.5">
          <Button onClick={applyFilters} size="default">
            Apply
          </Button>
          {hasActiveFilters && (
            <Button onClick={resetFilters} variant="outline" size="default">
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
