/**
 * Email package entry point
 * Exports all email sending functions
 */

export {
  sendWelcomeEmail,
  sendContentApprovedEmail,
  sendContentRejectedEmail,
  sendBuildFailedEmail,
  sendAgentDetectedEmail,
  sendProfileCompleteEmail,
  sendSiteActivatedEmail,
  type WelcomeEmailData,
} from './sender';

// Export templates if needed by consumers
export { default as WelcomeEmail } from '../templates/welcome';
export { default as ContentApprovedEmail } from '../templates/content-approved';
export { default as ContentRejectedEmail } from '../templates/content-rejected';
export { default as AgentDetectedEmail } from '../templates/agent-detected';
export { default as ProfileCompleteEmail } from '../templates/profile-complete';
export { default as SiteActivatedEmail } from '../templates/site-activated';
