/**
 * Apex27 Webhook Endpoint
 * Receives real-time property updates from Apex27 CRM
 *
 * Events: listing.create, listing.update, listing.delete
 * Security: None (per James @ Apex27 - trust the endpoint)
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Apex27Listing, Apex27WebhookPayload } from '@/lib/apex27/types';
import {
  upsertPropertyFromApex27,
  deletePropertyByApex27Id,
} from '@/lib/services/property-service';
import { ensureAgentExists } from '@/lib/services/agent-detection';

export async function POST(request: NextRequest) {
  try {
    const payload: Apex27WebhookPayload = await request.json();

    console.log(`[Webhook] Received ${payload.action} event for listing ${payload.listing.id}`);

    // Handle different webhook actions
    switch (payload.action) {
      case 'create':
      case 'update':
        // T016-T018: Auto-detect and ensure agent exists for this branch
        if (payload.listing.branch?.id) {
          try {
            await ensureAgentExists(
              String(payload.listing.branch.id), // Convert number to string
              payload.listing.branch.name || null,
              payload.listing.branch // Pass full branch details for contact data
            );
          } catch (error) {
            console.error('Auto-detection failed (non-fatal):', error);
            // Continue processing property even if agent creation fails
          }
        }

        // T004-T007: Filter non-exportable properties
        // Check if property is marked as exportable in Apex27
        if (!payload.listing.exportable) {
          console.log(
            `[Webhook] Filtering non-exportable property ${payload.listing.id} (${payload.listing.displayAddress || 'No address'})`
          );

          // If this is an update and property exists, delete it
          if (payload.action === 'update') {
            await deletePropertyByApex27Id(payload.listing.id);
            console.log(
              `[Webhook] Deleted property ${payload.listing.id} - changed to non-exportable`
            );
          }

          return NextResponse.json(
            {
              success: true,
              message: 'Property filtered - not exportable',
              listingId: payload.listing.id,
              exportable: false,
            },
            { status: 200 }
          );
        }

        // Upsert the property (create or update) - only if exportable
        const propertyId = await upsertPropertyFromApex27(payload.listing);

        if (!propertyId) {
          // Property skipped (no matching agent for branch)
          console.log(
            `[Webhook] Skipped listing ${payload.listing.id} - no agent for branch ${payload.listing.branch.id}`
          );
          return NextResponse.json(
            {
              success: true,
              message: 'Property skipped - no matching agent',
              listingId: payload.listing.id,
              branchId: payload.listing.branch.id,
            },
            { status: 200 }
          );
        }

        console.log(
          `[Webhook] ${payload.action === 'create' ? 'Created' : 'Updated'} property ${propertyId} from listing ${payload.listing.id} (exportable: true)`
        );

        return NextResponse.json(
          {
            success: true,
            message: `Property ${payload.action}d successfully`,
            propertyId,
            listingId: payload.listing.id,
            exportable: true,
          },
          { status: 200 }
        );

      case 'delete':
        // Mark property as deleted/unavailable
        const deleted = await deletePropertyByApex27Id(payload.listing.id);

        console.log(
          `[Webhook] Deleted listing ${payload.listing.id}, result: ${deleted}`
        );

        return NextResponse.json(
          {
            success: true,
            message: 'Property marked as deleted',
            listingId: payload.listing.id,
          },
          { status: 200 }
        );

      default:
        console.warn(`[Webhook] Unknown action: ${payload.action}`);
        return NextResponse.json(
          {
            success: false,
            error: 'Unknown action type',
          },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('[Webhook] Error processing webhook:', error);

    // Return 200 even on error so Apex27 doesn't retry
    // (per James: they don't retry, but being defensive)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message,
      },
      { status: 200 }
    );
  }
}
