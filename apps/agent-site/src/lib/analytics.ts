/**
 * GA4 Analytics Event Tracking Utilities
 *
 * Custom events for tracking agent microsite interactions.
 * Events are filtered by hostname in the dashboard to isolate agent data.
 */

// Extend window to include gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Check if analytics is available
 */
export function isAnalyticsEnabled(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  parameters?: Record<string, string | number | boolean>
): void {
  if (!isAnalyticsEnabled()) {
    if (import.meta.env.DEV) {
      console.log('[Analytics Mock]', eventName, parameters);
    }
    return;
  }

  window.gtag!('event', eventName, parameters);
}

/**
 * Property View Event
 * Fired when a user views a property detail page
 */
export interface PropertyViewParams {
  property_id: string;
  property_title: string;
  price?: number;
  bedrooms?: number;
  property_type?: string;
  status?: string; // for_sale, for_rent, sold, let
}

export function trackPropertyView(params: PropertyViewParams): void {
  trackEvent('view_property', {
    property_id: params.property_id,
    property_title: params.property_title,
    ...(params.price && { value: params.price, currency: 'GBP' }),
    ...(params.bedrooms && { bedrooms: params.bedrooms }),
    ...(params.property_type && { property_type: params.property_type }),
    ...(params.status && { status: params.status }),
  });
}

/**
 * Lead Generation Event
 * Fired when a user submits a contact form or viewing request
 */
export type LeadSource = 'contact_form' | 'viewing_request' | 'valuation_request' | 'phone_click' | 'email_click';

export interface LeadParams {
  lead_source: LeadSource;
  property_id?: string;
  property_title?: string;
}

export function trackLead(params: LeadParams): void {
  trackEvent('generate_lead', {
    lead_source: params.lead_source,
    ...(params.property_id && { property_id: params.property_id }),
    ...(params.property_title && { property_title: params.property_title }),
  });
}

/**
 * Track contact form submission
 */
export function trackContactFormSubmit(propertyId?: string, propertyTitle?: string): void {
  trackLead({
    lead_source: 'contact_form',
    property_id: propertyId,
    property_title: propertyTitle,
  });
}

/**
 * Track viewing request submission
 */
export function trackViewingRequest(propertyId: string, propertyTitle: string): void {
  trackLead({
    lead_source: 'viewing_request',
    property_id: propertyId,
    property_title: propertyTitle,
  });
}

/**
 * Track phone click (tel: link)
 */
export function trackPhoneClick(context?: string): void {
  trackEvent('phone_click', {
    lead_source: 'phone_click',
    ...(context && { context }),
  });
}

/**
 * Track email click (mailto: link)
 */
export function trackEmailClick(context?: string): void {
  trackEvent('email_click', {
    lead_source: 'email_click',
    ...(context && { context }),
  });
}

/**
 * Track area page view
 */
export function trackAreaView(areaSlug: string, areaName: string): void {
  trackEvent('view_area', {
    area_slug: areaSlug,
    area_name: areaName,
  });
}

/**
 * Track blog post view
 */
export function trackBlogView(postSlug: string, postTitle: string): void {
  trackEvent('view_blog_post', {
    post_slug: postSlug,
    post_title: postTitle,
  });
}

/**
 * Track property search/filter
 */
export interface SearchParams {
  search_term?: string;
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  property_type?: string;
  results_count: number;
}

export function trackPropertySearch(params: SearchParams): void {
  trackEvent('search_properties', {
    ...params,
    results_count: params.results_count,
  });
}

/**
 * Track outbound link click
 */
export function trackOutboundLink(url: string, linkText?: string): void {
  trackEvent('click', {
    event_category: 'outbound',
    event_label: linkText || url,
    link_url: url,
  });
}
