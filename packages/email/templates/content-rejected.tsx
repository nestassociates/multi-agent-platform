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

interface ContentRejectedEmailProps {
  agentName: string;
  contentTitle: string;
  contentType: string;
  rejectionReason: string;
  dashboardUrl: string;
}

export default function ContentRejectedEmail({
  agentName = 'Agent',
  contentTitle = 'Your Content',
  contentType = 'blog post',
  rejectionReason = 'Please review our content guidelines',
  dashboardUrl = 'https://dashboard.nestassociates.com',
}: ContentRejectedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your {contentType} submission requires revisions before it can be published
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Content Requires Revision</Heading>

          <Text style={text}>Hi {agentName},</Text>

          <Text style={text}>
            Thank you for submitting your {contentType} titled{' '}
            <strong>&quot;{contentTitle}&quot;</strong>. Our content moderation team has reviewed
            it and identified some areas that need attention before it can be published.
          </Text>

          <Section style={highlightBox}>
            <Text style={highlightTitle}>Feedback from our moderation team:</Text>
            <Text style={highlightText}>{rejectionReason}</Text>
          </Section>

          <Text style={text}>
            <strong>What you can do:</strong>
          </Text>

          <ul style={list}>
            <li style={listItem}>
              Review the feedback above and make the necessary changes to your content
            </li>
            <li style={listItem}>
              Edit your content in the dashboard and resubmit for review
            </li>
            <li style={listItem}>
              If you have questions about the feedback, contact our support team
            </li>
          </ul>

          <Section style={infoBox}>
            <Text style={infoText}>
              <strong>Content Guidelines Reminder:</strong>
              <br />
              • Ensure content is original and not plagiarized
              <br />
              • Use proper grammar and spelling
              <br />
              • Provide value to potential clients
              <br />
              • Avoid overly promotional language
              <br />• Verify all facts and claims are accurate
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              Edit and Resubmit
            </Button>
          </Section>

          <Text style={text}>
            We appreciate your effort in creating content and look forward to reviewing your
            updated submission. Quality content helps showcase your expertise and attracts
            clients!
          </Text>

          <Text style={footer}>
            Best regards,
            <br />
            The Nest Associates Team
          </Text>

          <Text style={footerNote}>
            If you have questions about this feedback or need clarification on our content
            guidelines, please contact support at support@nestassociates.com
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
  maxWidth: '600px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 40px',
  textAlign: 'center' as const,
};

const text = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
};

const highlightBox = {
  backgroundColor: '#fef2f2',
  border: '2px solid #ef4444',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '16px',
};

const highlightTitle = {
  color: '#991b1b',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
};

const highlightText = {
  color: '#7f1d1d',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
};

const list = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
  margin: '16px 0',
};

const listItem = {
  marginBottom: '12px',
};

const infoBox = {
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '16px',
};

const infoText = {
  color: '#1e3a8a',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
};

const buttonContainer = {
  padding: '27px 40px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const footer = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '32px 0 0',
  padding: '0 40px',
};

const footerNote = {
  color: '#898989',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '16px 0 0',
  padding: '0 40px',
};
