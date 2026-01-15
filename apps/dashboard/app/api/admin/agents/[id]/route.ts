import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { z } from 'zod';
import { addBuild } from '@nest/build-system';
import { geocodeLocation } from '@/lib/geocoding';

const updateAgentSchema = z.object({
  phone: z.string().optional(),
  bio: z.string().max(500).optional(),
  apex27_branch_id: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  // Office location for geo-search
  office_address: z.string().max(500).optional(),
  office_lat: z.number().min(-90).max(90).optional(),
  office_lng: z.number().min(-180).max(180).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();
    const { data: agent, error } = await supabase
      .from('agents')
      .select('*, profile:profiles!agents_user_id_fkey(first_name, last_name, email, phone, avatar_url)')
      .eq('id', params.id)
      .single();

    if (error || !agent) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Agent not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: agent });
  } catch (error: any) {
    console.error('Error fetching agent:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();

    // T237: Explicit validation - prevent email/subdomain changes
    if (body.email !== undefined) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Email cannot be changed via this endpoint' } },
        { status: 400 }
      );
    }

    if (body.subdomain !== undefined) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Subdomain cannot be changed via this endpoint' } },
        { status: 400 }
      );
    }

    const validatedData = updateAgentSchema.parse(body);

    const supabase = createServiceRoleClient();

    // Check if agent exists
    const { data: existingAgent, error: fetchError } = await supabase
      .from('agents')
      .select('id, user_id')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingAgent) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Agent not found' } },
        { status: 404 }
      );
    }

    // Prepare updates
    const agentUpdates: any = {};
    const profileUpdates: any = {};

    if (validatedData.bio !== undefined) agentUpdates.bio = validatedData.bio;
    if (validatedData.apex27_branch_id !== undefined) {
      agentUpdates.apex27_branch_id = validatedData.apex27_branch_id || null;
    }
    if (validatedData.status !== undefined) agentUpdates.status = validatedData.status;
    if (validatedData.phone !== undefined) profileUpdates.phone = validatedData.phone || null;

    // Handle office location update
    let locationUpdated = false;
    if (validatedData.office_address !== undefined) {
      agentUpdates.branch_name = validatedData.office_address || null;

      // If coordinates provided, use them directly
      if (validatedData.office_lat !== undefined && validatedData.office_lng !== undefined) {
        // Update location using PostGIS - will be done via raw SQL below
        locationUpdated = true;
      }
      // Otherwise, geocode the address
      else if (validatedData.office_address) {
        const geocodeResult = await geocodeLocation(validatedData.office_address);
        if (geocodeResult) {
          validatedData.office_lat = geocodeResult.lat;
          validatedData.office_lng = geocodeResult.lng;
          locationUpdated = true;
        }
      }
      // If address cleared, clear location too
      else {
        locationUpdated = true;
        validatedData.office_lat = undefined;
        validatedData.office_lng = undefined;
      }
    }

    // Update agent table
    if (Object.keys(agentUpdates).length > 0) {
      const { error: agentError } = await supabase
        .from('agents')
        .update(agentUpdates)
        .eq('id', params.id);

      if (agentError) {
        console.error('Error updating agent:', agentError);
        return NextResponse.json(
          { error: { code: 'UPDATE_ERROR', message: agentError.message } },
          { status: 400 }
        );
      }
    }

    // Update location separately using raw SQL for PostGIS
    if (locationUpdated) {
      if (validatedData.office_lat !== undefined && validatedData.office_lng !== undefined) {
        // Set location point
        const { error: locationError } = await supabase.rpc('update_agent_location', {
          agent_id: params.id,
          lat: validatedData.office_lat,
          lng: validatedData.office_lng,
        });

        if (locationError) {
          console.error('Error updating agent location:', locationError);
          // Don't fail the whole request, just log the error
        }
      } else {
        // Clear location
        const { error: clearError } = await supabase
          .from('agents')
          .update({ location: null })
          .eq('id', params.id);

        if (clearError) {
          console.error('Error clearing agent location:', clearError);
        }
      }
    }

    // Update profile table
    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('user_id', existingAgent.user_id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        return NextResponse.json(
          { error: { code: 'UPDATE_ERROR', message: profileError.message } },
          { status: 400 }
        );
      }
    }

    // Trigger rebuild if bio or status changed
    if (validatedData.bio !== undefined || validatedData.status !== undefined) {
      try {
        await addBuild({
          agent_id: params.id,
          trigger_reason: validatedData.bio !== undefined ? 'Profile bio updated' : 'Agent status changed',
          priority: 3, // Normal priority for profile updates
        });
      } catch (buildError) {
        console.error('Error queuing build:', buildError);
        // Don't fail the request if queue fails
      }
    }

    // Fetch updated agent
    const { data: updatedAgent } = await supabase
      .from('agents')
      .select('*, profile:profiles!agents_user_id_fkey(first_name, last_name, email, phone, avatar_url)')
      .eq('id', params.id)
      .single();

    return NextResponse.json({ data: updatedAgent });
  } catch (error: any) {
    console.error('Error updating agent:', error);

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // Fetch agent to get user_id
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('id, user_id')
      .eq('id', params.id)
      .single();

    if (fetchError || !agent) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Agent not found' } },
        { status: 404 }
      );
    }

    // Delete in order (cascade):
    // 1. Content submissions
    await supabase.from('content_submissions').delete().eq('agent_id', params.id);

    // 2. Build queue
    await supabase.from('build_queue').delete().eq('agent_id', params.id);

    // 3. Properties (unassign, don't delete)
    await supabase.from('properties').update({ agent_id: null }).eq('agent_id', params.id);

    // 4. Agent record
    const { error: agentError } = await supabase
      .from('agents')
      .delete()
      .eq('id', params.id);

    if (agentError) {
      console.error('Error deleting agent:', agentError);
      return NextResponse.json(
        { error: { code: 'DELETE_ERROR', message: agentError.message } },
        { status: 400 }
      );
    }

    // 5. Profile record
    await supabase.from('profiles').delete().eq('user_id', agent.user_id);

    // 6. Auth user
    await supabase.auth.admin.deleteUser(agent.user_id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
