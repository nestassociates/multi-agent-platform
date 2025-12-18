'use client';

/**
 * Lead Sources Component
 * Shows breakdown of lead generation channels
 */

import type { LeadSource } from '@/lib/ga4/types';

interface LeadSourcesProps {
  data: LeadSource[];
  loading?: boolean;
}

const sourceConfig: Record<LeadSource['source'], { label: string; icon: React.ReactNode; color: string }> = {
  contact_form: {
    label: 'Contact Form',
    color: 'bg-blue-500',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  viewing_request: {
    label: 'Viewing Request',
    color: 'bg-green-500',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  phone_click: {
    label: 'Phone Click',
    color: 'bg-purple-500',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
  email_click: {
    label: 'Email Click',
    color: 'bg-amber-500',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
      </svg>
    ),
  },
};

export function LeadSources({ data, loading }: LeadSourcesProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-4 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const totalLeads = data.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Lead Sources</h3>
        <span className="text-2xl font-bold text-blue-600">{totalLeads}</span>
      </div>
      <p className="text-sm text-gray-500 mb-4">Total leads generated</p>
      <div className="space-y-3">
        {data.map((lead) => {
          const config = sourceConfig[lead.source];
          return (
            <div key={lead.source} className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.color.replace('bg-', 'bg-opacity-10 text-').replace('-500', '-600')}`}>
                {config.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{config.label}</span>
                  <span className="text-sm text-gray-500">{lead.count}</span>
                </div>
                <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${config.color} transition-all duration-500`}
                    style={{ width: `${lead.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <p className="text-center text-gray-500 py-4">No leads tracked yet</p>
        )}
      </div>
    </div>
  );
}
