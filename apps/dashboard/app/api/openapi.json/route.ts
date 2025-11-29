/**
 * OpenAPI JSON Endpoint
 * T026: Create OpenAPI JSON endpoint
 *
 * GET /api/openapi.json - Returns the OpenAPI specification
 */

import { NextResponse } from 'next/server';
import { generateOpenAPISpec } from '@/lib/openapi/spec';

export const dynamic = 'force-static';
export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  const spec = generateOpenAPISpec();

  return NextResponse.json(spec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
