/**
 * POST /api/admin/agents/bulk-update
 * Bulk update agent statuses
 *
 * Feature: 004-agent-lifecycle-management
 * Tasks: T076-T077
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import {
  deactivateAgent,
  reactivateAgent,
  suspendAgent,
} from '@/lib/services/agent-activation';
import { agentStatusSchema } from '@nest/validation';

// Validation schema for bulk update
const bulkUpdateSchema = z.object({
  agent_ids: z.array(z.string().uuid()).min(1, 'At least one agent ID is required'),
  action: z.enum(['deactivate', 'reactivate', 'suspend']),
  reason: z.string().optional(),
  queueBuild: z.boolean().optional(),
});

interface BulkResult {
  agentId: string;
  success: boolean;
  error?: string;
  previousStatus?: string;
  newStatus?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json().catch(() => ({}));
    const validatedData = bulkUpdateSchema.parse(body);

    // Validate reason for deactivate/suspend
    if (['deactivate', 'suspend'].includes(validatedData.action)) {
      if (!validatedData.reason || validatedData.reason.length < 10) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: `Reason is required for ${validatedData.action} action (minimum 10 characters)`,
            },
          },
          { status: 400 }
        );
      }
    }

    const results: BulkResult[] = [];

    // Process each agent - we do this sequentially to ensure proper transaction handling
    // and audit logging for each status change
    for (const agentId of validatedData.agent_ids) {
      try {
        let result;

        switch (validatedData.action) {
          case 'deactivate':
            result = await deactivateAgent(agentId, user.id, validatedData.reason!);
            break;
          case 'reactivate':
            result = await reactivateAgent(
              agentId,
              user.id,
              validatedData.reason,
              validatedData.queueBuild || false
            );
            break;
          case 'suspend':
            result = await suspendAgent(agentId, user.id, validatedData.reason!);
            break;
        }

        results.push({
          agentId,
          success: result.success,
          error: result.error,
          previousStatus: result.previousStatus,
          newStatus: result.agent?.status,
        });
      } catch (err: any) {
        results.push({
          agentId,
          success: false,
          error: err.message || 'Unknown error',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: failureCount === 0,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
      },
      results,
      message:
        failureCount === 0
          ? `Successfully ${validatedData.action}d ${successCount} agent(s)`
          : `Completed with ${failureCount} error(s). ${successCount} succeeded, ${failureCount} failed.`,
    });
  } catch (error: any) {
    console.error('Bulk update endpoint error:', error);

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
