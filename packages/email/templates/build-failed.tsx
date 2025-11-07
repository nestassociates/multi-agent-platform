import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface BuildFailedEmailProps {
  agentName: string;
  agentSubdomain: string;
  errorMessage: string;
  retryCount: number;
  buildLogs?: string;
  dashboardUrl: string;
}

export default function BuildFailedEmail({
  agentName = 'Agent',
  agentSubdomain = 'agent-name',
  errorMessage = 'Unknown error occurred',
  retryCount = 3,
  buildLogs,
  dashboardUrl = 'https://dashboard.nestassociates.com',
}: BuildFailedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Build failed for ${agentName}'s agent site after ${retryCount} attempts`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>⚠️ Agent Site Build Failed</Heading>

          <Text style={text}>Admin Team,</Text>

          <Text style={text}>
            The automated build for <strong>{agentName}'s</strong> agent microsite has failed after{' '}
            <strong>{retryCount} retry attempts</strong>.
          </Text>

          <Section style={errorBox}>
            <Text style={errorLabel}>Agent Details</Text>
            <Text style={errorText}>
              <strong>Name:</strong> {agentName}
            </Text>
            <Text style={errorText}>
              <strong>Subdomain:</strong> {agentSubdomain}.agents.nestassociates.com
            </Text>
            <Text style={errorText}>
              <strong>Retries:</strong> {retryCount}
            </Text>
          </Section>

          <Section style={errorBox}>
            <Text style={errorLabel}>Error Message</Text>
            <Text style={codeText}>{errorMessage}</Text>
          </Section>

          {buildLogs && (
            <Section style={errorBox}>
              <Text style={errorLabel}>Build Logs (Last 500 chars)</Text>
              <Text style={codeText}>{buildLogs.slice(-500)}</Text>
            </Section>
          )}

          <Text style={text}>
            <strong>Action Required:</strong>
          </Text>

          <Text style={text}>
            Please investigate the build failure and manually retry or fix the underlying issue. The
            agent's current site will remain live until a successful build completes.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={`${dashboardUrl}/build-queue`}>
              View Build Queue
            </Button>
          </Section>

          <Text style={footer}>
            Nest Associates Multi-Agent Platform
            <br />
            Automated build system notification
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

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
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const errorBox = {
  backgroundColor: '#fef2f2',
  borderLeft: '4px solid #dc2626',
  borderRadius: '8px',
  margin: '24px 0',
  padding: '16px',
};

const errorLabel = {
  color: '#991b1b',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const errorText = {
  color: '#7f1d1d',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '4px 0',
};

const codeText = {
  backgroundColor: '#1f2937',
  color: '#f3f4f6',
  fontFamily: 'monospace',
  fontSize: '12px',
  lineHeight: '18px',
  padding: '12px',
  borderRadius: '4px',
  overflowX: 'auto' as const,
  margin: '8px 0 0 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  marginTop: '32px',
  textAlign: 'center' as const,
};
