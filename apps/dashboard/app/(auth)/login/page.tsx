import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LoginForm from './login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string };
}) {
  // Check if already authenticated
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Redirect based on role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const redirectPath = profile?.role === 'agent' ? '/dashboard' : '/agents';
    redirect(searchParams.redirectTo || redirectPath);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Nest Associates</h1>
          <p className="mt-2 text-gray-600">Multi-Agent Platform</p>
        </div>

        <LoginForm redirectTo={searchParams.redirectTo} />
      </div>
    </div>
  );
}
