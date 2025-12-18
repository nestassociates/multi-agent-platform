import { z } from 'zod';

/**
 * Territory Validation Schemas
 */

// GeoJSON Polygon schema
export const geoJsonPolygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(
    z.array(
      z.tuple([
        z.number().min(-180).max(180), // longitude
        z.number().min(-90).max(90),   // latitude
      ])
    ).min(4) // Polygon must have at least 4 points (first and last must be same)
  ).min(1), // At least one ring (exterior boundary)
});

export type GeoJsonPolygonInput = z.infer<typeof geoJsonPolygonSchema>;

// Create territory schema
export const createTerritorySchema = z.object({
  agent_id: z.string().uuid('Invalid agent ID'),
  name: z.string().min(1, 'Territory name is required').max(200, 'Territory name too long'),
  boundary: geoJsonPolygonSchema,
});

export type CreateTerritoryInput = z.infer<typeof createTerritorySchema>;

// Update territory schema
export const updateTerritorySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  boundary: geoJsonPolygonSchema.optional(),
  agent_id: z.string().uuid().optional(), // Reassign territory
});

export type UpdateTerritoryInput = z.infer<typeof updateTerritorySchema>;

// Check overlap schema
export const checkTerritoryOverlapSchema = z.object({
  boundary: geoJsonPolygonSchema,
  exclude_id: z.string().uuid().optional(), // Exclude this territory from overlap check
});

export type CheckTerritoryOverlapInput = z.infer<typeof checkTerritoryOverlapSchema>;

// ============================================
// Postcode Sector Validation (Feature 008)
// ============================================

/**
 * District code validation
 * Format: {AREA}{DISTRICT}
 * Examples: "TA1", "BS10", "M1", "SW1A"
 */
export const districtCodeSchema = z
  .string()
  .regex(
    /^[A-Z]{1,2}\d{1,2}[A-Z]?$/,
    'Invalid district code format (e.g., TA1, BS10, SW1A)'
  );

export type DistrictCodeInput = z.infer<typeof districtCodeSchema>;

/**
 * Sector code validation
 * Format: {DISTRICT} {DIGIT}
 * Examples: "TA1 1", "BS10 5", "M1 7"
 */
export const sectorCodeSchema = z
  .string()
  .regex(
    /^[A-Z]{1,2}\d{1,2}[A-Z]?\s\d$/,
    'Invalid sector code format (e.g., TA1 1, BS10 5)'
  );

export type SectorCodeInput = z.infer<typeof sectorCodeSchema>;

/**
 * List sectors request schema
 * GET /api/admin/sectors/list?district=TA1
 */
export const listSectorsSchema = z.object({
  district: districtCodeSchema,
});

export type ListSectorsInput = z.infer<typeof listSectorsSchema>;

/**
 * Sector count request schema
 * GET /api/admin/sectors/{code}/count
 */
export const sectorCountSchema = z.object({
  code: sectorCodeSchema,
});

export type SectorCountInput = z.infer<typeof sectorCountSchema>;

/**
 * Postcode-based territory assignment request
 * POST /api/admin/territories (when using postcodes)
 */
export const postcodeAssignmentSchema = z.object({
  agent_id: z.string().uuid('Invalid agent ID'),
  postcode_code: districtCodeSchema,
  sector_codes: z
    .array(sectorCodeSchema)
    .optional()
    .nullable()
    .describe('Specific sectors to assign (null/empty = full district)'),
});

export type PostcodeAssignmentInput = z.infer<typeof postcodeAssignmentSchema>;

/**
 * Conflict check request schema
 * POST /api/admin/territories/check-conflicts
 */
export const checkConflictsSchema = z.object({
  agent_id: z.string().uuid('Invalid agent ID'),
  postcode_code: districtCodeSchema,
  sector_codes: z.array(sectorCodeSchema).optional().nullable(),
});

export type CheckConflictsInput = z.infer<typeof checkConflictsSchema>;

/**
 * Remove assignment request schema
 * DELETE /api/admin/territories/postcode
 */
export const removePostcodeAssignmentSchema = z.object({
  agent_id: z.string().uuid('Invalid agent ID'),
  postcode_code: districtCodeSchema,
  sector_code: sectorCodeSchema.optional().nullable(),
});

export type RemovePostcodeAssignmentInput = z.infer<typeof removePostcodeAssignmentSchema>;
