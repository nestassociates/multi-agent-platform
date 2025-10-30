import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { passwordResetRequestSchema } from '@nest/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = passwordResetRequestSchema.parse(body);

    const supabase = createClient();

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(validatedData.email, {
      redirectTo: `${request.nextUrl.origin}/reset-password`,
    });

    if (error) {
      return NextResponse.json(
        { error: { code: 'RESET_ERROR', message: error.message } },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Password reset email sent' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
