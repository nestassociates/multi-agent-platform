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

interface ContentApprovedEmailProps {
  agentName: string;
  contentTitle: string;
  contentType: string;
  dashboardUrl: string;
}

export default function ContentApprovedEmail({
  agentName = 'Agent',
  contentTitle = 'Your Content',
  contentType = 'blog post',
  dashboardUrl = 'https://dashboard.nestassociates.com',
}: ContentApprovedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your {contentType} has been approved and will be published soon!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Content Approved! 🎉</Heading>

          <Text style={text}>Hi {agentName},</Text>

          <Text style={text}>
            Great news! Your {contentType} titled <strong>&quot;{contentTitle}&quot;</strong> has
            been reviewed and approved by our content moderation team.
          </Text>

          <Section style={highlightBox}>
            <Text style={highlightText}>
              Your content will be published to your agent microsite within the next few minutes as
              we rebuild your site with the new content.
            </Text>
          </Section>

          <Text style={text}>
            <strong>What happens next?</strong>
          </Text>

          <ul style={list}>
            <li style={listItem}>
              Your site will be automatically rebuilt to include your new content
            </li>
            <li style={listItem}>
              The content will be visible to visitors once the build completes (typically 2-5
              minutes)
            </li>
            <li style={listItem}>You'll receive a notification when your site is live</li>
          </ul>

          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              View in Dashboard
            </Button>
          </Section>

          <Text style={text}>
            Keep creating quality content to showcase your expertise and attract potential clients!
          </Text>

          <Text style={footer}>
            Best regards,
            <br />
            The Nest Associates Team
          </Text>

          <Text style={footerNote}>
            If you have any questions about your content or the approval process, please contact
            support at support@nestassociates.com
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
  backgroundColor: '#ecfdf5',
  border: '2px solid #10b981',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '16px',
};

const highlightText = {
  color: '#065f46',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
  textAlign: 'center' as const,
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

const buttonContainer = {
  padding: '27px 40px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#10b981',
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
