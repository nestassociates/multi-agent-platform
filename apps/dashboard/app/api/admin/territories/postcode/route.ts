export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { postcodeAssignmentSchema, removePostcodeAssignmentSchema } from '@nest/validation';

/**
 * POST /api/admin/territories/postcode
 * Assign postcodes/sectors to an agent
 *
 * Feature: 008-postcode-sector-territories
 *
 * Request body:
 * - agent_id: UUID of the agent
 * - postcode_code: District code (e.g., "TA1")
 * - sector_codes: Array of sector codes (e.g., ["TA1 1", "TA1 2"]) or null/empty for full district
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validationResult = postcodeAssignmentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: validationResult.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { agent_id, postcode_code, sector_codes } = validationResult.data;

    const supabase = createServiceRoleClient();

    // Verify agent exists
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, subdomain')
      .eq('id', agent_id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Agent not found' } },
        { status: 404 }
      );
    }

    // Verify district exists
    const { data: district, error: districtError } = await supabase
      .from('postcodes')
      .select('code')
      .eq('code', postcode_code)
      .single();

    if (districtError || !district) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'District not found' } },
        { status: 404 }
      );
    }

    const assignments: Array<{
      postcode_code: string;
      sector_code: string | null;
      assigned_at: string;
    }> = [];

    const isFullDistrict = !sector_codes || sector_codes.length === 0;

    if (isFullDistrict) {
      // Full district assignment
      // First, remove any existing sector assignments for this district and agent
      await supabase
        .from('agent_postcodes')
        .delete()
        .eq('agent_id', agent_id)
        .eq('postcode_code', postcode_code);

      // Insert full district assignment (sector_code = null)
      const { data: inserted, error: insertError } = await supabase
        .from('agent_postcodes')
        .insert({
          agent_id,
          postcode_code,
          sector_code: null,
        })
        .select('postcode_code, sector_code, assigned_at')
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json(
          { error: { code: 'INSERT_ERROR', message: insertError.message } },
          { status: 500 }
        );
      }

      assignments.push(inserted);
    } else {
      // Sector-level assignments
      // Verify all sector codes exist and belong to this district
      const { data: sectors, error: sectorsError } = await supabase
        .from('postcode_sectors')
        .select('code')
        .eq('district_code', postcode_code)
        .in('code', sector_codes);

      if (sectorsError) {
        console.error('Sectors lookup error:', sectorsError);
        return NextResponse.json(
          { error: { code: 'QUERY_ERROR', message: sectorsError.message } },
          { status: 500 }
        );
      }

      const validSectorCodes = new Set(sectors?.map((s) => s.code) || []);
      const invalidSectors = sector_codes.filter((s) => !validSectorCodes.has(s));

      if (invalidSectors.length > 0) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Some sector codes are invalid or do not belong to this district',
              details: { invalid_sectors: invalidSectors },
            },
          },
          { status: 400 }
        );
      }

      // Remove any existing full district assignment for this agent
      await supabase
        .from('agent_postcodes')
        .delete()
        .eq('agent_id', agent_id)
        .eq('postcode_code', postcode_code)
        .is('sector_code', null);

      // Insert each sector assignment (delete existing first to handle duplicates)
      for (const sectorCode of sector_codes) {
        // Delete existing assignment for this specific agent+postcode+sector combo
        await supabase
          .from('agent_postcodes')
          .delete()
          .eq('agent_id', agent_id)
          .eq('postcode_code', postcode_code)
          .eq('sector_code', sectorCode);

        // Insert new assignment
        const { data: inserted, error: insertError } = await supabase
          .from('agent_postcodes')
          .insert({
            agent_id,
            postcode_code,
            sector_code: sectorCode,
          })
          .select('postcode_code, sector_code, assigned_at')
          .single();

        if (insertError) {
          console.error('Insert error for sector:', sectorCode, insertError);
          // Continue with other sectors
        } else if (inserted) {
          assignments.push(inserted);
        }
      }
    }

    return NextResponse.json({
      success: true,
      assignments,
      agent: {
        id: agent.id,
        subdomain: agent.subdomain,
      },
    });
  } catch (error: any) {
    console.error('POST /api/admin/territories/postcode error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/territories/postcode
 * Remove a postcode/sector assignment from an agent
 *
 * Request body:
 * - agent_id: UUID of the agent
 * - postcode_code: District code
 * - sector_code: Sector code (optional - if null, removes full district assignment)
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validationResult = removePostcodeAssignmentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: validationResult.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { agent_id, postcode_code, sector_code } = validationResult.data;

    const supabase = createServiceRoleClient();

    let query = supabase
      .from('agent_postcodes')
      .delete()
      .eq('agent_id', agent_id)
      .eq('postcode_code', postcode_code);

    if (sector_code) {
      query = query.eq('sector_code', sector_code);
    } else {
      query = query.is('sector_code', null);
    }

    const { error: deleteError } = await query;

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: { code: 'DELETE_ERROR', message: deleteError.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      removed: {
        agent_id,
        postcode_code,
        sector_code: sector_code || null,
      },
    });
  } catch (error: any) {
    console.error('DELETE /api/admin/territories/postcode error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
