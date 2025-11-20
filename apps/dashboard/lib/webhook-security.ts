/**
 * Webhook Security Utilities
 *
 * Prevents replay attacks by tracking processed webhook IDs
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Check if webhook has already been processed
 * @param webhookId - Unique webhook identifier
 * @param source - Webhook source (e.g., 'apex27', 'stripe')
 * @returns true if webhook is new, false if already processed
 */
export async function isWebhookNew(webhookId: string, source: string): Promise<boolean> {
  const supabase = createServiceRoleClient();

  // Check if webhook ID exists in audit logs
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id')
    .eq('entity_type', 'webhook')
    .eq('entity_id', webhookId)
    .eq('action', source)
    .limit(1);

  if (error) {
    console.error('Error checking webhook replay:', error);
    // On error, allow webhook (fail open)
    return true;
  }

  // If data exists, webhook was already processed
  return !data || data.length === 0;
}

/**
 * Mark webhook as processed
 * @param webhookId - Unique webhook identifier
 * @param source - Webhook source
 * @param payload - Webhook payload (stored for debugging)
 */
export async function markWebhookProcessed(
  webhookId: string,
  source: string,
  payload: any
): Promise<void> {
  const supabase = createServiceRoleClient();

  await supabase.from('audit_logs').insert({
    user_id: null, // System action, no user
    entity_type: 'webhook',
    entity_id: webhookId,
    action: source,
    new_values: {
      processed_at: new Date().toISOString(),
      source,
      payload_summary: {
        event_type: payload.event_type || payload.type,
        timestamp: payload.timestamp || new Date().toISOString(),
      },
    },
  });
}

/**
 * Validate webhook signature (generic HMAC validation)
 * @param payload - Webhook payload string
 * @param signature - Signature from header
 * @param secret - Webhook secret
 * @returns true if signature is valid
 */
export async function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Constant-time comparison to prevent timing attacks
    return constantTimeCompare(computedSignature, signature);
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
}

/**
 * Constant-time string comparison
 * Prevents timing attacks when comparing secrets
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate unique webhook ID from payload
 * Useful when webhook doesn't provide an ID
 */
export async function generateWebhookId(payload: any): Promise<string> {
  const data = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Cleanup old webhook logs (run periodically)
 * Removes webhook audit logs older than specified days
 * @param daysToKeep - Number of days to keep logs (default: 90)
 */
export async function cleanupOldWebhookLogs(daysToKeep: number = 90): Promise<number> {
  const supabase = createServiceRoleClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const { data, error } = await supabase
    .from('audit_logs')
    .delete()
    .eq('entity_type', 'webhook')
    .lt('created_at', cutoffDate.toISOString())
    .select('id');

  if (error) {
    console.error('Error cleaning up webhook logs:', error);
    return 0;
  }

  return data?.length || 0;
}
