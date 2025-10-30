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
