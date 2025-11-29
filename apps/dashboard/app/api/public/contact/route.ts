import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { contactFormSchema } from '@nest/validation';
import { sendContactNotificationEmail } from '@nest/email';
import { checkContactRateLimit, formatResetTime } from '@/lib/rate-limiter';

/**
 * T041-T050: POST /api/public/contact
 * Contact form submission endpoint for agent microsites
 *
 * Security measures:
 * - T042: CORS validation for agent site subdomains
 * - T043: Zod validation
 * - T044: Honeypot bot detection
 * - T045: Rate limiting (5 per IP per hour) - NOW USING REDIS
 * - T046: HTML sanitization
 */

/**
 * T042: Validate CORS origin
 */
function validateOrigin(origin: string | null): boolean {
  if (!origin) return false;

  // Allow localhost in development
  if (process.env.NODE_ENV === 'development') {
    if (origin.startsWith('http://localhost:')) return true;
  }

  // Allow agent site subdomains
  const allowedPattern = /^https:\/\/[a-z0-9-]+\.nestassociates\.co\.uk$/;
  return allowedPattern.test(origin);
}

/**
 * T046: Sanitize text (strip HTML tags)
 */
function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, '') // Remove HTML entities
    .trim();
}

/**
 * Get client IP from request headers
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Handle CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');

  if (!validateOrigin(origin)) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin!,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * POST /api/public/contact
 * Submit contact form
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  // T042: CORS validation
  if (!validateOrigin(origin)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Invalid origin' },
      },
      {
        status: 403,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': origin!,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // T045: Rate limiting using Redis (FR-003: 5 requests per IP per hour)
    const clientIp = getClientIp(request);
    const rateLimit = await checkContactRateLimit(clientIp);

    if (rateLimit.limited) {
      const retryAfter = formatResetTime(rateLimit.resetAt);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: `Too many submissions. Try again in ${retryAfter}.`,
            remaining: rateLimit.remaining,
            resetAt: rateLimit.resetAt,
          },
        },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          },
        }
      );
    }

    // Parse request body
    const body = await request.json();

    // T044: Honeypot detection
    if (body.honeypot && body.honeypot.length > 0) {
      // Silently reject bot submissions with generic error
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_SUBMISSION', message: 'Invalid form submission' },
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // T043: Zod validation
    const validationResult = contactFormSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: firstError.message,
            details: {
              field: firstError.path.join('.'),
              reason: firstError.message,
            },
          },
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const { agentId, propertyId, name, email, phone, message } = validationResult.data;

    // T046: Sanitize message content
    const sanitizedName = sanitizeText(name);
    const sanitizedMessage = sanitizeText(message);
    const sanitizedPhone = phone ? sanitizeText(phone) : null;

    const supabase = createServiceRoleClient();

    // Verify agent exists and is active
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select(`
        id,
        status,
        profile:profiles!agents_user_id_fkey (
          email,
          first_name,
          last_name
        )
      `)
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'AGENT_NOT_FOUND', message: 'Agent not found or inactive' },
        },
        { status: 404, headers: corsHeaders }
      );
    }

    if (agent.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'AGENT_NOT_FOUND', message: 'Agent not found or inactive' },
        },
        { status: 404, headers: corsHeaders }
      );
    }

    // Get property address if propertyId provided
    let propertyAddress: string | undefined;
    if (propertyId) {
      const { data: property } = await supabase
        .from('properties')
        .select('address_line_1, address_line_2, town, county, postcode')
        .eq('id', propertyId)
        .single();

      if (property) {
        propertyAddress = [
          property.address_line_1,
          property.address_line_2,
          property.town,
          property.county,
          property.postcode,
        ]
          .filter(Boolean)
          .join(', ');
      }
    }

    // T047: Insert into database
    const { error: insertError } = await supabase
      .from('contact_form_submissions')
      .insert({
        agent_id: agentId,
        property_id: propertyId || null,
        name: sanitizedName,
        email,
        phone: sanitizedPhone,
        message: sanitizedMessage,
        source_page: request.headers.get('referer') || null,
        referrer: request.headers.get('referer') || null,
      });

    if (insertError) {
      console.error('Error inserting contact submission:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DATABASE_ERROR', message: 'Failed to save submission' },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // T049: Send notification email to agent
    const agentProfile = Array.isArray(agent.profile) ? agent.profile[0] : agent.profile;

    if (agentProfile?.email) {
      try {
        await sendContactNotificationEmail(agentProfile.email, {
          agentName: `${agentProfile.first_name} ${agentProfile.last_name}`.trim() || 'Agent',
          senderName: sanitizedName,
          senderEmail: email,
          senderPhone: sanitizedPhone || undefined,
          message: sanitizedMessage,
          propertyAddress,
        });
      } catch (emailError) {
        // Log but don't fail the request if email fails
        console.error('Failed to send contact notification email:', emailError);
      }
    }

    // T050: Success response
    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your message. The agent will respond shortly.',
      },
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetAt),
        },
      }
    );
  } catch (error) {
    console.error('POST /api/public/contact error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' },
      },
      { status: 500, headers: { 'Access-Control-Allow-Origin': origin || '*' } }
    );
  }
}
