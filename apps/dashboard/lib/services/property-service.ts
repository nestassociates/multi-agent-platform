/**
 * Property Service
 * Handles property synchronization from Apex27 to our database
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Apex27Listing } from '../apex27/types';

/**
 * Find agent by Apex27 branch ID
 * @param branchId - Apex27 branch.id
 * @returns Agent ID or null if not found
 */
export async function findAgentByBranchId(
  branchId: number
): Promise<string | null> {
  const supabase = createServiceRoleClient();

  const { data: agent, error } = await supabase
    .from('agents')
    .select('id')
    .eq('apex27_branch_id', branchId.toString())
    .single();

  if (error || !agent) {
    console.log(`No agent found for branch ${branchId}`);
    return null;
  }

  return agent.id;
}

/**
 * Map Apex27 transaction type to our database enum
 */
function mapTransactionType(
  apex27Type: string
): 'sale' | 'let' | 'commercial' {
  if (apex27Type === 'rental') return 'let';
  if (apex27Type === 'sale') return 'sale';
  return 'commercial';
}

/**
 * Map Apex27 status to our database enum
 */
function mapStatus(
  apex27Status: string,
  saleProgression: string | null
): 'available' | 'under_offer' | 'sold' | 'let' {
  const status = apex27Status.toLowerCase();

  // Check sale progression for more specific status
  if (saleProgression) {
    const progression = saleProgression.toLowerCase();
    if (progression.includes('sold') || progression === 'completed') {
      return 'sold';
    }
    if (progression.includes('offer') || progression.includes('sstc')) {
      return 'under_offer';
    }
  }

  // Map basic status
  if (status === 'available' || status === 'for sale') return 'available';
  if (status === 'under offer' || status === 'sstc') return 'under_offer';
  if (status === 'sold' || status === 'completed') return 'sold';
  if (status === 'let' || status === 'tenanted') return 'let';

  return 'available'; // Default
}

/**
 * Create address JSONB from Apex27 listing
 */
function createAddressObject(listing: Apex27Listing) {
  return {
    line1: listing.address1,
    line2: listing.address2 || undefined,
    line3: listing.address3 || undefined,
    line4: listing.address4 || undefined,
    city: listing.city,
    county: listing.county || undefined,
    postcode: listing.postalCode,
    country: listing.country,
    displayAddress: listing.displayAddress,
  };
}

/**
 * Upsert property from Apex27 listing
 * Maps Apex27 fields to our database schema
 *
 * @param listing - Apex27 listing object
 * @returns Property ID if successful, null if skipped (no matching agent)
 */
export async function upsertPropertyFromApex27(
  listing: Apex27Listing
): Promise<string | null> {
  // Find matching agent by branch ID
  const agentId = await findAgentByBranchId(listing.branch.id);

  if (!agentId) {
    console.log(
      `Skipping property ${listing.id} - no agent for branch ${listing.branch.id}`
    );
    return null;
  }

  const supabase = createServiceRoleClient();

  // Parse price (might be string with decimals)
  const price = parseFloat(listing.price) || 0;

  // Build property object
  const propertyData = {
    agent_id: agentId,
    apex27_id: listing.id.toString(),
    transaction_type: mapTransactionType(listing.transactionType),
    title: listing.displayAddress || `${listing.bedrooms} bed ${listing.propertyType}`,
    description: listing.description || listing.summary || null,
    price,
    bedrooms: listing.bedrooms || 0,
    bathrooms: listing.bathrooms || 0,
    property_type: listing.propertyType,
    address: createAddressObject(listing),
    postcode: listing.postalCode,
    // PostGIS point - will be created via raw SQL
    features: [
      ...listing.bullets,
      ...listing.accessibilityFeatures,
      ...listing.heatingFeatures,
      ...listing.parkingFeatures,
      ...listing.outsideSpaceFeatures,
    ],
    floor_plan_url: null, // Not in Main API response
    virtual_tour_url: null, // Not in Main API response
    status: mapStatus(listing.status, listing.saleProgression),
    is_featured: listing.featured,
    is_hidden: false,
    raw_data: listing, // Store full Apex27 response for debugging
  };

  // Create PostGIS point if coordinates exist
  let locationWKT = null;
  if (listing.latitude && listing.longitude) {
    locationWKT = `SRID=4326;POINT(${listing.longitude} ${listing.latitude})`;
  }

  try {
    // Use raw SQL for upsert with PostGIS
    const { data, error } = await supabase.rpc('upsert_property_from_apex27', {
      p_agent_id: agentId,
      p_apex27_id: listing.id.toString(),
      p_transaction_type: propertyData.transaction_type,
      p_title: propertyData.title,
      p_description: propertyData.description,
      p_price: price,
      p_bedrooms: propertyData.bedrooms,
      p_bathrooms: propertyData.bathrooms,
      p_property_type: propertyData.property_type,
      p_address: propertyData.address,
      p_postcode: propertyData.postcode,
      p_location_wkt: locationWKT,
      p_features: propertyData.features,
      p_floor_plan_url: propertyData.floor_plan_url,
      p_virtual_tour_url: propertyData.virtual_tour_url,
      p_status: propertyData.status,
      p_is_featured: propertyData.is_featured,
      p_is_hidden: propertyData.is_hidden,
      p_raw_data: propertyData.raw_data,
    });

    if (error) {
      console.error(`Error upserting property ${listing.id}:`, error);
      throw error;
    }

    console.log(`Property ${listing.id} upserted successfully for agent ${agentId}`);
    return data;
  } catch (error) {
    console.error(`Failed to upsert property ${listing.id}:`, error);
    throw error;
  }
}

/**
 * Delete property by Apex27 ID
 * Actually marks as unavailable rather than hard delete
 */
export async function deletePropertyByApex27Id(
  apex27Id: number
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('properties')
    .update({ status: 'sold', updated_at: new Date().toISOString() })
    .eq('apex27_id', apex27Id.toString());

  if (error) {
    console.error(`Error deleting property ${apex27Id}:`, error);
    return false;
  }

  console.log(`Property ${apex27Id} marked as sold/deleted`);
  return true;
}

/**
 * Sync multiple properties from Apex27
 * @param listings - Array of Apex27 listings
 * @returns Summary of sync operation
 */
export async function syncPropertiesFromApex27(
  listings: Apex27Listing[]
): Promise<{
  total: number;
  synced: number;
  skipped: number;
  errors: number;
}> {
  let synced = 0;
  let skipped = 0;
  let errors = 0;

  for (const listing of listings) {
    try {
      const result = await upsertPropertyFromApex27(listing);
      if (result) {
        synced++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`Error syncing property ${listing.id}:`, error);
      errors++;
    }
  }

  return {
    total: listings.length,
    synced,
    skipped,
    errors,
  };
}
