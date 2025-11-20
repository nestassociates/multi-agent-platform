import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // T321: Rate Limiting for API routes
  const path = request.nextUrl.pathname;
  const clientIp = getClientIp(request);

  // Apply rate limiting based on route
  if (path.startsWith('/api/auth/')) {
    // Strict rate limiting for auth endpoints (5 per 15 min)
    const rateLimit = checkRateLimit(clientIp, RATE_LIMITS.AUTH);

    if (!rateLimit.success) {
      return new NextResponse(
        JSON.stringify({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            reset: new Date(rateLimit.reset).toISOString(),
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((rateLimit.reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.reset),
          },
        }
      );
    }
  } else if (path.startsWith('/api/public/')) {
    // Generous rate limiting for public API (300 per 5 min)
    const rateLimit = checkRateLimit(clientIp, RATE_LIMITS.PUBLIC_API);

    if (!rateLimit.success) {
      return new NextResponse(
        JSON.stringify({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please slow down.',
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((rateLimit.reset - Date.now()) / 1000)),
          },
        }
      );
    }
  } else if (path.startsWith('/api/')) {
    // Standard rate limiting for other API routes (100 per min)
    const rateLimit = checkRateLimit(clientIp, RATE_LIMITS.API);

    if (!rateLimit.success) {
      return new NextResponse(
        JSON.stringify({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests.',
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', String(rateLimit.limit));
    response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    response.headers.set('X-RateLimit-Reset', String(rateLimit.reset));
  }

  // T322: Security Headers (helmet.js-style)
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if exists
  const { data: { user } } = await supabase.auth.getUser();

  // Get user profile with role
  let userRole: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    userRole = profile?.role || null;
  }

  // TODO: Enforce 2FA for admin users (FR-002)
  // Disabled until 2FA setup page is fully implemented
  // if (user && userRole && (userRole === 'admin' || userRole === 'super_admin')) {
  //   const { data: factors } = await supabase.auth.mfa.listFactors();
  //   const has2FA = factors && factors.totp && factors.totp.length > 0;
  //   if (!has2FA && path !== '/2fa-setup' && !path.startsWith('/api/')) {
  //     const redirectUrl = request.nextUrl.clone();
  //     redirectUrl.pathname = '/2fa-setup';
  //     return NextResponse.redirect(redirectUrl);
  //   }
  // }

  // Public/system endpoints that don't require auth
  const publicPaths = [
    '/login',
    '/reset-password',
    '/api/public',
    '/api/cron',
    '/api/webhooks',
  ];

  const isPublicPath = publicPaths.some(publicPath => path.startsWith(publicPath));

  // Redirect to login if accessing protected routes without auth
  if (!user && !isPublicPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', path);
    return NextResponse.redirect(redirectUrl);
  }

  // Role-based redirects
  if (user && userRole) {
    // Admins accessing /dashboard -> redirect to /agents (their main page)
    if ((userRole === 'admin' || userRole === 'super_admin') && path === '/dashboard') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/agents';
      return NextResponse.redirect(redirectUrl);
    }

    // Agent accessing admin routes -> redirect to agent dashboard
    if (userRole === 'agent' && (path.startsWith('/agents') || path.startsWith('/territories') || path.startsWith('/content-moderation'))) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl);
    }

    // Redirect from login to appropriate page if already authenticated
    if (path === '/login') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = userRole === 'agent' ? '/dashboard' : '/agents';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
