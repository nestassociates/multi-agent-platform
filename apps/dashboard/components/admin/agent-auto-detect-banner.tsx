/**
 * Agent Auto-Detect Banner Component
 *
 * Shows notification when draft agents exist
 *
 * Feature: 004-agent-lifecycle-management
 * Task: T024
 */

'use client';

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@nest/ui';
import Link from 'next/link';

interface AgentAutoDetectBannerProps {
  draftAgentCount: number;
}

export function AgentAutoDetectBanner({ draftAgentCount }: AgentAutoDetectBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if banner was dismissed in this session
    const wasDismissed = sessionStorage.getItem('agent-detect-banner-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('agent-detect-banner-dismissed', 'true');
    setDismissed(true);
  };

  if (dismissed || draftAgentCount === 0) {
    return null;
  }

  return (
    <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-blue-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">
            {draftAgentCount} New {draftAgentCount === 1 ? 'Agent' : 'Agents'} Detected from Apex27
          </h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>
              {draftAgentCount === 1
                ? 'A new agent has been automatically detected'
                : `${draftAgentCount} new agents have been automatically detected`}{' '}
              from Apex27 property data. {draftAgentCount === 1 ? 'This agent needs' : 'These agents need'} user accounts created before they can complete their profiles.
            </p>
          </div>
          <div className="mt-4">
            <Link href="/agents?status=draft">
              <Button variant="outline" size="sm" className="bg-white hover:bg-blue-50 text-blue-700 border-blue-300">
                View Draft Agents
              </Button>
            </Link>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={handleDismiss}
            className="inline-flex text-blue-400 hover:text-blue-500"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
