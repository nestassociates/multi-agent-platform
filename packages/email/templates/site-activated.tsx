/**
 * Site Activated Email Template
 *
 * Sent to agent when their website goes live
 *
 * Feature: 004-agent-lifecycle-management
 * Task: T055
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

interface SiteActivatedEmailProps {
  agentName: string;
  siteUrl: string;
  dashboardUrl: string;
}

export const SiteActivatedEmail = ({
  agentName,
  siteUrl,
  dashboardUrl = 'https://dashboard.nestassociates.com',
}: SiteActivatedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Nest Associates website is now live!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎉 Your Website is Live!</Heading>

          <Text style={text}>
            Congratulations {agentName}!
          </Text>

          <Text style={text}>
            Your professional estate agent website has been approved and is now live at:
          </Text>

          <Section style={urlBox}>
            <Text style={urlText}>{siteUrl}</Text>
          </Section>

          <Text style={text}>
            Your website showcases:
          </Text>
          <ul style={list}>
            <li>Your professional profile and qualifications</li>
            <li>Your current property listings</li>
            <li>Your approved content (blog posts, area guides)</li>
            <li>A contact form for potential clients</li>
          </ul>

          <Section style={buttonContainer}>
            <Button style={button} href={siteUrl}>
              View Your Live Site
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={text}>
            <strong>Next Steps:</strong>
          </Text>
          <ul style={list}>
            <li>Share your new website URL with clients</li>
            <li>Create more content through your dashboard</li>
            <li>Keep your profile and properties up to date</li>
            <li>Your site will automatically rebuild when you make changes</li>
          </ul>

          <Section style={buttonContainer}>
            <Button style={buttonSecondary} href={dashboardUrl}>
              Go to Dashboard
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            This is an automated notification from the Nest Associates platform.
            <br />
            If you have any questions, please contact support.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default SiteActivatedEmail;

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
  fontSize: '28px',
  fontWeight: '700',
  lineHeight: '36px',
  padding: '0 48px',
  margin: '30px 0',
  textAlign: 'center' as const,
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  padding: '0 48px',
  margin: '16px 0',
};

const urlBox = {
  backgroundColor: '#dbeafe',
  border: '2px solid #3b82f6',
  borderRadius: '8px',
  margin: '24px 48px',
  padding: '16px 24px',
  textAlign: 'center' as const,
};

const urlText = {
  color: '#1e40af',
  fontSize: '18px',
  fontWeight: '700',
  margin: 0,
  wordBreak: 'break-all' as const,
};

const list = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '28px',
  padding: '0 48px',
  margin: '16px 0',
};

const buttonContainer = {
  padding: '24px 48px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
};

const buttonSecondary = {
  ...button,
  backgroundColor: '#6b7280',
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
  textAlign: 'center' as const,
};
