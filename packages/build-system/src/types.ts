/**
 * Build System Types
 * Type definitions for site generation and build configuration
 */

/**
 * Section visibility flags for agent microsites
 * Determines which sections/pages should be generated based on content availability
 */
export interface SectionVisibility {
  /** Show blog section (true if agent has approved blog posts) */
  blog: boolean;
  /** Show area guides section (true if agent has approved area guides) */
  areaGuides: boolean;
  /** Show reviews section (true if agent has google_place_id configured) */
  reviews: boolean;
  /** Show fees section (true if agent has fee structure content) */
  fees: boolean;
  /** Show properties section (always true - fetched client-side) */
  properties: boolean;
}

/**
 * Navigation item for agent site navigation
 * Used to generate conditional navigation based on available content
 */
export interface NavItem {
  /** Display label for the navigation link */
  label: string;
  /** URL path for the navigation link */
  href: string;
  /** Whether to show in primary navigation */
  primary?: boolean;
  /** Whether to show in footer navigation */
  footer?: boolean;
}

/**
 * Build priority levels
 * Lower number = higher priority
 */
export enum BuildPriority {
  /** Emergency: Global content changes affecting all agents */
  Emergency = 1,
  /** High: Critical content updates */
  High = 2,
  /** Normal: Content approval, standard updates */
  Normal = 3,
  /** Low: Profile updates, minor changes */
  Low = 4,
}

/**
 * Build trigger reasons for audit trail
 */
export type BuildTriggerReason =
  | 'content_approved'
  | 'profile_updated'
  | 'fees_updated'
  | 'global_content_published'
  | 'agent_activated'
  | 'manual_trigger';
