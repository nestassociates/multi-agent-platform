'use client';

/**
 * Date Range Selector
 * Simple 7/30/90 day selector for analytics queries
 */

import type { DateRange } from '@/lib/ga4/types';

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  disabled?: boolean;
}

const ranges: { value: DateRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

export function DateRangeSelector({ value, onChange, disabled }: DateRangeSelectorProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          disabled={disabled}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            value === range.value
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
