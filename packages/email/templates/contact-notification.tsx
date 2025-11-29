import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Heading,
  Hr,
} from '@react-email/components';

interface ContactNotificationEmailProps {
  agentName: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  message: string;
  propertyAddress?: string;
  dashboardUrl?: string;
}

export default function ContactNotificationEmail({
  agentName,
  senderName,
  senderEmail,
  senderPhone,
  message,
  propertyAddress,
  dashboardUrl = 'https://dashboard.nestassociates.com',
}: ContactNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New Contact Form Submission</Heading>

          <Text style={text}>Hi {agentName},</Text>

          <Text style={text}>
            You have received a new inquiry through your website{propertyAddress ? ` regarding a property` : ''}.
          </Text>

          {propertyAddress && (
            <Section style={propertyBox}>
              <Text style={propertyLabel}>Property:</Text>
              <Text style={propertyText}>{propertyAddress}</Text>
            </Section>
          )}

          <Section style={infoBox}>
            <Text style={infoLabel}>From:</Text>
            <Text style={infoText}>{senderName}</Text>

            <Text style={infoLabel}>Email:</Text>
            <Text style={infoText}>
              <a href={`mailto:${senderEmail}`} style={link}>
                {senderEmail}
              </a>
            </Text>

            {senderPhone && (
              <>
                <Text style={infoLabel}>Phone:</Text>
                <Text style={infoText}>
                  <a href={`tel:${senderPhone}`} style={link}>
                    {senderPhone}
                  </a>
                </Text>
              </>
            )}
          </Section>

          <Hr style={hr} />

          <Section style={messageBox}>
            <Text style={messageLabel}>Message:</Text>
            <Text style={messageText}>{message}</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={replyButton} href={`mailto:${senderEmail}?subject=Re: Your inquiry`}>
              Reply to {senderName}
            </Button>
          </Section>

          <Text style={footer}>
            This message was sent from your Nest Associates website. You can view all your inquiries
            in your <a href={dashboardUrl} style={link}>dashboard</a>.
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
  padding: '20px 32px 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const infoBox = {
  backgroundColor: '#f6f9fc',
  borderRadius: '4px',
  padding: '20px 24px',
  margin: '24px 0',
};

const infoLabel = {
  color: '#666',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '12px 0 4px',
};

const infoText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 8px',
};

const propertyBox = {
  backgroundColor: '#e8f4fd',
  borderRadius: '4px',
  borderLeft: '4px solid #1a56db',
  padding: '12px 20px',
  margin: '16px 0',
};

const propertyLabel = {
  color: '#666',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px',
};

const propertyText = {
  color: '#1a56db',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
};

const hr = {
  borderColor: '#e6e6e6',
  margin: '24px 0',
};

const messageBox = {
  margin: '24px 0',
};

const messageLabel = {
  color: '#666',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px',
};

const messageText = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '26px',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
  backgroundColor: '#fafafa',
  padding: '16px',
  borderRadius: '4px',
  border: '1px solid #eaeaea',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const replyButton = {
  backgroundColor: '#1a56db',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const link = {
  color: '#1a56db',
  textDecoration: 'none',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  marginTop: '32px',
  textAlign: 'center' as const,
};
