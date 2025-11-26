'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ModerationQueue } from '@/components/admin/moderation-queue';
import { ContentFilterBar, type ContentFilters } from '@/components/admin/content-filter-bar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';

interface Content {
  id: string;
  agent_id: string;
  content_type: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
  agent?: {
    id: string;
    profile: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

export default function ContentModerationPage() {
  const searchParams = useSearchParams();
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ContentFilters>({});
  const [pagination, setPagination] = useState<{
    nextCursor: string | null;
    hasNextPage: boolean;
    total?: number;
  }>({
    nextCursor: null,
    hasNextPage: false,
  });

  const fetchContent = async (currentFilters: ContentFilters = {}, cursor?: string) => {
    setLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams();
      if (currentFilters.content_type) params.set('content_type', currentFilters.content_type);
      if (currentFilters.agent_id) params.set('agent_id', currentFilters.agent_id);
      if (currentFilters.date_from) params.set('date_from', currentFilters.date_from);
      if (currentFilters.date_to) params.set('date_to', currentFilters.date_to);
      if (currentFilters.search) params.set('search', currentFilters.search);
      if (cursor) params.set('cursor', cursor);

      const response = await fetch(`/api/admin/content/moderation?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }

      const data = await response.json();
      setContent(data.content || []);
      setPagination(data.pagination || { nextCursor: null, hasNextPage: false });
    } catch (err: any) {
      console.error('Error fetching content:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load content on mount and when search params change
  useEffect(() => {
    // Read filters from URL params
    const urlFilters: ContentFilters = {};
    const typeParam = searchParams.get('type');
    const agentParam = searchParams.get('agent');
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const searchParam = searchParams.get('search');

    if (typeParam && typeParam !== 'all') urlFilters.content_type = typeParam;
    if (agentParam) urlFilters.agent_id = agentParam;
    if (fromParam) urlFilters.date_from = fromParam;
    if (toParam) urlFilters.date_to = toParam;
    if (searchParam) urlFilters.search = searchParam;

    setFilters(urlFilters);
    fetchContent(urlFilters);
  }, [searchParams]);

  const handleFilterChange = (newFilters: ContentFilters) => {
    setFilters(newFilters);
    fetchContent(newFilters);
  };

  const loadNextPage = () => {
    if (pagination.nextCursor) {
      fetchContent(filters, pagination.nextCursor);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/content/${id}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to approve content');
      }

      // Remove from pending list
      setContent((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      console.error('Error approving content:', err);
      throw err;
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/content/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejection_reason: reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject content');
      }

      // Remove from pending list
      setContent((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      console.error('Error rejecting content:', err);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Moderation</h1>
          <p className="text-muted-foreground">
            Review and approve content submitted by agents before it goes live on their sites
          </p>
        </div>
      </div>

      {/* Filters */}
      <ContentFilterBar onFilterChange={handleFilterChange} />

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            <h3 className="font-medium mb-1">Error loading content</h3>
            <p className="text-sm">{error}</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading content...</p>
          </CardContent>
        </Card>
      ) : content.length === 0 ? (
        /* Empty State */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-muted-foreground mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">
              {Object.keys(filters).length > 0 ? 'No content matches your filters' : 'No pending content'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {Object.keys(filters).length > 0
                ? 'Try adjusting your filters to see more results'
                : 'All content has been reviewed. Check back later!'}
            </p>
            {Object.keys(filters).length > 0 && (
              <Button variant="outline" onClick={() => handleFilterChange({})}>
                Reset Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <ModerationQueue
            content={content}
            onApprove={handleApprove}
            onReject={handleReject}
            onRefresh={() => fetchContent(filters)}
          />

          {/* Pagination */}
          {pagination.hasNextPage && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      onClick={loadNextPage}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : `Load More (${pagination.total ? `${content.length} of ${pagination.total}` : 'Next Page'})`}
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
}
