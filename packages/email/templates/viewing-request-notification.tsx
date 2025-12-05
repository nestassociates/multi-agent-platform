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
  Row,
  Column,
} from '@react-email/components';

interface ViewingRequestNotificationEmailProps {
  agentName: string;
  viewerName: string;
  viewerEmail: string;
  viewerPhone?: string;
  propertyAddress?: string;
  propertyPrice?: string;
  preferredDate?: string;
  preferredTime?: string;
  flexibleDates?: boolean;
  buyerStatus?: string;
  mortgageStatus?: string;
  additionalNotes?: string;
  dashboardUrl?: string;
}

export default function ViewingRequestNotificationEmail({
  agentName,
  viewerName,
  viewerEmail,
  viewerPhone,
  propertyAddress,
  propertyPrice,
  preferredDate,
  preferredTime,
  flexibleDates,
  buyerStatus,
  mortgageStatus,
  additionalNotes,
  dashboardUrl = 'https://dashboard.nestassociates.com',
}: ViewingRequestNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New Viewing Request</Heading>

          <Text style={text}>Hi {agentName},</Text>

          <Text style={text}>
            You have received a new viewing request through your website
            {propertyAddress ? ' for the following property:' : '.'}
          </Text>

          {propertyAddress && (
            <Section style={propertyBox}>
              <Text style={propertyLabel}>Property</Text>
              <Text style={propertyAddress_style}>{propertyAddress}</Text>
              {propertyPrice && <Text style={propertyPrice_style}>{propertyPrice}</Text>}
            </Section>
          )}

          <Section style={infoBox}>
            <Text style={sectionTitle}>Viewer Details</Text>

            <Row style={infoRow}>
              <Column style={labelColumn}>
                <Text style={infoLabel}>Name:</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={infoText}>{viewerName}</Text>
              </Column>
            </Row>

            <Row style={infoRow}>
              <Column style={labelColumn}>
                <Text style={infoLabel}>Email:</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={infoText}>
                  <a href={`mailto:${viewerEmail}`} style={link}>
                    {viewerEmail}
                  </a>
                </Text>
              </Column>
            </Row>

            {viewerPhone && (
              <Row style={infoRow}>
                <Column style={labelColumn}>
                  <Text style={infoLabel}>Phone:</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={infoText}>
                    <a href={`tel:${viewerPhone}`} style={link}>
                      {viewerPhone}
                    </a>
                  </Text>
                </Column>
              </Row>
            )}
          </Section>

          <Section style={scheduleBox}>
            <Text style={sectionTitle}>Preferred Viewing Time</Text>

            {preferredDate && (
              <Row style={infoRow}>
                <Column style={labelColumn}>
                  <Text style={infoLabel}>Date:</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={infoText}>{preferredDate}</Text>
                </Column>
              </Row>
            )}

            {preferredTime && (
              <Row style={infoRow}>
                <Column style={labelColumn}>
                  <Text style={infoLabel}>Time:</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={infoText}>{preferredTime}</Text>
                </Column>
              </Row>
            )}

            {flexibleDates !== undefined && (
              <Row style={infoRow}>
                <Column style={labelColumn}>
                  <Text style={infoLabel}>Flexible:</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={infoText}>{flexibleDates ? 'Yes' : 'No'}</Text>
                </Column>
              </Row>
            )}
          </Section>

          <Hr style={hr} />

          <Section style={buyerBox}>
            <Text style={sectionTitle}>Buyer Information</Text>

            {buyerStatus && buyerStatus !== 'Prefer not to say' && (
              <Row style={infoRow}>
                <Column style={labelColumn}>
                  <Text style={infoLabel}>Status:</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={infoText}>{buyerStatus}</Text>
                </Column>
              </Row>
            )}

            {mortgageStatus && mortgageStatus !== 'Prefer not to say' && (
              <Row style={infoRow}>
                <Column style={labelColumn}>
                  <Text style={infoLabel}>Mortgage:</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={infoText}>{mortgageStatus}</Text>
                </Column>
              </Row>
            )}
          </Section>

          {additionalNotes && (
            <>
              <Hr style={hr} />
              <Section style={notesBox}>
                <Text style={notesLabel}>Additional Notes:</Text>
                <Text style={notesText}>{additionalNotes}</Text>
              </Section>
            </>
          )}

          <Section style={buttonContainer}>
            <Button
              style={replyButton}
              href={`mailto:${viewerEmail}?subject=Re: Your viewing request${propertyAddress ? ` for ${propertyAddress}` : ''}`}
            >
              Reply to {viewerName}
            </Button>
          </Section>

          {viewerPhone && (
            <Section style={secondaryButtonContainer}>
              <Button style={callButton} href={`tel:${viewerPhone}`}>
                Call {viewerPhone}
              </Button>
            </Section>
          )}

          <Text style={footer}>
            This viewing request was submitted through your Nest Associates website. You can view
            all your inquiries in your <a href={dashboardUrl} style={link}>dashboard</a>.
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

const sectionTitle = {
  color: '#333',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const infoBox = {
  backgroundColor: '#f6f9fc',
  borderRadius: '4px',
  padding: '20px 24px',
  margin: '24px 0',
};

const scheduleBox = {
  backgroundColor: '#fff8e6',
  borderRadius: '4px',
  padding: '20px 24px',
  margin: '16px 0',
  border: '1px solid #ffd666',
};

const buyerBox = {
  margin: '24px 0',
};

const infoRow = {
  marginBottom: '8px',
};

const labelColumn = {
  width: '100px',
  verticalAlign: 'top' as const,
};

const valueColumn = {
  verticalAlign: 'top' as const,
};

const infoLabel = {
  color: '#666',
  fontSize: '13px',
  fontWeight: '500',
  margin: '0',
};

const infoText = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0',
};

const propertyBox = {
  backgroundColor: '#e8f4fd',
  borderRadius: '4px',
  borderLeft: '4px solid #1a56db',
  padding: '16px 20px',
  margin: '16px 0',
};

const propertyLabel = {
  color: '#666',
  fontSize: '11px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '0 0 6px',
  letterSpacing: '0.5px',
};

const propertyAddress_style = {
  color: '#1a56db',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 4px',
  lineHeight: '24px',
};

const propertyPrice_style = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
};

const hr = {
  borderColor: '#e6e6e6',
  margin: '24px 0',
};

const notesBox = {
  margin: '24px 0',
};

const notesLabel = {
  color: '#666',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px',
};

const notesText = {
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
  margin: '32px 0 16px',
};

const secondaryButtonContainer = {
  textAlign: 'center' as const,
  margin: '0 0 32px',
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

const callButton = {
  backgroundColor: '#059669',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 24px',
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
