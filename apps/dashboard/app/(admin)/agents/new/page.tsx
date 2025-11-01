import { requireRole } from '@/lib/auth';
import CreateAgentForm from '@/components/admin/create-agent-form';
import Link from 'next/link';

export default async function NewAgentPage() {
  // Require admin role
  await requireRole(['super_admin', 'admin']);

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/agents" className="text-sm text-gray-600 hover:text-gray-900">
          ← Back to Agents
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Agent</h1>
        <p className="text-gray-600 mt-1">
          Add a new real estate agent to the platform
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <CreateAgentForm />
      </div>
    </div>
  );
}
