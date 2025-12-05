import { z } from 'zod';

/**
 * Buyer status options for viewing requests
 */
export const buyerStatusOptions = [
  'ftb', // First Time Buyer
  'chain_free', // Chain Free
  'has_chain', // Has Property to Sell
  'investor', // Investor
  'cash_buyer', // Cash Buyer
  'not_specified',
] as const;

export type BuyerStatus = (typeof buyerStatusOptions)[number];

/**
 * Mortgage status options for viewing requests
 */
export const mortgageStatusOptions = [
  'approved', // Mortgage Approved
  'in_principle', // Agreement in Principle
  'not_started', // Not Yet Applied
  'cash_buyer', // Cash Buyer (no mortgage needed)
  'not_specified',
] as const;

export type MortgageStatus = (typeof mortgageStatusOptions)[number];

/**
 * Preferred time slot options
 */
export const preferredTimeOptions = [
  'morning', // 9am - 12pm
  'afternoon', // 12pm - 5pm
  'evening', // 5pm - 8pm
  'flexible', // Any time
] as const;

export type PreferredTime = (typeof preferredTimeOptions)[number];

/**
 * Viewing request form submission validation schema
 * Used by public viewing request API endpoint
 */
export const viewingRequestSchema = z.object({
  // Required identifiers
  agentId: z.string().uuid('Invalid agent ID format'),
  propertyId: z.string().uuid('Invalid property ID format').optional(),
  apex27ListingId: z.string().optional(),

  // Contact info
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .max(20, 'Phone number must be at most 20 characters')
    .optional()
    .transform((val) => val || undefined),

  // Viewing preferences
  preferredDate: z
    .string()
    .optional()
    .transform((val) => (val ? val : undefined)),
  preferredTime: z.enum(preferredTimeOptions).default('flexible'),
  flexibleDates: z.boolean().default(true),

  // Buyer info
  buyerStatus: z.enum(buyerStatusOptions).default('not_specified'),
  mortgageStatus: z.enum(mortgageStatusOptions).default('not_specified'),
  additionalNotes: z
    .string()
    .max(1000, 'Notes must be at most 1000 characters')
    .optional()
    .transform((val) => val || undefined),

  // Metadata
  sourcePage: z.string().optional(),

  // Bot protection
  honeypot: z.string().max(0, 'Invalid submission').optional(),
});

export type ViewingRequestInput = z.infer<typeof viewingRequestSchema>;

/**
 * Viewing request validation result
 */
export type ViewingRequestValidation = {
  success: boolean;
  data?: ViewingRequestInput;
  error?: z.ZodError<ViewingRequestInput>;
};

/**
 * Human-readable labels for buyer status options
 */
export const buyerStatusLabels: Record<BuyerStatus, string> = {
  ftb: 'First Time Buyer',
  chain_free: 'Chain Free',
  has_chain: 'Has Property to Sell',
  investor: 'Investor',
  cash_buyer: 'Cash Buyer',
  not_specified: 'Prefer not to say',
};

/**
 * Human-readable labels for mortgage status options
 */
export const mortgageStatusLabels: Record<MortgageStatus, string> = {
  approved: 'Mortgage Approved',
  in_principle: 'Agreement in Principle',
  not_started: 'Not Yet Applied',
  cash_buyer: 'Cash Buyer',
  not_specified: 'Prefer not to say',
};

/**
 * Human-readable labels for preferred time options
 */
export const preferredTimeLabels: Record<PreferredTime, string> = {
  morning: 'Morning (9am - 12pm)',
  afternoon: 'Afternoon (12pm - 5pm)',
  evening: 'Evening (5pm - 8pm)',
  flexible: 'Flexible / Any time',
};
