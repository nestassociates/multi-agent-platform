'use client';

/**
 * Top Pages Table
 * Shows most viewed pages with metrics
 */

import type { TopPage } from '@/lib/ga4/types';

interface TopPagesProps {
  data: TopPage[];
  loading?: boolean;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export function TopPages({ data, loading }: TopPagesProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-4 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
              <th className="pb-3 font-medium">Page</th>
              <th className="pb-3 font-medium text-right">Views</th>
              <th className="pb-3 font-medium text-right hidden sm:table-cell">Avg. Time</th>
              <th className="pb-3 font-medium text-right hidden md:table-cell">Bounce Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((page, index) => (
              <tr key={index} className="text-sm">
                <td className="py-3">
                  <div>
                    <p className="font-medium text-gray-900 truncate max-w-[200px]">
                      {page.pageTitle || page.pagePath}
                    </p>
                    <p className="text-gray-500 text-xs truncate max-w-[200px]">
                      {page.pagePath}
                    </p>
                  </div>
                </td>
                <td className="py-3 text-right text-gray-900 font-medium">
                  {page.pageViews.toLocaleString()}
                </td>
                <td className="py-3 text-right text-gray-500 hidden sm:table-cell">
                  {formatDuration(page.avgTimeOnPage)}
                </td>
                <td className="py-3 text-right text-gray-500 hidden md:table-cell">
                  {page.bounceRate.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <p className="text-center text-gray-500 py-8">No page data available</p>
        )}
      </div>
    </div>
  );
}
