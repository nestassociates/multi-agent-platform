import { notFound, redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { ContentModerationViewer } from '@/components/admin/content-moderation-viewer';

interface ContentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ContentDetailPage({ params }: ContentDetailPageProps) {
  const { id } = await params;
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
    .eq('id', id)
    .single();

  if (fetchError || !content) {
    notFound();
  }

  // Render the client component with the full-page layout
  return <ContentModerationViewer content={content as any} />;
}
