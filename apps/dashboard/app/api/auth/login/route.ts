import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@nest/validation';
import { isRateLimited, getRemainingAttempts, resetRateLimit } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = loginSchema.parse(body);

    // Check rate limiting (FR-004: 5 attempts per 15 minutes)
    const rateLimitKey = `login:${validatedData.email}`;
    if (isRateLimited(rateLimitKey)) {
      const remaining = getRemainingAttempts(rateLimitKey);
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many login attempts. Please try again in 15 minutes.',
            remainingAttempts: remaining,
          },
        },
        { status: 429 }
      );
    }

    const supabase = createClient();

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      return NextResponse.json(
        {
          error: { code: 'INVALID_CREDENTIALS', message: error.message },
          remainingAttempts: getRemainingAttempts(rateLimitKey) - 1,
        },
        { status: 401 }
      );
    }

    // Successful login - reset rate limit
    resetRateLimit(rateLimitKey);

    // Get user profile with role
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: profile,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
