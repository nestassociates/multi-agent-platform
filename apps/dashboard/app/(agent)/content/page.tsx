import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { Button } from '@nest/ui';

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

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  pending_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  published: 'bg-blue-100 text-blue-800',
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
  const supabase = await createServerClient();

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
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total</div>
          <div className="text-2xl font-bold text-gray-900">{contentList.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Pending Review</div>
          <div className="text-2xl font-bold text-yellow-600">
            {contentList.filter((c) => c.status === 'pending_review').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Approved</div>
          <div className="text-2xl font-bold text-green-600">
            {contentList.filter((c) => c.status === 'approved' || c.status === 'published').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Drafts</div>
          <div className="text-2xl font-bold text-gray-600">
            {contentList.filter((c) => c.status === 'draft').length}
          </div>
        </div>
      </div>

      {/* Content List */}
      {contentList.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-4">
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
          <p className="text-gray-600 mb-6">
            Start creating content to showcase your expertise and attract clients
          </p>
          <Link href="/content/new">
            <Button>Create Your First Content</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contentList.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.title}</div>
                    {item.rejection_reason && (
                      <div className="text-xs text-red-600 mt-1">
                        Rejected: {item.rejection_reason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {contentTypeLabels[item.content_type as keyof typeof contentTypeLabels]}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        statusColors[item.status as keyof typeof statusColors]
                      }`}
                    >
                      {statusLabels[item.status as keyof typeof statusLabels]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/content/${item.id}/edit`}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/content/${item.id}`}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
