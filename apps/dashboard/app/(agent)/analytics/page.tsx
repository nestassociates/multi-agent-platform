'use client';

/**
 * Agent Analytics Page
 * Full analytics dashboard for agents
 */

import { useState, useEffect, useCallback } from 'react';
import { DateRangeSelector } from '@/components/shared/date-range-selector';
import { AnalyticsOverviewCards } from '@/components/agent/analytics-overview';
import { TrafficChart } from '@/components/agent/traffic-chart';
import { TopPages } from '@/components/agent/top-pages';
import { PropertyViews } from '@/components/agent/property-views';
import { TrafficSources } from '@/components/agent/traffic-sources';
import { DeviceBreakdownChart } from '@/components/agent/device-breakdown';
import { LeadSources } from '@/components/agent/lead-sources';
import type { DateRange, AnalyticsData } from '@/lib/ga4/types';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/agent/analytics?range=${dateRange}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to fetch analytics');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Analytics</h1>
          <p className="text-gray-500 mt-1">
            Track your website&apos;s performance and visitor engagement
          </p>
        </div>
        <DateRangeSelector
          value={dateRange}
          onChange={handleDateRangeChange}
          disabled={loading}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Error loading analytics</span>
          </div>
          <p className="mt-1 text-sm text-red-700">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Try again
          </button>
        </div>
      )}

      {/* Mock Data Notice */}
      {data && !error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Demo Data</span>
          </div>
          <p className="mt-1 text-sm text-blue-700">
            This shows sample analytics data. Connect Google Analytics 4 to see real visitor metrics.
          </p>
        </div>
      )}

      {/* Overview Cards */}
      <AnalyticsOverviewCards
        data={data?.overview || {
          pageViews: 0,
          totalUsers: 0,
          sessions: 0,
          avgSessionDuration: 0,
          bounceRate: 0,
          newUsers: 0,
          returningUsers: 0,
          period: { startDate: '', endDate: '' },
        }}
        loading={loading}
      />

      {/* Traffic Chart */}
      <TrafficChart data={data?.dailyMetrics || []} loading={loading} />

      {/* Grid Layout for Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopPages data={data?.topPages || []} loading={loading} />
        <PropertyViews data={data?.propertyViews || []} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TrafficSources data={data?.trafficSources || []} loading={loading} />
        <DeviceBreakdownChart data={data?.deviceBreakdown || []} loading={loading} />
        <LeadSources data={data?.leadSources || []} loading={loading} />
      </div>

      {/* Footer Info */}
      {data && (
        <div className="text-center text-sm text-gray-500 pt-4 border-t">
          Data for {data.hostname} &middot; {data.dateRange.label}
        </div>
      )}
    </div>
  );
}
