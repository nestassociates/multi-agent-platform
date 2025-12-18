'use client';

/**
 * Property Views Component
 * Shows most viewed properties
 */

import type { PropertyView } from '@/lib/ga4/types';

interface PropertyViewsProps {
  data: PropertyView[];
  loading?: boolean;
}

export function PropertyViews({ data, loading }: PropertyViewsProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-4 bg-gray-200 rounded w-40 mb-4 animate-pulse" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Viewed Properties</h3>
      <div className="space-y-4">
        {data.map((property, index) => (
          <div key={property.propertyId} className="flex items-center gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {property.propertyTitle}
              </p>
              <p className="text-xs text-gray-500">
                {property.uniqueViewers} unique viewers
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-lg font-semibold text-gray-900">{property.views}</p>
              <p className="text-xs text-gray-500">views</p>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-center text-gray-500 py-8">No property views tracked yet</p>
        )}
      </div>
    </div>
  );
}
