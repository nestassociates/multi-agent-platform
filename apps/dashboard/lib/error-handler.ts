/**
 * Error handling utilities for API routes and server components
 */

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Handle API errors and return consistent error responses
 */
export function handleApiError(error: any) {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      status: error.status,
    };
  }

  if (error.name === 'ZodError') {
    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: error.errors,
      },
      status: 400,
    };
  }

  if (error.message === 'Insufficient permissions') {
    return {
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to perform this action',
      },
      status: 403,
    };
  }

  // Default error
  return {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
    status: 500,
  };
}

/**
 * Log errors with context for debugging
 */
export function logError(
  context: string,
  error: any,
  additionalData?: Record<string, any>
) {
  const errorInfo = {
    context,
    message: error.message,
    stack: error.stack,
    ...additionalData,
  };

  console.error('[Error]', JSON.stringify(errorInfo, null, 2));

  // In production, you'd send this to an error tracking service like Sentry
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error, { extra: errorInfo });
  // }
}

/**
 * Validate email uniqueness
 */
export async function validateEmailUnique(supabase: any, email: string, excludeUserId?: string) {
  const query = supabase.from('profiles').select('id').eq('email', email);

  if (excludeUserId) {
    query.neq('user_id', excludeUserId);
  }

  const { data } = await query.maybeSingle();

  if (data) {
    throw new ApiError(
      'EMAIL_EXISTS',
      'An account with this email already exists',
      409
    );
  }
}

/**
 * Validate subdomain uniqueness
 */
export async function validateSubdomainUnique(
  supabase: any,
  subdomain: string,
  excludeAgentId?: string
) {
  const query = supabase.from('agents').select('id').eq('subdomain', subdomain);

  if (excludeAgentId) {
    query.neq('id', excludeAgentId);
  }

  const { data } = await query.maybeSingle();

  if (data) {
    throw new ApiError(
      'SUBDOMAIN_EXISTS',
      'This subdomain is already taken',
      409
    );
  }
}
