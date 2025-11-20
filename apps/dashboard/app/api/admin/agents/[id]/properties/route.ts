import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';

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

    // Verify agent exists
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('id', params.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Agent not found' } },
        { status: 404 }
      );
    }

    // Fetch properties
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, apex27_id, title, address, postcode, transaction_type, property_type, price, bedrooms, bathrooms, status, is_featured, created_at, updated_at')
      .eq('agent_id', params.id)
      .order('created_at', { ascending: false });

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: propertiesError.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ properties: properties || [] });
  } catch (error: any) {
    console.error('Error fetching agent properties:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
