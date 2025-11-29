/**
 * API Documentation Page
 * T028: Create API docs page
 * T029: Admin-only access control (dev environment allows all)
 *
 * Interactive API documentation using Swagger UI
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SwaggerUIWrapper } from '@/components/swagger-ui';

export const metadata = {
  title: 'API Documentation | Nest Associates',
  description: 'Interactive API documentation for the Nest Associates platform',
};

export default async function ApiDocsPage() {
  // In production, restrict to admin users
  // In development, allow all access for easier testing
  if (process.env.NODE_ENV === 'production') {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login?redirect=/api-docs');
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      redirect('/dashboard');
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">API Documentation</h1>
          <p className="text-muted-foreground mt-2">
            Interactive API reference for the Nest Associates platform.
            Use the &quot;Try it out&quot; button on any endpoint to test requests.
          </p>
        </div>

        <div className="bg-card rounded-lg border shadow-sm p-6">
          <SwaggerUIWrapper />
        </div>

        <div className="mt-8 text-sm text-muted-foreground">
          <p>
            <strong>Note:</strong> Authentication is required for most endpoints.
            Use the login endpoint to obtain a JWT token, then click &quot;Authorize&quot;
            to set the bearer token for testing protected endpoints.
          </p>
        </div>
      </div>
    </div>
  );
}
