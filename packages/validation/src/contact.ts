import { z } from 'zod';

/**
 * Contact form submission validation schema
 * Used by public contact form API endpoint
 */
export const contactFormSchema = z.object({
  agentId: z.string().uuid('Invalid agent ID format'),
  propertyId: z.string().uuid('Invalid property ID format').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20, 'Phone number must be at most 20 characters').optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message must be at most 2000 characters'),
  honeypot: z.string().max(0, 'Invalid submission').optional(),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

/**
 * Contact form validation result
 */
export type ContactFormValidation = {
  success: boolean;
  data?: ContactFormInput;
  error?: z.ZodError<ContactFormInput>;
};
