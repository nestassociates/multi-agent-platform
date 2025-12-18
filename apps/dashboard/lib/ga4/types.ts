/**
 * GA4 Analytics Types
 * Type definitions for GA4 Data API responses and dashboard components
 */

/**
 * Overview metrics for the analytics dashboard
 */
export interface AnalyticsOverview {
  pageViews: number;
  totalUsers: number;
  sessions: number;
  avgSessionDuration: number; // in seconds
  bounceRate: number; // 0-100 percentage
  newUsers: number;
  returningUsers: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Daily metrics for line charts
 */
export interface DailyMetric {
  date: string; // YYYY-MM-DD
  pageViews: number;
  sessions: number;
  users: number;
}

/**
 * Top pages table data
 */
export interface TopPage {
  pagePath: string;
  pageTitle: string;
  pageViews: number;
  avgTimeOnPage: number; // seconds
  bounceRate: number;
}

/**
 * Property view tracking data
 */
export interface PropertyView {
  propertyId: string;
  propertyTitle: string;
  views: number;
  uniqueViewers: number;
}

/**
 * Traffic source breakdown
 */
export interface TrafficSource {
  source: string;
  medium: string;
  sessions: number;
  users: number;
  percentage: number;
}

/**
 * Device category breakdown
 */
export interface DeviceBreakdown {
  deviceCategory: 'desktop' | 'mobile' | 'tablet';
  sessions: number;
  percentage: number;
}

/**
 * Lead source breakdown (custom events)
 */
export interface LeadSource {
  source: 'contact_form' | 'viewing_request' | 'phone_click' | 'email_click';
  count: number;
  percentage: number;
}

/**
 * Date range options for analytics queries
 */
export type DateRange = '7d' | '30d' | '90d';

/**
 * Date range configuration
 */
export interface DateRangeConfig {
  startDate: string;
  endDate: string;
  label: string;
}

/**
 * Get date range configuration from a DateRange string
 */
export function getDateRange(range: DateRange): DateRangeConfig {
  const endDate = new Date();
  const startDate = new Date();

  let label: string;
  switch (range) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      label = 'Last 7 days';
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      label = 'Last 30 days';
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      label = 'Last 90 days';
      break;
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    label,
  };
}

/**
 * Full analytics response for dashboard
 */
export interface AnalyticsData {
  overview: AnalyticsOverview;
  dailyMetrics: DailyMetric[];
  topPages: TopPage[];
  propertyViews: PropertyView[];
  trafficSources: TrafficSource[];
  deviceBreakdown: DeviceBreakdown[];
  leadSources: LeadSource[];
  hostname: string;
  dateRange: DateRangeConfig;
}
