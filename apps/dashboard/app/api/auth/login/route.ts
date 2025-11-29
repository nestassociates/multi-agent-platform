import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@nest/validation';
import { checkLoginRateLimit, formatResetTime } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = loginSchema.parse(body);

    // Check rate limiting (FR-002: 5 attempts per 15 minutes)
    const rateLimit = await checkLoginRateLimit(validatedData.email);

    if (rateLimit.limited) {
      const retryAfter = formatResetTime(rateLimit.resetAt);
      const response = NextResponse.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: `Too many login attempts. Try again in ${retryAfter}.`,
            remaining: rateLimit.remaining,
            resetAt: rateLimit.resetAt,
          },
        },
        { status: 429 }
      );

      // Add rate limit headers (FR-006, T013)
      response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
      response.headers.set('X-RateLimit-Reset', String(rateLimit.resetAt));

      return response;
    }

    const supabase = createClient();

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      const response = NextResponse.json(
        {
          error: { code: 'INVALID_CREDENTIALS', message: error.message },
          remaining: rateLimit.remaining,
          resetAt: rateLimit.resetAt,
        },
        { status: 401 }
      );

      // Add rate limit headers even on failed auth
      response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
      response.headers.set('X-RateLimit-Reset', String(rateLimit.resetAt));

      return response;
    }

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
