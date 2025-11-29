import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { GlobalContentEditor } from '@/components/admin/global-content-editor';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { globalContentTypes, type GlobalContentType } from '@nest/validation';

interface GlobalContentEditPageProps {
  params: Promise<{ type: string }>;
}

export default async function GlobalContentEditPage({ params }: GlobalContentEditPageProps) {
  const { type } = await params;
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  // Validate content type
  if (!globalContentTypes.includes(type as GlobalContentType)) {
    notFound();
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

  // Fetch specific content
  const { data: content, error } = await supabase
    .from('global_content')
    .select('*')
    .eq('content_type', type)
    .single();

  // Parse content body
  let parsedContent = null;
  if (content?.content_body) {
    try {
      parsedContent = JSON.parse(content.content_body);
    } catch {
      // If not valid JSON, wrap in html object for legal pages
      parsedContent = { html: content.content_body };
    }
  }

  // Count active agents for rebuild warning
  const { count: activeAgentCount } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const initialData = content
    ? {
        id: content.id,
        content: parsedContent,
        isPublished: content.is_published,
        publishedAt: content.published_at,
        updatedAt: content.updated_at,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/global-content">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Global Content
          </Link>
        </Button>
      </div>

      <GlobalContentEditor
        contentType={type as GlobalContentType}
        initialData={initialData}
        activeAgentCount={activeAgentCount || 0}
      />
    </div>
  );
}
