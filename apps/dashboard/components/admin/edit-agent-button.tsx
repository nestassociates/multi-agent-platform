'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { EditAgentModal } from './edit-agent-modal';

interface EditAgentButtonProps {
  agent: {
    id: string;
    subdomain: string;
    apex27_branch_id: string | null;
    bio: string | null;
    status: string;
    qualifications?: string[];
    social_media_links?: Record<string, string>;
    profile?: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string | null;
    };
  };
}

export function EditAgentButton({ agent }: EditAgentButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button onClick={() => setShowModal(true)}>
        <Edit className="h-4 w-4 mr-1" />
        Edit Agent
      </Button>
      <EditAgentModal agent={agent} open={showModal} onOpenChange={setShowModal} />
    </>
  );
}

export default EditAgentButton;
