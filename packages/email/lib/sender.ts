import { Resend } from 'resend';
import { render } from '@react-email/render';
import WelcomeEmail from '../templates/welcome';
import ContentApprovedEmail from '../templates/content-approved';
import ContentRejectedEmail from '../templates/content-rejected';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Email sender utility
 * Handles all email sending via Resend
 */

export interface WelcomeEmailData {
  agentName: string;
  email: string;
  temporaryPassword: string;
  loginUrl?: string;
}

export interface EmailResponse {
  id?: string;
  [key: string]: any;
}

/**
 * Send welcome email to new agent
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResponse> {
  const html = render(
    WelcomeEmail({
      agentName: data.agentName,
      email: data.email,
      temporaryPassword: data.temporaryPassword,
      loginUrl: data.loginUrl || process.env.NEXT_PUBLIC_APP_URL + '/login' || 'https://multi-agent-platform-eight.vercel.app/login',
    })
  );

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@nestassociates.co.uk',
      to: data.email,
      subject: 'Welcome to Nest Associates - Your Account is Ready',
      html,
    });

    return result as EmailResponse;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
}

/**
 * Send content approved email to agent
 */
export async function sendContentApprovedEmail(
  agentEmail: string,
  data: {
    agentName: string;
    contentTitle: string;
    contentType: string;
    dashboardUrl?: string;
  }
): Promise<EmailResponse> {
  const html = render(
    ContentApprovedEmail({
      agentName: data.agentName,
      contentTitle: data.contentTitle,
      contentType: data.contentType,
      dashboardUrl: data.dashboardUrl || process.env.NEXT_PUBLIC_APP_URL + '/content' || 'https://multi-agent-platform-eight.vercel.app/content',
    })
  );

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@nestassociates.co.uk',
      to: agentEmail,
      subject: `Your ${data.contentType} has been approved!`,
      html,
    });

    return result as EmailResponse;
  } catch (error) {
    console.error('Failed to send content approved email:', error);
    throw error;
  }
}

/**
 * Send content rejected email to agent
 */
export async function sendContentRejectedEmail(
  agentEmail: string,
  data: {
    agentName: string;
    contentTitle: string;
    contentType: string;
    rejectionReason: string;
    dashboardUrl?: string;
  }
): Promise<EmailResponse> {
  const html = render(
    ContentRejectedEmail({
      agentName: data.agentName,
      contentTitle: data.contentTitle,
      contentType: data.contentType,
      rejectionReason: data.rejectionReason,
      dashboardUrl: data.dashboardUrl || process.env.NEXT_PUBLIC_APP_URL + '/content' || 'https://multi-agent-platform-eight.vercel.app/content',
    })
  );

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@nestassociates.co.uk',
      to: agentEmail,
      subject: `Your ${data.contentType} requires revision`,
      html,
    });

    return result as EmailResponse;
  } catch (error) {
    console.error('Failed to send content rejected email:', error);
    throw error;
  }
}

/**
 * Send build failed email to admins
 */
export async function sendBuildFailedEmail(
  agentName: string,
  data: {
    agentSubdomain: string;
    errorMessage: string;
    buildLogs?: string;
  }
) {
  // Placeholder - will implement when we have the template
  console.log('Build failed email:', agentName, data);
  return { id: 'placeholder' };
}
