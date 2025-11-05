/**
 * Email package entry point
 * Exports all email sending functions
 */

export {
  sendWelcomeEmail,
  sendContentApprovedEmail,
  sendContentRejectedEmail,
  sendBuildFailedEmail,
  type WelcomeEmailData,
} from './sender';

// Export templates if needed by consumers
export { default as WelcomeEmail } from '../templates/welcome';
export { default as ContentApprovedEmail } from '../templates/content-approved';
export { default as ContentRejectedEmail } from '../templates/content-rejected';
