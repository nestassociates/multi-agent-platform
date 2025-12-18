'use client';

/**
 * Traffic Sources Component
 * Shows where visitors are coming from
 */

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { TrafficSource } from '@/lib/ga4/types';

interface TrafficSourcesProps {
  data: TrafficSource[];
  loading?: boolean;
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function formatSourceName(source: string, medium: string): string {
  if (source === '(direct)' || source === '(none)') {
    return 'Direct';
  }
  if (medium === 'organic') {
    return `${source} (Organic)`;
  }
  if (medium === 'referral') {
    return source.replace(/\.(com|co\.uk|org)$/, '');
  }
  if (medium === 'social') {
    return `${source} (Social)`;
  }
  return source;
}

export function TrafficSources({ data, loading }: TrafficSourcesProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-4 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  const chartData = data.slice(0, 6).map((source) => ({
    name: formatSourceName(source.source, source.medium),
    value: source.sessions,
    percentage: source.percentage,
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value} sessions`,
                name,
              ]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              iconType="circle"
              wrapperStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {data.length === 0 && (
        <p className="text-center text-gray-500 py-8">No traffic source data available</p>
      )}
    </div>
  );
}
