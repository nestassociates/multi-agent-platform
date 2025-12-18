/**
 * GA4 Analytics Client
 * Uses Google Analytics Data API when credentials are configured,
 * falls back to mock data for development/demo.
 */

import { BetaAnalyticsDataClient } from '@google-analytics/data';
import type {
  AnalyticsOverview,
  DailyMetric,
  TopPage,
  PropertyView,
  TrafficSource,
  DeviceBreakdown,
  LeadSource,
  DateRange,
  DateRangeConfig,
  AnalyticsData,
} from './types';
import { getDateRange } from './types';
import { generateMockAnalytics } from './mock-data';

/**
 * Check if GA4 credentials are configured
 */
export function isGA4Configured(): boolean {
  return !!(
    process.env.GA4_PROPERTY_ID &&
    process.env.GA4_SERVICE_ACCOUNT_EMAIL &&
    process.env.GA4_PRIVATE_KEY
  );
}

/**
 * Create GA4 Data API client with service account credentials
 */
function createGA4Client(): BetaAnalyticsDataClient | null {
  if (!isGA4Configured()) {
    return null;
  }

  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: process.env.GA4_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
  });
}

/**
 * Get property ID with proper formatting
 */
function getPropertyId(): string {
  const id = process.env.GA4_PROPERTY_ID || '';
  // GA4 API expects format: properties/123456789
  return id.startsWith('properties/') ? id : `properties/${id}`;
}

/**
 * Build hostname filter for the agent's subdomain
 * Filters all GA4 queries to only return data for this agent's site
 */
function buildHostnameFilter(hostname: string) {
  return {
    filter: {
      fieldName: 'hostName',
      stringFilter: {
        value: hostname,
        matchType: 'EXACT' as const,
      },
    },
  };
}

/**
 * Fetch overview metrics from GA4
 */
async function fetchOverview(
  client: BetaAnalyticsDataClient,
  hostname: string,
  dateRange: DateRangeConfig
): Promise<AnalyticsOverview> {
  const [response] = await client.runReport({
    property: getPropertyId(),
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'totalUsers' },
      { name: 'sessions' },
      { name: 'averageSessionDuration' },
      { name: 'bounceRate' },
      { name: 'newUsers' },
    ],
    dimensionFilter: buildHostnameFilter(hostname),
  });

  const row = response.rows?.[0];
  const values = row?.metricValues || [];

  const totalUsers = parseInt(values[1]?.value || '0', 10);
  const newUsers = parseInt(values[5]?.value || '0', 10);

  return {
    pageViews: parseInt(values[0]?.value || '0', 10),
    totalUsers,
    sessions: parseInt(values[2]?.value || '0', 10),
    avgSessionDuration: parseFloat(values[3]?.value || '0'),
    bounceRate: parseFloat(values[4]?.value || '0') * 100,
    newUsers,
    returningUsers: totalUsers - newUsers,
    period: {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    },
  };
}

/**
 * Fetch daily metrics from GA4
 */
async function fetchDailyMetrics(
  client: BetaAnalyticsDataClient,
  hostname: string,
  dateRange: DateRangeConfig
): Promise<DailyMetric[]> {
  const [response] = await client.runReport({
    property: getPropertyId(),
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [{ name: 'date' }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'sessions' },
      { name: 'totalUsers' },
    ],
    dimensionFilter: buildHostnameFilter(hostname),
    orderBys: [{ dimension: { dimensionName: 'date' } }],
  });

  return (response.rows || []).map((row) => ({
    date: row.dimensionValues?.[0]?.value || '',
    pageViews: parseInt(row.metricValues?.[0]?.value || '0', 10),
    sessions: parseInt(row.metricValues?.[1]?.value || '0', 10),
    users: parseInt(row.metricValues?.[2]?.value || '0', 10),
  }));
}

/**
 * Fetch top pages from GA4
 */
