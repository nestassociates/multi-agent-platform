import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@nest/ui';
import { redirect } from 'next/navigation';

export default async function AgentsPage() {
  // Simplified auth check
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  const supabase = createClient();

  // Fetch all agents
  const { data: agents, error } = await supabase
    .from('agents')
    .select('*')
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
          <div className="space-y-2">
            {agents.map((agent) => (
              <div key={agent.id} className="p-4 border rounded">
                <div className="font-medium">{agent.subdomain}</div>
                <div className="text-sm text-gray-500">Status: {agent.status}</div>
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
