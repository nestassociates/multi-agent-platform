'use client';

/**
 * Device Breakdown Component
 * Shows device category distribution
 */

import type { DeviceBreakdown } from '@/lib/ga4/types';

interface DeviceBreakdownProps {
  data: DeviceBreakdown[];
  loading?: boolean;
}

const deviceIcons: Record<string, React.ReactNode> = {
  desktop: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  mobile: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  tablet: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
};

const deviceColors: Record<string, string> = {
  desktop: 'bg-blue-100 text-blue-600',
  mobile: 'bg-green-100 text-green-600',
  tablet: 'bg-purple-100 text-purple-600',
};

const barColors: Record<string, string> = {
  desktop: 'bg-blue-500',
  mobile: 'bg-green-500',
  tablet: 'bg-purple-500',
};

export function DeviceBreakdownChart({ data, loading }: DeviceBreakdownProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-4 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const totalSessions = data.reduce((sum, d) => sum + d.sessions, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Devices</h3>
      <div className="space-y-4">
        {data.map((device) => (
          <div key={device.deviceCategory} className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${deviceColors[device.deviceCategory] || 'bg-gray-100 text-gray-600'}`}>
              {deviceIcons[device.deviceCategory] || deviceIcons.desktop}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {device.deviceCategory}
                </span>
                <span className="text-sm text-gray-500">
                  {device.sessions.toLocaleString()} ({device.percentage}%)
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColors[device.deviceCategory] || 'bg-gray-500'} transition-all duration-500`}
                  style={{ width: `${device.percentage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-center text-gray-500 py-4">No device data available</p>
        )}
      </div>
    </div>
  );
}
