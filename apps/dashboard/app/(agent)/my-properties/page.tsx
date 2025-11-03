/**
 * Agent Properties Page
 * Displays all properties synced from Apex27 for the logged-in agent
 */

import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';

export default async function AgentPropertiesPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const supabase = createServiceRoleClient();

  // Get agent record
  const { data: agent } = await supabase
    .from('agents')
    .select('id, apex27_branch_id, profile:profiles!agents_user_id_fkey(first_name, last_name)')
    .eq('user_id', user.id)
    .single();

  if (!agent) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Properties</h1>
        <p className="mt-4 text-gray-600">Agent profile not found.</p>
      </div>
    );
  }

  // Get properties for this agent
  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('agent_id', agent.id)
    .order('updated_at', { ascending: false });

  const propertyCount = properties?.length || 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Properties</h1>
        <p className="mt-2 text-gray-600">
          Properties synced from Apex27 Branch ID: {agent.apex27_branch_id || 'Not assigned'}
        </p>
      </div>

      {!agent.apex27_branch_id && (
        <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            Your account is not linked to an Apex27 branch. Contact your administrator to assign a branch ID to see your properties.
          </p>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {propertyCount} {propertyCount === 1 ? 'property' : 'properties'} found
        </div>
      </div>

      {propertyCount === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-gray-600">
            {agent.apex27_branch_id
              ? 'No properties found. Properties will appear here when synced from Apex27.'
              : 'No branch assigned yet.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties?.map((property) => (
            <div
              key={property.id}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="p-6">
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="text-lg font-semibold line-clamp-2">
                    {property.title}
                  </h3>
                  {property.is_featured && (
                    <span className="ml-2 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                      Featured
                    </span>
                  )}
                </div>

                <p className="mb-3 text-sm text-gray-600 line-clamp-1">
                  {property.postcode}
                </p>

                <div className="mb-4 flex items-baseline gap-4">
                  <div className="text-2xl font-bold text-gray-900">
                    £{property.price.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">
                    {property.transaction_type}
                  </div>
                </div>

                <div className="mb-4 flex gap-4 text-sm text-gray-600">
                  {property.bedrooms > 0 && (
                    <div>{property.bedrooms} bed</div>
                  )}
                  {property.bathrooms > 0 && (
                    <div>{property.bathrooms} bath</div>
                  )}
                  {property.property_type && (
                    <div className="capitalize">{property.property_type.replace('_', ' ')}</div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      property.status === 'available'
                        ? 'bg-green-100 text-green-800'
                        : property.status === 'under_offer'
                        ? 'bg-blue-100 text-blue-800'
                        : property.status === 'sold'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {property.status.replace('_', ' ').toUpperCase()}
                  </span>

                  <div className="text-xs text-gray-400">
                    ID: {property.apex27_id}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
