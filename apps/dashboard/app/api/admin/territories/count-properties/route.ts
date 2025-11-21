import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { countPropertiesInBoundary } from '@/lib/os-datahub-client';

/**
 * POST /api/admin/territories/count-properties
 * Count properties within a boundary (for preview before creating territory)
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
    const { boundary } = body;

    if (!boundary) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Missing required field: boundary' } },
        { status: 400 }
      );
    }

    console.log('📍 [COUNT-API] Received count properties request', {
      boundaryType: boundary?.type,
      coordinatesCount: boundary?.coordinates?.[0]?.length,
      timestamp: new Date().toISOString(),
    });

    // Call OS Data Hub to count properties
    console.log('📍 [COUNT-API] Calling countPropertiesInBoundary');
    const result = await countPropertiesInBoundary(boundary);

    console.log('📍 [COUNT-API] OS Data Hub response:', {
      count: result.count,
      error: result.error,
      details: result.details,
      timestamp: new Date().toISOString(),
    });

    if (result.error) {
      console.warn('📍 [COUNT-API] OS Data Hub error:', result.error);
    }

    return NextResponse.json({
      count: result.count || 0,
      details: result.details || {
        residential: 0,
        commercial: 0,
        mixed: 0,
        other: 0,
      },
      metadata: result.metadata || null,
      error: result.error || null,
    });
  } catch (error: any) {
    console.error('📍 [COUNT-API] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
