import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { GlobalContentList } from '@/components/admin/global-content-list';

export default async function GlobalContentPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  // Use service role to bypass RLS
  const supabase = createServiceRoleClient();

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    redirect('/dashboard');
  }

  // Fetch all global content
  const { data: content, error } = await supabase
    .from('global_content')
    .select('id, content_type, is_published, published_at, updated_at')
    .order('content_type', { ascending: true });

  if (error) {
    console.error('Error fetching global content:', error);
  }

  // Format for component
  const formattedContent = (content || []).map((item) => ({
    id: item.id,
    contentType: item.content_type,
    isPublished: item.is_published,
    publishedAt: item.published_at,
    updatedAt: item.updated_at,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Global Content</h1>
        <p className="text-muted-foreground">
          Manage header, footer, and legal pages for all agent sites
        </p>
      </div>

      <GlobalContentList content={formattedContent} />
    </div>
  );
}
