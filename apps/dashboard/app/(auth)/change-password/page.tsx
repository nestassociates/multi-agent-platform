import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ChangePasswordForm from './change-password-form';

export default async function ChangePasswordPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Change Your Password</h1>
          <p className="mt-2 text-gray-600">
            For security, please change your temporary password
          </p>
        </div>

        <ChangePasswordForm />
      </div>
    </div>
  );
}
