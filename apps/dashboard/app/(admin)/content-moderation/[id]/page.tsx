import { notFound, redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ContentActions } from '@/components/admin/content-actions';
import { SanitizedContent } from '@/components/admin/sanitized-content';

interface ContentDetailPageProps {
  params: {
    id: string;
  };
}

interface Content {
  id: string;
  agent_id: string;
  content_type: string;
  title: string;
  slug: string;
  excerpt?: string;
  content_body?: string;
  seo_meta_title?: string;
  seo_meta_description?: string;
  meta_keywords?: string[];
  status: string;
  featured_image_url?: string;
  created_at: string;
  updated_at: string;
  agent?: {
    id: string;
    subdomain: string;
    user_id?: string;
    profiles?: Array<{
      first_name: string;
      last_name: string;
      email: string;
    }>;
  };
}

export default async function ContentDetailPage({ params }: ContentDetailPageProps) {
  const supabase = createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    redirect('/dashboard');
  }

  // Use service role client for data fetch (bypasses RLS for complex joins)
  const supabaseAdmin = createServiceRoleClient();

  // Fetch content with agent information
  const { data: content, error: fetchError } = await supabaseAdmin
    .from('content_submissions')
    .select(
      `
      *,
      agent:agents (
        id,
        subdomain,
        user_id,
        profiles!agents_user_id_fkey (
          first_name,
          last_name,
          email
        )
      )
    `
    )
    .eq('id', params.id)
    .single();

  if (fetchError || !content) {
    notFound();
  }

  const typedContent = content as unknown as Content;

  // Format dates
  const createdDate = new Date(typedContent.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updatedDate = new Date(typedContent.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{typedContent.title}</h1>
            <p className="text-gray-600 mt-2">Review content submission for moderation</p>
          </div>
          <Badge className={getStatusColor(typedContent.status)}>
            {typedContent.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Agent Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Agent Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Agent Name</p>
              <p className="mt-1 text-base text-gray-900">
                {typedContent.agent?.profiles?.[0]?.first_name} {typedContent.agent?.profiles?.[0]?.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="mt-1 text-base text-gray-900">{typedContent.agent?.profiles?.[0]?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Subdomain</p>
              <p className="mt-1 text-base text-gray-900">{typedContent.agent?.subdomain}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Content Type</p>
              <p className="mt-1 text-base text-gray-900 capitalize">
                {typedContent.content_type}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Preview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Content Preview</CardTitle>
          <CardDescription>Review the content before approving or rejecting</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Featured Image */}
          {typedContent.featured_image_url && (
            <div className="mb-6">
              <img
                src={typedContent.featured_image_url}
                alt={typedContent.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Title and Slug */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{typedContent.title}</h2>
            <p className="text-sm text-gray-500">Slug: {typedContent.slug}</p>
          </div>

          {/* Excerpt */}
          {typedContent.excerpt && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Excerpt</h3>
              <p className="text-gray-900">{typedContent.excerpt}</p>
            </div>
          )}

          <Separator className="my-6" />

          {/* Content */}
          {typedContent.content_body && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Content</h3>
              <SanitizedContent
                html={typedContent.content_body}
                className="prose max-w-none text-gray-900"
              />
            </div>
          )}

          <Separator className="my-6" />

          {/* SEO Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">SEO Information</h3>
            <div className="space-y-4">
              {typedContent.seo_meta_title && (
                <div>
                  <p className="text-sm font-medium text-gray-500">SEO Title</p>
                  <p className="mt-1 text-base text-gray-900">{typedContent.seo_meta_title}</p>
                </div>
              )}
              {typedContent.seo_meta_description && (
                <div>
                  <p className="text-sm font-medium text-gray-500">SEO Description</p>
                  <p className="mt-1 text-base text-gray-900">{typedContent.seo_meta_description}</p>
                </div>
              )}
              {typedContent.meta_keywords && typedContent.meta_keywords.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Meta Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {typedContent.meta_keywords.map((keyword, index) => (
                      <Badge key={index} variant="outline">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Created At</p>
              <p className="mt-1 text-base text-gray-900">{createdDate}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="mt-1 text-base text-gray-900">{updatedDate}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {typedContent.status === 'pending_review' && (
        <Card>
          <CardHeader>
            <CardTitle>Moderation Actions</CardTitle>
            <CardDescription>
              Approve the content to publish it on the agent's site, or reject it with a reason.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContentActions contentId={typedContent.id} contentTitle={typedContent.title} />
          </CardContent>
        </Card>
      )}

      {/* Status Alert */}
      {typedContent.status !== 'pending_review' && (
        <Alert>
          <AlertDescription>
            This content has already been{' '}
            {typedContent.status === 'approved' ? 'approved' : 'rejected'} and is no longer
            available for moderation.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
