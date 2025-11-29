import { Resend } from 'resend';
import { render } from '@react-email/render';
import WelcomeEmail from '../templates/welcome';
import ContentApprovedEmail from '../templates/content-approved';
import ContentRejectedEmail from '../templates/content-rejected';
import AgentDetectedEmail from '../templates/agent-detected';
import ProfileCompleteEmail from '../templates/profile-complete';
import SiteActivatedEmail from '../templates/site-activated';
import ContactNotificationEmail from '../templates/contact-notification';

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

/**
 * Send agent detected email to admins
 * Feature: 004-agent-lifecycle-management
 * Task: T020
 */
export async function sendAgentDetectedEmail(
  adminEmail: string,
  data: {
    branchId: string;
    branchName: string | null;
    subdomain: string;
    propertyCount: number;
    agentId: string;
    dashboardUrl?: string;
  }
): Promise<EmailResponse> {
  const html = render(
    AgentDetectedEmail({
      branchId: data.branchId,
      branchName: data.branchName,
      subdomain: data.subdomain,
      propertyCount: data.propertyCount,
      agentId: data.agentId,
      dashboardUrl: data.dashboardUrl || process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.nestassociates.com',
    })
  );

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@nestassociates.co.uk',
      to: adminEmail,
      subject: `New Agent Detected from Apex27: ${data.branchId}`,
      html,
    });

    return result as EmailResponse;
  } catch (error) {
    console.error('Failed to send agent-detected email:', error);
    throw error;
  }
}

/**
 * Send profile complete email to admins
 * Feature: 004-agent-lifecycle-management
 * Task: T038
 */
export async function sendProfileCompleteEmail(
  adminEmail: string,
  data: {
    agentName: string;
    agentId: string;
    agentSubdomain: string;
    dashboardUrl?: string;
  }
): Promise<EmailResponse> {
  const html = render(
    ProfileCompleteEmail({
      agentName: data.agentName,
      agentId: data.agentId,
      agentSubdomain: data.agentSubdomain,
      dashboardUrl: data.dashboardUrl || process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.nestassociates.com',
    })
  );

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@nestassociates.co.uk',
      to: adminEmail,
      subject: `Agent Ready for Review: ${data.agentName}`,
      html,
    });

    return result as EmailResponse;
  } catch (error) {
    console.error('Failed to send profile-complete email:', error);
    throw error;
  }
}

/**
 * Send site activated email to agent
 * Feature: 004-agent-lifecycle-management
 * Task: T056
 */
export async function sendSiteActivatedEmail(
  agentEmail: string,
  data: {
    agentName: string;
    siteUrl: string;
    dashboardUrl?: string;
  }
): Promise<EmailResponse> {
  const html = render(
    SiteActivatedEmail({
      agentName: data.agentName,
      siteUrl: data.siteUrl,
      dashboardUrl: data.dashboardUrl || process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.nestassociates.com',
    })
  );

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@nestassociates.co.uk',
      to: agentEmail,
      subject: 'Your Website is Now Live! 🎉',
      html,
    });

    return result as EmailResponse;
  } catch (error) {
    console.error('Failed to send site-activated email:', error);
    throw error;
  }
}

/**
 * Send contact form notification email to agent
 * Feature: 006-astro-microsite-deployment
 * Task: T049
 */
export async function sendContactNotificationEmail(
  agentEmail: string,
  data: {
    agentName: string;
    senderName: string;
    senderEmail: string;
    senderPhone?: string;
    message: string;
    propertyAddress?: string;
    dashboardUrl?: string;
  }
): Promise<EmailResponse> {
  const html = render(
    ContactNotificationEmail({
      agentName: data.agentName,
      senderName: data.senderName,
      senderEmail: data.senderEmail,
      senderPhone: data.senderPhone,
      message: data.message,
      propertyAddress: data.propertyAddress,
      dashboardUrl: data.dashboardUrl || process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.nestassociates.com',
    })
  );

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@nestassociates.co.uk',
      to: agentEmail,
      subject: `New inquiry from ${data.senderName}`,
      html,
    });

    return result as EmailResponse;
  } catch (error) {
    console.error('Failed to send contact notification email:', error);
    throw error;
  }
}
