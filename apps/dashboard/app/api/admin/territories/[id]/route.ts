import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';

/**
 * PATCH /api/admin/territories/:id
 * Update territory (name, description, boundary)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { id: territoryId } = resolvedParams;
    const body = await request.json();

    const supabase = createServiceRoleClient();

    // Update territory
    const { data: territory, error } = await supabase
      .from('territories')
      .update({
        name: body.name,
        description: body.description,
        boundary: body.boundary,
        // property_count will be auto-updated by trigger if boundary changes
      })
      .eq('id', territoryId)
      .select()
      .single();

    if (error) {
      console.error('Error updating territory:', error);
      return NextResponse.json(
        { error: { code: 'UPDATE_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ territory });
  } catch (error: any) {
    console.error('PATCH /api/admin/territories/:id error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/territories/:id
 * Delete territory
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { id: territoryId } = resolvedParams;
    const supabase = createServiceRoleClient();

    // Delete territory
    const { error } = await supabase.from('territories').delete().eq('id', territoryId);

    if (error) {
      console.error('Error deleting territory:', error);
      return NextResponse.json(
        { error: { code: 'DELETE_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/admin/territories/:id error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/territories/:id/refresh
 * Refresh property count for a territory
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { id: territoryId } = resolvedParams;
    const supabase = createServiceRoleClient();

    // Call PostGIS function to update property count
    const { data, error } = await supabase.rpc('update_territory_property_count', {
      territory_id: territoryId,
    });

    if (error) {
      console.error('Error refreshing property count:', error);
      return NextResponse.json(
        { error: { code: 'REFRESH_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ property_count: data });
  } catch (error: any) {
    console.error('POST /api/admin/territories/:id/refresh error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
