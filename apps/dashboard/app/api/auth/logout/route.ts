import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = createClient();

  await supabase.auth.signOut();

  // Redirect to login page after logout
  const url = new URL('/login', request.url);
  return NextResponse.redirect(url);
}
