import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Heading,
} from '@react-email/components';

interface WelcomeEmailProps {
  agentName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
}

export default function WelcomeEmail({
  agentName,
  email,
  temporaryPassword,
  loginUrl,
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to Nest Associates</Heading>

          <Text style={text}>Hi {agentName},</Text>

          <Text style={text}>
            Your agent account has been created! You now have access to the Nest Associates
            Multi-Agent Platform where you can manage your microsite, create content, and view
            your properties.
          </Text>

          <Section style={infoBox}>
            <Text style={infoText}>
              <strong>Your Login Credentials:</strong>
            </Text>
            <Text style={infoText}>Email: {email}</Text>
            <Text style={infoText}>Temporary Password: {temporaryPassword}</Text>
          </Section>

          <Text style={text}>
            For security, you'll be required to change your password on first login.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={loginUrl}>
              Log In to Your Dashboard
            </Button>
          </Section>

          <Text style={text}>
            If you have any questions or need assistance, please don't hesitate to contact our
            support team.
          </Text>

          <Text style={footer}>
            Best regards,
            <br />
            The Nest Associates Team
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

const infoBox = {
  backgroundColor: '#f6f9fc',
  borderRadius: '4px',
  padding: '24px',
  margin: '24px 0',
};

const infoText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '4px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
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

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  marginTop: '48px',
};
