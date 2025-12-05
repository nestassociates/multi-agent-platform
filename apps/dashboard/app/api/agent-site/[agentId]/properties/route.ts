/**
 * Agent Site Properties API
 * Returns properties for an agent's microsite
 * Properties are fetched at runtime for freshness
 * Images are fetched from Apex27 API (authenticated)
 */

import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getListingImages, getListingFloorplans, getListingEpc } from '@/lib/apex27/client';

interface RouteParams {
  params: Promise<{ agentId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { agentId } = await params;

  if (!agentId) {
    return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  try {
    // Fetch properties for the agent
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*')
      .eq('agent_id', agentId)
      .in('status', ['available', 'under_offer'])
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching properties:', error);
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
    }

    // Format properties and fetch images from Apex27 API
    const formattedProperties = await Promise.all(
      (properties || []).map(async (p) => {
        // Address is stored as JSONB - extract displayAddress or format from components
        const addressObj = p.address as { displayAddress?: string; line1?: string; city?: string; county?: string } | null;
        const displayAddress = addressObj?.displayAddress
          || [addressObj?.line1, addressObj?.city, addressObj?.county].filter(Boolean).join(', ')
          || null;

        // Fetch images from Apex27 API if we have an apex27_id
        let images: string[] = p.images || [];
        let floorplans: string[] = p.floorplans || [];
        let epcUrl: string | null = p.epc_url;

        if (p.apex27_id) {
          try {
            // Fetch images, floorplans, and EPC in parallel
            const [imageData, floorplanData, epcData] = await Promise.all([
              getListingImages(p.apex27_id),
              getListingFloorplans(p.apex27_id),
              getListingEpc(p.apex27_id),
            ]);

            // Sort by order and extract URLs
            images = imageData.sort((a, b) => a.order - b.order).map(img => img.url);
            floorplans = floorplanData.sort((a, b) => a.order - b.order).map(fp => fp.url);
            epcUrl = epcData.length > 0 ? epcData[0].url : null;
          } catch (mediaError) {
            console.error(`Failed to fetch media for property ${p.apex27_id}:`, mediaError);
            // Keep the fallback values set above
          }
        }

        return {
          id: p.id,
          title: p.title,
          slug: p.slug || p.id,
          price: p.price,
          transactionType: p.transaction_type,
          propertyType: p.property_type,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          description: p.description,
          address: displayAddress,
          postcode: p.postcode,
          latitude: p.latitude,
          longitude: p.longitude,
          status: p.status,
          images,
          floorplans,
          epcUrl,
          apex27Id: p.apex27_id,
        };
      })
    );

    // Enable CORS for local development
    return NextResponse.json(formattedProperties, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error) {
    console.error('Error fetching agent properties:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
