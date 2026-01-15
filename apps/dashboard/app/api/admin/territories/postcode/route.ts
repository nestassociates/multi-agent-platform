export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { postcodeAssignmentSchema, removePostcodeAssignmentSchema } from '@nest/validation';

/**
 * POST /api/admin/territories/postcode
 * Assign sectors to an agent
 *
 * Feature: 008-postcode-sector-territories
 * Simplified: Only sector-level assignments (no more "full district")
 *
 * Request body:
 * - agent_id: UUID of the agent
 * - sector_codes: Array of sector codes (e.g., ["TA1 1", "TA1 2"]) - REQUIRED
 * - postcode_code: Optional district code for validation
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

    const { agent_id, sector_codes, postcode_code } = validationResult.data;

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

    // Verify all sector codes exist in the database
    const { data: sectors, error: sectorsError } = await supabase
      .from('postcode_sectors')
      .select('code, district_code')
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
            message: 'Some sector codes are invalid',
            details: { invalid_sectors: invalidSectors },
          },
        },
        { status: 400 }
      );
    }

    // If postcode_code was provided, verify sectors belong to it
    if (postcode_code) {
      const wrongDistrict = sectors?.filter((s) => s.district_code !== postcode_code) || [];
      if (wrongDistrict.length > 0) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Some sector codes do not belong to the specified district',
              details: { wrong_district_sectors: wrongDistrict.map((s) => s.code) },
            },
          },
          { status: 400 }
        );
      }
    }

    const assignments: Array<{
      sector_code: string;
      assigned_at: string;
    }> = [];

    // Insert each sector assignment (upsert pattern: delete then insert)
    for (const sectorCode of sector_codes) {
      // Delete existing assignment for this specific agent+sector combo
      await supabase
        .from('agent_postcodes')
        .delete()
        .eq('agent_id', agent_id)
        .eq('sector_code', sectorCode);

      // Get the district code for this sector
      const sector = sectors?.find((s) => s.code === sectorCode);

      // Insert new assignment
      const { data: inserted, error: insertError } = await supabase
        .from('agent_postcodes')
        .insert({
          agent_id,
          postcode_code: sector?.district_code || null,
          sector_code: sectorCode,
        })
        .select('sector_code, assigned_at')
        .single();

      if (insertError) {
        console.error('Insert error for sector:', sectorCode, insertError);
        // Continue with other sectors
      } else if (inserted) {
        assignments.push(inserted);
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
 * Remove a sector assignment from an agent
 *
 * Simplified: Only sector-level removal (no more "full district")
 *
 * Request body:
 * - agent_id: UUID of the agent
 * - sector_code: Sector code to remove (REQUIRED)
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

    const { agent_id, sector_code } = validationResult.data;

    const supabase = createServiceRoleClient();

    const { error: deleteError } = await supabase
      .from('agent_postcodes')
      .delete()
      .eq('agent_id', agent_id)
      .eq('sector_code', sector_code);

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
        sector_code,
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