async function fetchTopPages(
  client: BetaAnalyticsDataClient,
  hostname: string,
  dateRange: DateRangeConfig
): Promise<TopPage[]> {
  const [response] = await client.runReport({
    property: getPropertyId(),
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [
      { name: 'pagePath' },
      { name: 'pageTitle' },
    ],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'averageSessionDuration' },
      { name: 'bounceRate' },
    ],
    dimensionFilter: buildHostnameFilter(hostname),
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 10,
  });

  return (response.rows || []).map((row) => ({
    pagePath: row.dimensionValues?.[0]?.value || '',
    pageTitle: row.dimensionValues?.[1]?.value || '',
    pageViews: parseInt(row.metricValues?.[0]?.value || '0', 10),
    avgTimeOnPage: parseFloat(row.metricValues?.[1]?.value || '0'),
    bounceRate: parseFloat(row.metricValues?.[2]?.value || '0') * 100,
  }));
}

/**
 * Fetch property views from GA4 custom events
 */
async function fetchPropertyViews(
  client: BetaAnalyticsDataClient,
  hostname: string,
  dateRange: DateRangeConfig
): Promise<PropertyView[]> {
  const [response] = await client.runReport({
    property: getPropertyId(),
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [
      { name: 'customEvent:property_id' },
      { name: 'customEvent:property_title' },
    ],
    metrics: [
      { name: 'eventCount' },
      { name: 'totalUsers' },
    ],
    dimensionFilter: {
      andGroup: {
        expressions: [
          buildHostnameFilter(hostname),
          {
            filter: {
              fieldName: 'eventName',
              stringFilter: {
                value: 'view_property',
                matchType: 'EXACT' as const,
              },
            },
          },
        ],
      },
    },
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 10,
  });

  return (response.rows || []).map((row) => ({
    propertyId: row.dimensionValues?.[0]?.value || '',
    propertyTitle: row.dimensionValues?.[1]?.value || 'Unknown Property',
    views: parseInt(row.metricValues?.[0]?.value || '0', 10),
    uniqueViewers: parseInt(row.metricValues?.[1]?.value || '0', 10),
  }));
}

/**
 * Fetch traffic sources from GA4
 */
async function fetchTrafficSources(
  client: BetaAnalyticsDataClient,
  hostname: string,
  dateRange: DateRangeConfig
): Promise<TrafficSource[]> {
  const [response] = await client.runReport({
    property: getPropertyId(),
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [
      { name: 'sessionSource' },
      { name: 'sessionMedium' },
    ],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
    ],
    dimensionFilter: buildHostnameFilter(hostname),
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 10,
  });

  const sources = (response.rows || []).map((row) => ({
    source: row.dimensionValues?.[0]?.value || '(direct)',
    medium: row.dimensionValues?.[1]?.value || '(none)',
    sessions: parseInt(row.metricValues?.[0]?.value || '0', 10),
    users: parseInt(row.metricValues?.[1]?.value || '0', 10),
    percentage: 0,
  }));

  // Calculate percentages
  const totalSessions = sources.reduce((sum, s) => sum + s.sessions, 0);
  sources.forEach((s) => {
    s.percentage = totalSessions > 0 ? Math.round((s.sessions / totalSessions) * 100) : 0;
  });

  return sources;
}

/**
 * Fetch device breakdown from GA4
 */
async function fetchDeviceBreakdown(
  client: BetaAnalyticsDataClient,
  hostname: string,
  dateRange: DateRangeConfig
): Promise<DeviceBreakdown[]> {
  const [response] = await client.runReport({
    property: getPropertyId(),
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [{ name: 'deviceCategory' }],
    metrics: [{ name: 'sessions' }],
    dimensionFilter: buildHostnameFilter(hostname),
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
  });

  const devices = (response.rows || []).map((row) => ({
    deviceCategory: row.dimensionValues?.[0]?.value as 'desktop' | 'mobile' | 'tablet',
    sessions: parseInt(row.metricValues?.[0]?.value || '0', 10),
    percentage: 0,
  }));

  // Calculate percentages
  const totalSessions = devices.reduce((sum, d) => sum + d.sessions, 0);
  devices.forEach((d) => {
    d.percentage = totalSessions > 0 ? Math.round((d.sessions / totalSessions) * 100) : 0;
  });

  return devices;
}

