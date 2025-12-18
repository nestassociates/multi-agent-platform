/**
 * GA4 Mock Data
 * Realistic sample data for development and demo purposes
 * Used when GA4_PROPERTY_ID is not configured
 */

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
  getDateRange,
} from './types';

/**
 * Generate random number within range
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate daily metrics for the given date range
 */
export function generateDailyMetrics(dateRange: DateRangeConfig): DailyMetric[] {
  const metrics: DailyMetric[] = [];
  const startDate = new Date(dateRange.startDate);
  const endDate = new Date(dateRange.endDate);

  // Base values with some variance
  const baseViews = randomInt(40, 80);
  const baseSessions = randomInt(20, 40);
  const baseUsers = randomInt(15, 30);

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    // Add weekend dip and random variance
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekendMultiplier = isWeekend ? 0.6 : 1;
    const variance = 0.7 + Math.random() * 0.6; // 0.7 to 1.3

    metrics.push({
      date: date.toISOString().split('T')[0],
      pageViews: Math.round(baseViews * weekendMultiplier * variance),
      sessions: Math.round(baseSessions * weekendMultiplier * variance),
      users: Math.round(baseUsers * weekendMultiplier * variance),
    });
  }

  return metrics;
}

/**
 * Generate overview metrics
 */
export function generateOverview(dailyMetrics: DailyMetric[], dateRange: DateRangeConfig): AnalyticsOverview {
  const pageViews = dailyMetrics.reduce((sum, d) => sum + d.pageViews, 0);
  const sessions = dailyMetrics.reduce((sum, d) => sum + d.sessions, 0);
  const totalUsers = dailyMetrics.reduce((sum, d) => sum + d.users, 0);

  return {
    pageViews,
    totalUsers,
    sessions,
    avgSessionDuration: randomInt(90, 180), // 1.5-3 minutes
    bounceRate: randomInt(35, 55),
    newUsers: Math.round(totalUsers * (randomInt(60, 80) / 100)),
    returningUsers: Math.round(totalUsers * (randomInt(20, 40) / 100)),
    period: {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    },
  };
}

/**
 * Generate top pages data
 */
export function generateTopPages(): TopPage[] {
  const pages: TopPage[] = [
    {
      pagePath: '/',
      pageTitle: 'Home',
      pageViews: randomInt(300, 600),
      avgTimeOnPage: randomInt(60, 120),
      bounceRate: randomInt(25, 40),
    },
    {
      pagePath: '/properties',
      pageTitle: 'Properties',
      pageViews: randomInt(200, 400),
      avgTimeOnPage: randomInt(120, 240),
      bounceRate: randomInt(20, 35),
    },
    {
      pagePath: '/contact',
      pageTitle: 'Contact',
      pageViews: randomInt(100, 200),
      avgTimeOnPage: randomInt(90, 180),
      bounceRate: randomInt(30, 50),
    },
    {
      pagePath: '/about',
      pageTitle: 'About',
      pageViews: randomInt(80, 150),
      avgTimeOnPage: randomInt(60, 120),
      bounceRate: randomInt(35, 55),
    },
    {
      pagePath: '/services',
      pageTitle: 'Services',
      pageViews: randomInt(60, 120),
      avgTimeOnPage: randomInt(45, 90),
      bounceRate: randomInt(40, 60),
    },
    {
      pagePath: '/areas',
      pageTitle: 'Areas We Cover',
      pageViews: randomInt(50, 100),
      avgTimeOnPage: randomInt(60, 120),
      bounceRate: randomInt(35, 55),
    },
    {
      pagePath: '/reviews',
      pageTitle: 'Reviews',
      pageViews: randomInt(40, 80),
      avgTimeOnPage: randomInt(90, 150),
      bounceRate: randomInt(30, 50),
    },
  ];

  return pages.sort((a, b) => b.pageViews - a.pageViews);
}

/**
 * Generate property views data
 */
export function generatePropertyViews(): PropertyView[] {
  const properties: PropertyView[] = [
    {
      propertyId: 'prop-001',
      propertyTitle: '3 Bed Semi-Detached, Oak Avenue',
      views: randomInt(40, 80),
      uniqueViewers: randomInt(30, 60),
    },
    {
      propertyId: 'prop-002',
      propertyTitle: '4 Bed Detached, Maple Close',
      views: randomInt(35, 70),
      uniqueViewers: randomInt(25, 50),
    },
    {
      propertyId: 'prop-003',
      propertyTitle: '2 Bed Flat, High Street',
      views: randomInt(30, 60),
      uniqueViewers: randomInt(20, 45),
    },
    {
      propertyId: 'prop-004',
      propertyTitle: '3 Bed Terraced, Church Lane',
      views: randomInt(25, 50),
      uniqueViewers: randomInt(18, 40),
    },
    {
      propertyId: 'prop-005',
      propertyTitle: '5 Bed Executive Home, Manor Road',
      views: randomInt(20, 45),
      uniqueViewers: randomInt(15, 35),
    },
  ];

  return properties.sort((a, b) => b.views - a.views);
}

