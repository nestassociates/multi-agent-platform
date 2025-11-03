/**
 * Admin Properties Page
 * Displays all properties across all agents with sync controls
 */

import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminPropertiesPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const supabase = createServiceRoleClient();

  // Get all properties with agent info
  const { data: properties } = await supabase
    .from('properties')
    .select(`
      *,
      agent:agents!properties_agent_id_fkey(
        id,
        subdomain,
        apex27_branch_id,
        profile:profiles!agents_user_id_fkey(first_name, last_name)
      )
    `)
    .order('updated_at', { ascending: false })
    .limit(100); // Show latest 100

  const propertyCount = properties?.length || 0;

  // Get sync stats
  const { count: totalCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Properties</h1>
          <p className="mt-2 text-gray-600">
            {totalCount || 0} total properties synced from Apex27
          </p>
        </div>

        <div className="flex gap-3">
          <form action="/api/cron/sync-properties" method="GET">
            <button
              type="submit"
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Trigger Manual Sync
            </button>
          </form>
        </div>
      </div>

      {propertyCount === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-gray-600">
            No properties synced yet. Click "Trigger Manual Sync" to import properties from Apex27.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Apex27 ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {properties?.map((property: any) => (
                <tr key={property.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {property.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {property.postcode}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {property.agent?.profile?.first_name} {property.agent?.profile?.last_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      Branch: {property.agent?.apex27_branch_id || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      £{property.price.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {property.transaction_type}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {property.bedrooms > 0 && `${property.bedrooms} bed`}
                    {property.bedrooms > 0 && property.bathrooms > 0 && ', '}
                    {property.bathrooms > 0 && `${property.bathrooms} bath`}
                    {(property.bedrooms > 0 || property.bathrooms > 0) && property.property_type && ', '}
                    {property.property_type && (
                      <span className="capitalize">{property.property_type.replace('_', ' ')}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        property.status === 'available'
                          ? 'bg-green-100 text-green-800'
                          : property.status === 'under_offer'
                          ? 'bg-blue-100 text-blue-800'
                          : property.status === 'sold'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {property.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {property.apex27_id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {propertyCount >= 100 && (
        <div className="mt-4 text-sm text-gray-500">
          Showing latest 100 properties. Total: {totalCount}
        </div>
      )}
    </div>
  );
}
