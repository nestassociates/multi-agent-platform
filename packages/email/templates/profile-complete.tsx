/**
 * Profile Complete Email Template
 *
 * Sent to admins when agent completes their profile
 *
 * Feature: 004-agent-lifecycle-management
 * Task: T039
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
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface ProfileCompleteEmailProps {
  agentName: string;
  agentId: string;
  agentSubdomain: string;
  dashboardUrl: string;
}

export const ProfileCompleteEmail = ({
  agentName,
  agentId,
  agentSubdomain,
  dashboardUrl = 'https://dashboard.nestassociates.com',
}: ProfileCompleteEmailProps) => {
  const reviewUrl = `${dashboardUrl}/agents/${agentId}?tab=onboarding`;

  return (
    <Html>
      <Head />
      <Preview>Agent profile complete and ready for review: {agentName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>✅ Agent Profile Complete</Heading>

          <Text style={text}>
            <strong>{agentName}</strong> has completed their profile and is ready for admin review and site activation.
          </Text>

          <Section style={detailsBox}>
            <Text style={detailsLabel}>Agent Name:</Text>
            <Text style={detailsValue}>{agentName}</Text>

            <Text style={detailsLabel}>Subdomain:</Text>
            <Text style={detailsValue}>{agentSubdomain}.nestassociates.com</Text>

            <Text style={detailsLabel}>Status:</Text>
            <Text style={statusPending}>PENDING ADMIN APPROVAL</Text>
          </Section>

          <Text style={text}>
            <strong>What's Complete:</strong>
          </Text>
          <ul style={list}>
            <li>✅ Profile photo uploaded</li>
            <li>✅ Bio written (100+ characters)</li>
            <li>✅ Phone number added</li>
            <li>✅ Qualifications added</li>
            <li>✅ Email verified</li>
            <li>✅ Subdomain confirmed</li>
          </ul>

          <Text style={text}>
            <strong>Next Steps:</strong>
          </Text>
          <ul style={list}>
            <li>Review the agent's profile information</li>
            <li>Verify all details are accurate and professional</li>
            <li>Click "Approve & Deploy Site" when ready</li>
            <li>Agent will receive notification when site goes live</li>
          </ul>

          <Section style={buttonContainer}>
            <Button style={button} href={reviewUrl}>
              Review & Approve
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            This is an automated notification from the Nest Associates platform.
            <br />
            Agent's profile completion triggered this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ProfileCompleteEmail;

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

const statusPending = {
  ...detailsValue,
  color: '#d97706',
  backgroundColor: '#fef3c7',
  border: '2px solid #fbbf24',
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
