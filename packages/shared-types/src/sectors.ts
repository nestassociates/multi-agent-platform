/**
 * Postcode Sector Types
 * Feature: 008-postcode-sector-territories
 *
 * Types for postcode sector-level territory assignments.
 * Sectors are subdivisions of districts (e.g., TA1 1, TA1 2 within district TA1).
 */

import type { GeoJSON } from './entities';

// ============================================
// Database Entities
// ============================================

/**
 * Postcode sector - subdivision of a postcode district
 * Maps to: postcode_sectors table
 */
export interface PostcodeSector {
  code: string;              // e.g., "TA1 1", "BS10 5"
  district_code: string;     // e.g., "TA1", "BS10"
  boundary: GeoJSON.Polygon | null;
  center_point: GeoJSON.Point | null;
  area_km2: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Agent postcode assignment
 * Maps to: agent_postcodes table
 */
export interface AgentPostcode {
  agent_id: string;          // UUID
  postcode_code: string;     // District code
  sector_code: string | null; // Sector code (null = full district)
  assigned_at: string;
}

/**
 * Sector property count cache
 * Maps to: sector_property_counts table
 */
export interface SectorPropertyCount {
  sector_code: string;
  residential_count: number;
  commercial_count: number;
  mixed_count: number;
  total_count: number;
  cached_at: string;
}

// ============================================
// API Request/Response Types
// ============================================

/**
 * GET /api/admin/sectors/list response
 */
export interface SectorsListResponse {
  sectors: SectorWithAssignment[];
  district: string;
}

/**
 * Sector with optional agent assignment info
 */
export interface SectorWithAssignment extends PostcodeSector {
  assigned_agent: {
    id: string;
    subdomain: string;
  } | null;
}

/**
 * GET /api/admin/sectors/{code}/count response
 */
export interface SectorCountResponse {
  count: number;
  cached: boolean;
  sector: string;
}

/**
 * POST /api/admin/territories request (extended for sectors)
 */
export interface TerritoryAssignmentRequest {
  agent_id: string;
  postcode_code: string;
  sector_codes?: string[] | null;  // specific sectors (null = full district)
}

/**
 * POST /api/admin/territories response
 */
export interface TerritoryAssignmentResponse {
  success: boolean;
  assignments: AssignmentResult[];
}

export interface AssignmentResult {
  postcode_code: string;
  sector_code: string | null;
  assigned_at: string;
}

/**
 * POST /api/admin/territories/check-conflicts response
 */
export interface ConflictCheckResponse {
  hasConflicts: boolean;
  conflicts: TerritoryConflict[];
}

export interface TerritoryConflict {
  type: 'district_assigned' | 'sector_assigned';
  code: string;
  agent: {
    id: string;
    subdomain: string;
  };
}

// ============================================
// UI State Types
// ============================================

/**
 * Current view mode in territory map
 */
export type MapViewMode = 'districts' | 'sectors';

/**
 * Selection state for the territory map
 */
export interface TerritorySelectionState {
  mode: MapViewMode;
  expandedDistrict: string | null;  // Which district is drilled into
  selectedDistricts: string[];       // Selected at district level
  selectedSectors: string[];         // Selected at sector level
}

/**
 * District with assignment summary
 */
export interface DistrictWithSummary {
  code: string;
  area_km2: number | null;
  boundary: GeoJSON.Polygon | null;
  assignment_status: 'unassigned' | 'full' | 'partial';
  assigned_agent: {
    id: string;
    subdomain: string;
  } | null;
  sector_count: number;
  assigned_sector_count: number;
}

// ============================================
// Validation Types & Utilities
// ============================================

/**
 * Sector code validation regex
 * Format: {AREA}{DISTRICT} {SECTOR_DIGIT}
 * Examples: "TA1 1", "BS10 5", "M1 7"
 */
export const SECTOR_CODE_REGEX = /^[A-Z]{1,2}\d{1,2}\s\d$/;

/**
 * District code validation regex
 * Format: {AREA}{DISTRICT}
 * Examples: "TA1", "BS10", "M1"
 */
export const DISTRICT_CODE_REGEX = /^[A-Z]{1,2}\d{1,2}$/;

/**
 * Validate a sector code format
 */
export function isValidSectorCode(code: string): boolean {
  return SECTOR_CODE_REGEX.test(code);
}

/**
 * Validate a district code format
 */
export function isValidDistrictCode(code: string): boolean {
  return DISTRICT_CODE_REGEX.test(code);
}

/**
 * Extract district code from sector code
 * "TA1 1" -> "TA1"
 */
export function getDistrictFromSector(sectorCode: string): string {
  return sectorCode.split(' ')[0];
}
