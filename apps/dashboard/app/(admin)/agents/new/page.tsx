import { getUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import CreateAgentForm from '@/components/admin/create-agent-form';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getBranchDetails } from '@/lib/apex27/client';

interface NewAgentPageProps {
  searchParams: {
    draft_agent_id?: string;
  };
}

export default async function NewAgentPage({ searchParams }: NewAgentPageProps) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  // If setting up a draft agent, fetch their details
  let initialData = undefined;
  let draftAgent = null;
  let branchDetails = null;

  if (searchParams.draft_agent_id) {
    const supabase = createServiceRoleClient();

    // Fetch draft agent
    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('id', searchParams.draft_agent_id)
      .single();

    if (agent && agent.apex27_branch_id) {
      draftAgent = agent;

      // Fetch branch details from Apex27
      try {
        branchDetails = await getBranchDetails(agent.apex27_branch_id);

        if (branchDetails) {
          // Pre-populate form with Apex27 data
          initialData = {
            email: branchDetails.email,
            phone: branchDetails.phone,
            subdomain: agent.subdomain,
            apex27_branch_id: agent.apex27_branch_id,
            // Try to extract name from branch name if it looks like a person's name
            // Otherwise admin will need to fill it in
          };
        }
      } catch (error) {
        console.error('Failed to fetch branch details:', error);
        // Continue without pre-population
      }
    }
  }

  const isSetup = !!draftAgent;
  const title = isSetup ? `Setup Agent: ${branchDetails?.name || draftAgent?.subdomain}` : 'Create New Agent';
  const description = isSetup
    ? `Create user account for draft agent (Branch ID: ${draftAgent?.apex27_branch_id})`
    : 'Add a new real estate agent to the platform';

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/agents" className="text-sm text-gray-600 hover:text-gray-900">
          ← Back to Agents
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-gray-600 mt-1">{description}</p>
        {isSetup && branchDetails && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>📋 Pre-filled from Apex27:</strong> Email and phone from Branch {draftAgent?.apex27_branch_id}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <CreateAgentForm initialData={initialData} draftAgentId={draftAgent?.id} />
      </div>
    </div>
  );
}
