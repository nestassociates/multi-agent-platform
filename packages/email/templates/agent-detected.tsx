/**
 * Agent Detected Email Template
 *
 * Sent to admins when new agent is auto-detected from Apex27
 *
 * Feature: 004-agent-lifecycle-management
 * Task: T019
 */

import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface AgentDetectedEmailProps {
  branchId: string;
  branchName: string | null;
  subdomain: string;
  propertyCount: number;
  agentId: string;
  dashboardUrl: string;
}

export const AgentDetectedEmail = ({
  branchId,
  branchName,
  subdomain,
  propertyCount,
  agentId,
  dashboardUrl = 'https://dashboard.nestassociates.com',
}: AgentDetectedEmailProps) => {
  const setupUrl = `${dashboardUrl}/agents?status=draft`;

  return (
    <Html>
      <Head />
      <Preview>New agent detected from Apex27: {branchId}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎯 New Agent Detected</Heading>

          <Text style={text}>
            A new agent has been automatically detected from Apex27 property data and needs your attention.
          </Text>

          <Section style={detailsBox}>
            <Text style={detailsLabel}>Branch ID:</Text>
            <Text style={detailsValue}>{branchId}</Text>

            {branchName && (
              <>
                <Text style={detailsLabel}>Branch Name:</Text>
                <Text style={detailsValue}>{branchName}</Text>
              </>
            )}

            <Text style={detailsLabel}>Subdomain (auto-generated):</Text>
            <Text style={detailsValue}>{subdomain}.nestassociates.com</Text>

            <Text style={detailsLabel}>Properties Assigned:</Text>
            <Text style={detailsValue}>{propertyCount} {propertyCount === 1 ? 'property' : 'properties'}</Text>

            <Text style={detailsLabel}>Status:</Text>
            <Text style={statusDraft}>DRAFT (Not Deployed)</Text>
          </Section>

          <Text style={text}>
            This agent has been created with <strong>status='draft'</strong> and their properties are syncing, but <strong>no website has been deployed yet</strong>.
          </Text>

          <Text style={text}>
            <strong>Next Steps:</strong>
          </Text>
          <ul style={list}>
            <li>Review the agent and their assigned properties</li>
            <li>Create a user account for the agent</li>
            <li>Send them a welcome email with login credentials</li>
            <li>Wait for them to complete their profile</li>
            <li>Approve and deploy their website when ready</li>
          </ul>

          <Section style={buttonContainer}>
            <Button style={button} href={setupUrl}>
              Setup New Agent
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            This is an automated notification from the Nest Associates platform.
            <br />
            Agent was auto-detected from Apex27 property data.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default AgentDetectedEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  padding: '0 48px',
  margin: '30px 0',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  padding: '0 48px',
  margin: '16px 0',
};

const detailsBox = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  margin: '24px 48px',
  padding: '24px',
};

const detailsLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '12px 0 4px 0',
};

const detailsValue = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 12px 0',
};

const statusDraft = {
  ...detailsValue,
  color: '#9ca3af',
  backgroundColor: '#ffffff',
  border: '2px dashed #d1d5db',
  borderRadius: '6px',
  padding: '8px 12px',
  display: 'inline-block',
  fontWeight: '600',
};

const list = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  padding: '0 48px',
  margin: '16px 0',
};

const buttonContainer = {
  padding: '24px 48px',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 48px',
};

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  padding: '0 48px',
  margin: '16px 0',
};
