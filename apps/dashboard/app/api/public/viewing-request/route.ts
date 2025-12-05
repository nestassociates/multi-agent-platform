import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  viewingRequestSchema,
  buyerStatusLabels,
  mortgageStatusLabels,
  preferredTimeLabels,
} from '@nest/validation';
import { checkContactRateLimit, formatResetTime } from '@/lib/rate-limiter';
import { createViewingRequestLead } from '@/lib/apex27/client';
import { sendViewingRequestNotificationEmail } from '@nest/email';

/**
 * POST /api/public/viewing-request
 * Viewing request form submission endpoint for agent microsites
 *
 * Flow:
 * 1. Validate CORS origin
 * 2. Rate limit check (5 per IP per hour)
 * 3. Honeypot bot detection
 * 4. Zod validation
 * 5. Store in viewing_requests table
 * 6. Create lead in Apex27 (async, non-blocking)
 * 7. Send email notification to agent
 */

/**
 * Validate CORS origin
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
 * Sanitize text (strip HTML tags)
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
 * Split name into first and last name
 */
function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

/**
 * Build notes string for Apex27 lead
 */
function buildLeadNotes(data: {
  preferredDate?: string;
  preferredTime: string;
  flexibleDates: boolean;
  buyerStatus: string;
  mortgageStatus: string;
  additionalNotes?: string;
}): string {
  const lines: string[] = [];

  // Viewing preferences
  if (data.preferredDate) {
    const dateStr = new Date(data.preferredDate).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    lines.push(`Preferred date: ${dateStr}`);
  }

  lines.push(
    `Preferred time: ${preferredTimeLabels[data.preferredTime as keyof typeof preferredTimeLabels] || data.preferredTime}`
  );

  if (data.flexibleDates) {
    lines.push('Flexible on dates: Yes');
  }

  // Buyer info
  if (data.buyerStatus && data.buyerStatus !== 'not_specified') {
    lines.push(
      `Buyer status: ${buyerStatusLabels[data.buyerStatus as keyof typeof buyerStatusLabels] || data.buyerStatus}`
    );
  }

  if (data.mortgageStatus && data.mortgageStatus !== 'not_specified') {
    lines.push(
      `Mortgage status: ${mortgageStatusLabels[data.mortgageStatus as keyof typeof mortgageStatusLabels] || data.mortgageStatus}`
    );
  }

  // Additional notes
  if (data.additionalNotes) {
    lines.push('');
    lines.push(`Notes: ${data.additionalNotes}`);
  }

  return lines.join('\n');
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
 * POST /api/public/viewing-request
 * Submit viewing request form
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  // CORS validation
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
    // Rate limiting (5 per IP per hour)
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

    // Honeypot detection
    if (body.honeypot && body.honeypot.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_SUBMISSION', message: 'Invalid form submission' },
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Zod validation
    const validationResult = viewingRequestSchema.safeParse(body);

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

    const data = validationResult.data;

    // Sanitize text inputs
    const sanitizedName = sanitizeText(data.name);
    const sanitizedPhone = data.phone ? sanitizeText(data.phone) : null;
    const sanitizedNotes = data.additionalNotes ? sanitizeText(data.additionalNotes) : null;

    const supabase = createServiceRoleClient();

    // Verify agent exists and is active, get branch info
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select(`
        id,
        status,
        apex27_branch_id,
        profile:profiles!agents_user_id_fkey (
          email,
          first_name,
          last_name
        )
      `)
      .eq('id', data.agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'AGENT_NOT_FOUND', message: 'Agent not found' },
        },
        { status: 404, headers: corsHeaders }
      );
    }

    if (agent.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'AGENT_INACTIVE', message: 'Agent is not currently accepting viewing requests' },
        },
        { status: 404, headers: corsHeaders }
      );
    }

    // Get property info if propertyId provided
    let propertyAddress: string | undefined;
    let propertyPrice: string | undefined;
    let apex27ListingId: number | undefined;

    if (data.propertyId) {
      const { data: property } = await supabase
        .from('properties')
        .select('address_line_1, address_line_2, town, county, postcode, price, apex27_id')
        .eq('id', data.propertyId)
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
        propertyPrice = property.price ? `£${Number(property.price).toLocaleString()}` : undefined;
        apex27ListingId = property.apex27_id ? Number(property.apex27_id) : undefined;
      }
    }

    // Insert viewing request into database
    const { data: viewingRequest, error: insertError } = await supabase
      .from('viewing_requests')
      .insert({
        agent_id: data.agentId,
        property_id: data.propertyId || null,
        apex27_listing_id: data.apex27ListingId || (apex27ListingId ? String(apex27ListingId) : null),
        name: sanitizedName,
        email: data.email,
        phone: sanitizedPhone,
        preferred_date: data.preferredDate || null,
        preferred_time: data.preferredTime,
        flexible_dates: data.flexibleDates,
        buyer_status: data.buyerStatus,
        mortgage_status: data.mortgageStatus,
        additional_notes: sanitizedNotes,
        source_page: data.sourcePage || request.headers.get('referer') || null,
        apex27_sync_status: 'pending',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error inserting viewing request:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DATABASE_ERROR', message: 'Failed to save viewing request' },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // Sync to Apex27 (async, non-blocking)
    if (agent.apex27_branch_id && apex27ListingId) {
      const { firstName, lastName } = splitName(sanitizedName);
      const leadNotes = buildLeadNotes({
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        flexibleDates: data.flexibleDates,
        buyerStatus: data.buyerStatus,
        mortgageStatus: data.mortgageStatus,
        additionalNotes: sanitizedNotes || undefined,
      });

      // Fire and forget - don't block response
      createViewingRequestLead({
        branchId: Number(agent.apex27_branch_id),
        listingId: apex27ListingId,
        firstName,
        lastName,
        email: data.email,
        phone: sanitizedPhone || undefined,
        notes: leadNotes,
      })
        .then(async ({ contact, lead }) => {
          // Update viewing request with Apex27 IDs
          await supabase
            .from('viewing_requests')
            .update({
              apex27_contact_id: contact.id,
              apex27_lead_id: lead.id,
              apex27_sync_status: 'synced',
            })
            .eq('id', viewingRequest.id);
        })
        .catch(async (error) => {
          console.error('Apex27 sync failed:', error);
          await supabase
            .from('viewing_requests')
            .update({
              apex27_sync_status: 'failed',
              apex27_sync_error: String(error),
            })
            .eq('id', viewingRequest.id);
        });
    }

    // Send email notification to agent
    const agentProfile = Array.isArray(agent.profile) ? agent.profile[0] : agent.profile;

    if (agentProfile?.email) {
      try {
        await sendViewingRequestNotificationEmail(agentProfile.email, {
          agentName: `${agentProfile.first_name} ${agentProfile.last_name}`.trim() || 'Agent',
          viewerName: sanitizedName,
          viewerEmail: data.email,
          viewerPhone: sanitizedPhone || undefined,
          propertyAddress,
          propertyPrice,
          preferredDate: data.preferredDate
            ? new Date(data.preferredDate).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : undefined,
          preferredTime:
            preferredTimeLabels[data.preferredTime as keyof typeof preferredTimeLabels] || data.preferredTime,
          flexibleDates: data.flexibleDates,
          buyerStatus:
            buyerStatusLabels[data.buyerStatus as keyof typeof buyerStatusLabels] || data.buyerStatus,
          mortgageStatus:
            mortgageStatusLabels[data.mortgageStatus as keyof typeof mortgageStatusLabels] ||
            data.mortgageStatus,
          additionalNotes: sanitizedNotes || undefined,
        });
      } catch (emailError) {
        // Log but don't fail the request if email fails
        console.error('Failed to send viewing request notification email:', emailError);
      }
    }

    // Success response
    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your viewing request. The agent will be in touch shortly to arrange a suitable time.',
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
    console.error('POST /api/public/viewing-request error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' },
      },
      { status: 500, headers: { 'Access-Control-Allow-Origin': origin || '*' } }
    );
  }
}
