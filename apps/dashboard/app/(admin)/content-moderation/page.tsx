'use client';

import { useEffect, useState } from 'react';
import { ModerationQueue } from '@/components/admin/moderation-queue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    };
  };
}

export default function ContentModerationPage() {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/content/moderation');

      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }

      const data = await response.json();
      setContent(data.content || []);
    } catch (err: any) {
      console.error('Error fetching content:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

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
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Content Moderation</h1>
        <p className="text-gray-600 mt-2">
          Review and approve content submitted by agents before it goes live on their sites.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{content.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Review Time</CardDescription>
            <CardTitle className="text-2xl">24h</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approval Rate</CardDescription>
            <CardTitle className="text-2xl text-green-600">94%</CardTitle>
          </CardHeader>
        </Card>
      </div>

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
      ) : (
        <ModerationQueue
          content={content}
          onApprove={handleApprove}
          onReject={handleReject}
          onRefresh={fetchContent}
        />
      )}
    </div>
  );
}
