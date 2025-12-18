export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { z } from 'zod';

const checkConflictsSchema = z.object({
  agent_id: z.string().uuid(),
  postcode_code: z.string().regex(/^[A-Z]{1,2}\d{1,2}[A-Z]?$/),
  sector_codes: z.array(z.string().regex(/^[A-Z]{1,2}\d{1,2}[A-Z]?\s\d$/)).optional().nullable(),
});

interface Conflict {
  type: 'district' | 'sector' | 'existing_sectors';
  code: string;
  conflicting_agent: {
    id: string;
    subdomain: string;
    first_name?: string;
    last_name?: string;
  };
  message: string;
}

/**
 * POST /api/admin/territories/check-conflicts
 * Check for assignment conflicts before creating an assignment
 *
 * Feature: 008-postcode-sector-territories
 *
 * Request body:
 * - agent_id: UUID of the agent to assign to
 * - postcode_code: District code (e.g., "TA1")
 * - sector_codes: Array of sector codes or null for full district
 *
 * Returns:
 * - has_conflicts: boolean
 * - conflicts: Array of conflict details
 * - can_reassign: boolean (whether conflicts can be resolved by reassigning)
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
    const validationResult = checkConflictsSchema.safeParse(body);
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
    const conflicts: Conflict[] = [];

    const isFullDistrict = !sector_codes || sector_codes.length === 0;

    if (isFullDistrict) {
      // Case 1: Assigning full district
      // Check if district is already fully assigned to another agent
      const { data: existingFullAssignment } = await supabase
        .from('agent_postcodes')
        .select(`
          agent_id,
          agents!inner (
            id,
            subdomain,
            profiles (
              first_name,
              last_name
            )
          )
        `)
        .eq('postcode_code', postcode_code)
        .is('sector_code', null)
        .neq('agent_id', agent_id)
        .maybeSingle();

      if (existingFullAssignment) {
        conflicts.push({
          type: 'district',
          code: postcode_code,
          conflicting_agent: {
            id: existingFullAssignment.agent_id,
            subdomain: (existingFullAssignment.agents as any)?.subdomain,
            first_name: (existingFullAssignment.agents as any)?.profiles?.first_name,
            last_name: (existingFullAssignment.agents as any)?.profiles?.last_name,
          },
          message: `District ${postcode_code} is already fully assigned to another agent`,
        });
      }

      // Check if any sectors in this district are assigned to other agents
      const { data: existingSectorAssignments } = await supabase
        .from('agent_postcodes')
        .select(`
          sector_code,
          agent_id,
          agents!inner (
            id,
            subdomain,
            profiles (
              first_name,
              last_name
            )
          )
        `)
        .eq('postcode_code', postcode_code)
        .not('sector_code', 'is', null)
        .neq('agent_id', agent_id);

      if (existingSectorAssignments && existingSectorAssignments.length > 0) {
        // Group by agent for clearer messaging
        const agentSectors: Record<string, { agent: any; sectors: string[] }> = {};
        existingSectorAssignments.forEach((assignment) => {
          const agentId = assignment.agent_id;
          if (!agentSectors[agentId]) {
            agentSectors[agentId] = {
              agent: {
                id: agentId,
                subdomain: (assignment.agents as any)?.subdomain,
                first_name: (assignment.agents as any)?.profiles?.first_name,
                last_name: (assignment.agents as any)?.profiles?.last_name,
              },
              sectors: [],
            };
          }
          if (assignment.sector_code) {
            agentSectors[agentId].sectors.push(assignment.sector_code);
          }
        });

        Object.values(agentSectors).forEach(({ agent, sectors }) => {
          conflicts.push({
            type: 'existing_sectors',
            code: sectors.join(', '),
            conflicting_agent: agent,
            message: `${sectors.length} sector(s) in ${postcode_code} are already assigned to another agent`,
          });
        });
      }
    } else {
      // Case 2: Assigning specific sectors
      // Check if the district is already fully assigned to another agent
      const { data: existingFullAssignment } = await supabase
        .from('agent_postcodes')
        .select(`
          agent_id,
          agents!inner (
            id,
            subdomain,
            profiles (
              first_name,
              last_name
            )
          )
        `)
        .eq('postcode_code', postcode_code)
        .is('sector_code', null)
        .neq('agent_id', agent_id)
        .maybeSingle();

      if (existingFullAssignment) {
        conflicts.push({
          type: 'district',
          code: postcode_code,
          conflicting_agent: {
            id: existingFullAssignment.agent_id,
            subdomain: (existingFullAssignment.agents as any)?.subdomain,
            first_name: (existingFullAssignment.agents as any)?.profiles?.first_name,
            last_name: (existingFullAssignment.agents as any)?.profiles?.last_name,
          },
          message: `District ${postcode_code} is fully assigned to another agent - cannot assign individual sectors`,
        });
      }

      // Check if any of the target sectors are already assigned to other agents
      const { data: existingSectorAssignments } = await supabase
        .from('agent_postcodes')
        .select(`
          sector_code,
          agent_id,
          agents!inner (
            id,
            subdomain,
            profiles (
              first_name,
              last_name
            )
          )
        `)
        .eq('postcode_code', postcode_code)
        .in('sector_code', sector_codes)
        .neq('agent_id', agent_id);

      if (existingSectorAssignments && existingSectorAssignments.length > 0) {
        existingSectorAssignments.forEach((assignment) => {
          if (assignment.sector_code) {
            conflicts.push({
              type: 'sector',
              code: assignment.sector_code,
              conflicting_agent: {
                id: assignment.agent_id,
                subdomain: (assignment.agents as any)?.subdomain,
                first_name: (assignment.agents as any)?.profiles?.first_name,
                last_name: (assignment.agents as any)?.profiles?.last_name,
              },
              message: `Sector ${assignment.sector_code} is already assigned to another agent`,
            });
          }
        });
      }
    }

    return NextResponse.json({
      has_conflicts: conflicts.length > 0,
      conflicts,
      can_reassign: conflicts.length > 0, // All conflicts can be resolved by reassigning
      postcode_code,
      sector_codes: sector_codes || null,
      is_full_district: isFullDistrict,
    });
  } catch (error: any) {
    console.error('POST /api/admin/territories/check-conflicts error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
