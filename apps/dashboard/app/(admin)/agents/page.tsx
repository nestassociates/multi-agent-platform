import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@nest/ui';
import { redirect } from 'next/navigation';

export default async function AgentsPage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Use service role to bypass RLS
  const supabase = createServiceRoleClient();

  const { data: agents, error } = await supabase
    .from('agents')
    .select('*, profile:profiles!agents_user_id_fkey(first_name, last_name, email)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching agents:', error);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Agents</h1>
          <p className="text-gray-600 mt-1">Manage real estate agents</p>
        </div>
        <Link href="/agents/new">
          <Button>Create Agent</Button>
        </Link>
      </div>

      {agents && agents.length > 0 ? (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="space-y-4">
            {agents.map((agent: any) => (
              <div key={agent.id} className="p-4 border rounded hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-lg">
                      {agent.profile?.first_name} {agent.profile?.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{agent.profile?.email}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {agent.subdomain}.agents.nestassociates.com
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      agent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {agent.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">No agents yet</p>
          <Link href="/agents/new">
            <Button>Create Your First Agent</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