/**
 * Fetch lead sources from GA4 custom events
 */
async function fetchLeadSources(
  client: BetaAnalyticsDataClient,
  hostname: string,
  dateRange: DateRangeConfig
): Promise<LeadSource[]> {
  const [response] = await client.runReport({
    property: getPropertyId(),
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [{ name: 'customEvent:lead_source' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      andGroup: {
        expressions: [
          buildHostnameFilter(hostname),
          {
            filter: {
              fieldName: 'eventName',
              stringFilter: {
                value: 'generate_lead',
                matchType: 'EXACT' as const,
              },
            },
          },
        ],
      },
    },
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
  });

  const sources = (response.rows || []).map((row) => ({
    source: row.dimensionValues?.[0]?.value as LeadSource['source'],
    count: parseInt(row.metricValues?.[0]?.value || '0', 10),
    percentage: 0,
  }));

  // Calculate percentages
  const total = sources.reduce((sum, s) => sum + s.count, 0);
  sources.forEach((s) => {
    s.percentage = total > 0 ? Math.round((s.count / total) * 100) : 0;
  });

  return sources;
}

/**
 * Get full analytics data for an agent's site
 *
 * @param subdomain - Agent's subdomain (e.g., 'george-bailey')
 * @param range - Date range ('7d', '30d', '90d')
 * @returns Full analytics data or mock data if GA4 not configured
 */
export async function getAgentAnalytics(
  subdomain: string,
  range: DateRange = '30d'
): Promise<AnalyticsData> {
  const hostname = `${subdomain}.agents.nestassociates.com`;
  const dateRange = getDateRange(range);

  // Return mock data if GA4 not configured
  if (!isGA4Configured()) {
    console.log('[GA4] Not configured, returning mock data for', hostname);
    return generateMockAnalytics(hostname, dateRange);
  }

  const client = createGA4Client();
  if (!client) {
    console.error('[GA4] Failed to create client');
    return generateMockAnalytics(hostname, dateRange);
  }

  try {
    // Fetch all data in parallel
    const [
      overview,
      dailyMetrics,
      topPages,
      propertyViews,
      trafficSources,
      deviceBreakdown,
      leadSources,
    ] = await Promise.all([
      fetchOverview(client, hostname, dateRange),
      fetchDailyMetrics(client, hostname, dateRange),
      fetchTopPages(client, hostname, dateRange),
      fetchPropertyViews(client, hostname, dateRange),
      fetchTrafficSources(client, hostname, dateRange),
      fetchDeviceBreakdown(client, hostname, dateRange),
      fetchLeadSources(client, hostname, dateRange),
    ]);

    return {
      overview,
      dailyMetrics,
      topPages,
      propertyViews,
      trafficSources,
      deviceBreakdown,
      leadSources,
      hostname,
      dateRange,
    };
  } catch (error) {
    console.error('[GA4] Error fetching analytics:', error);
    // Fall back to mock data on error
    return generateMockAnalytics(hostname, dateRange);
  }
}

/**
 * Get analytics overview only (lighter query)
 */
export async function getAgentAnalyticsOverview(
  subdomain: string,
  range: DateRange = '30d'
): Promise<AnalyticsOverview & { hostname: string; dateRange: DateRangeConfig }> {
  const hostname = `${subdomain}.agents.nestassociates.com`;
  const dateRange = getDateRange(range);

  if (!isGA4Configured()) {
    const mock = generateMockAnalytics(hostname, dateRange);
    return { ...mock.overview, hostname, dateRange };
  }

  const client = createGA4Client();
  if (!client) {
    const mock = generateMockAnalytics(hostname, dateRange);
    return { ...mock.overview, hostname, dateRange };
  }

  try {
    const overview = await fetchOverview(client, hostname, dateRange);
    return { ...overview, hostname, dateRange };
  } catch (error) {
    console.error('[GA4] Error fetching overview:', error);
    const mock = generateMockAnalytics(hostname, dateRange);
    return { ...mock.overview, hostname, dateRange };
  }
}