/**
 * Generate traffic sources data
 */
export function generateTrafficSources(): TrafficSource[] {
  const sources: TrafficSource[] = [
    {
      source: 'google',
      medium: 'organic',
      sessions: randomInt(150, 300),
      users: randomInt(120, 250),
      percentage: 0, // calculated below
    },
    {
      source: '(direct)',
      medium: '(none)',
      sessions: randomInt(80, 150),
      users: randomInt(60, 120),
      percentage: 0,
    },
    {
      source: 'rightmove.co.uk',
      medium: 'referral',
      sessions: randomInt(50, 100),
      users: randomInt(40, 80),
      percentage: 0,
    },
    {
      source: 'zoopla.co.uk',
      medium: 'referral',
      sessions: randomInt(30, 70),
      users: randomInt(25, 55),
      percentage: 0,
    },
    {
      source: 'facebook',
      medium: 'social',
      sessions: randomInt(20, 50),
      users: randomInt(15, 40),
      percentage: 0,
    },
  ];

  // Calculate percentages
  const totalSessions = sources.reduce((sum, s) => sum + s.sessions, 0);
  sources.forEach((s) => {
    s.percentage = Math.round((s.sessions / totalSessions) * 100);
  });

  return sources.sort((a, b) => b.sessions - a.sessions);
}

/**
 * Generate device breakdown data
 */
export function generateDeviceBreakdown(): DeviceBreakdown[] {
  const desktopSessions = randomInt(200, 400);
  const mobileSessions = randomInt(150, 300);
  const tabletSessions = randomInt(30, 80);
  const totalSessions = desktopSessions + mobileSessions + tabletSessions;

  const devices: DeviceBreakdown[] = [
    {
      deviceCategory: 'desktop',
      sessions: desktopSessions,
      percentage: Math.round((desktopSessions / totalSessions) * 100),
    },
    {
      deviceCategory: 'mobile',
      sessions: mobileSessions,
      percentage: Math.round((mobileSessions / totalSessions) * 100),
    },
    {
      deviceCategory: 'tablet',
      sessions: tabletSessions,
      percentage: Math.round((tabletSessions / totalSessions) * 100),
    },
  ];
  return devices.sort((a, b) => b.sessions - a.sessions);
}

/**
 * Generate lead sources data
 */
export function generateLeadSources(): LeadSource[] {
  const contactFormCount = randomInt(8, 20);
  const viewingRequestCount = randomInt(5, 15);
  const phoneClickCount = randomInt(10, 30);
  const emailClickCount = randomInt(5, 15);
  const total = contactFormCount + viewingRequestCount + phoneClickCount + emailClickCount;

  const leads: LeadSource[] = [
    {
      source: 'contact_form',
      count: contactFormCount,
      percentage: Math.round((contactFormCount / total) * 100),
    },
    {
      source: 'viewing_request',
      count: viewingRequestCount,
      percentage: Math.round((viewingRequestCount / total) * 100),
    },
    {
      source: 'phone_click',
      count: phoneClickCount,
      percentage: Math.round((phoneClickCount / total) * 100),
    },
    {
      source: 'email_click',
      count: emailClickCount,
      percentage: Math.round((emailClickCount / total) * 100),
    },
  ];
  return leads.sort((a, b) => b.count - a.count);
}

/**
 * Generate full mock analytics data for a given hostname and date range
 */
export function generateMockAnalytics(
  hostname: string,
  dateRange: DateRangeConfig
): {
  overview: AnalyticsOverview;
  dailyMetrics: DailyMetric[];
  topPages: TopPage[];
  propertyViews: PropertyView[];
  trafficSources: TrafficSource[];
  deviceBreakdown: DeviceBreakdown[];
  leadSources: LeadSource[];
  hostname: string;
  dateRange: DateRangeConfig;
} {
  const dailyMetrics = generateDailyMetrics(dateRange);

  return {
    overview: generateOverview(dailyMetrics, dateRange),
    dailyMetrics,
    topPages: generateTopPages(),
    propertyViews: generatePropertyViews(),
    trafficSources: generateTrafficSources(),
    deviceBreakdown: generateDeviceBreakdown(),
    leadSources: generateLeadSources(),
    hostname,
    dateRange,
  };
}
