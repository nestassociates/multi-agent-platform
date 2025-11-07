import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'My Content | Agent Dashboard',
  description: 'Manage your content submissions',
};

interface Content {
  id: string;
  content_type: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
  rejection_reason?: string;
}

const statusVariants = {
  draft: 'secondary' as const,
  pending_review: 'outline' as const,
  approved: 'default' as const,
  rejected: 'destructive' as const,
  published: 'default' as const,
};

const statusLabels = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  published: 'Published',
};

const contentTypeLabels = {
  blog_post: 'Blog Post',
  area_guide: 'Area Guide',
  review: 'Customer Review',
  fee_structure: 'Fee Structure',
};

export default async function AgentContentPage() {
  const supabase = createServiceRoleClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Get agent profile
  const { data: agent } = await supabase
    .from('agents')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!agent) {
    redirect('/login');
  }

  // Fetch agent's content
  const { data: content, error: contentError } = await supabase
    .from('agent_content')
    .select('*')
    .eq('agent_id', agent.id)
    .order('updated_at', { ascending: false });

  if (contentError) {
    console.error('Error fetching content:', contentError);
  }

  const contentList = (content || []) as Content[];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Content</h1>
          <p className="text-gray-600 mt-1">
            Create and manage blog posts, area guides, reviews, and fee structures
          </p>
        </div>
        <Link href="/content/new">
          <Button>Create New Content</Button>
        </Link>
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{contentList.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              {contentList.filter((c) => c.status === 'pending_review').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {contentList.filter((c) => c.status === 'approved' || c.status === 'published').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Drafts</CardDescription>
            <CardTitle className="text-2xl text-muted-foreground">
              {contentList.filter((c) => c.status === 'draft').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Content List */}
      {contentList.length === 0 ? (
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">No content yet</h3>
            <p className="text-muted-foreground mb-6 text-center">
              Start creating content to showcase your expertise and attract clients
            </p>
            <Button asChild>
              <Link href="/content/new">Create Your First Content</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Content</CardTitle>
            <CardDescription>
              {contentList.length} {contentList.length === 1 ? 'item' : 'items'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contentList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.title}</div>
                      {item.rejection_reason && (
                        <div className="text-xs text-destructive mt-1">
                          Rejected: {item.rejection_reason}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {contentTypeLabels[item.content_type as keyof typeof contentTypeLabels]}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[item.status as keyof typeof statusVariants]}>
                        {statusLabels[item.status as keyof typeof statusLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(item.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/content/${item.id}/edit`}
                        className="text-primary hover:underline mr-4"
                      >
                        Edit
                      </Link>
                      <Link href={`/content/${item.id}`} className="text-muted-foreground hover:underline">
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
