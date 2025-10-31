import { createClient } from './supabase/server';
import { redirect } from 'next/navigation';
import type { UserRole } from '@nest/shared-types';

/**
 * Auth Utilities for Next.js Server Components and Route Handlers
 */

/**
 * Get current authenticated user
 * Returns null if not authenticated
 */
export async function getUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get current user with profile information
 */
export async function getUserWithProfile() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return profile ? { ...user, profile } : null;
}

/**
 * Require user to be authenticated
 * Redirects to login if not authenticated
 */
export async function requireAuth() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

/**
 * Require user to have specific role
 * Redirects to login if not authenticated
 * Throws error if insufficient permissions
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const userWithProfile = await getUserWithProfile();

  if (!userWithProfile) {
    redirect('/login');
  }

  const userRole = userWithProfile.profile.role as UserRole;

  if (!allowedRoles.includes(userRole)) {
    throw new Error('Insufficient permissions');
  }

  return { user: userWithProfile, role: userRole };
}

/**
 * Check if user is admin (super_admin or admin)
 */
export async function isAdmin() {
  const userWithProfile = await getUserWithProfile();

  if (!userWithProfile) return false;

  return ['super_admin', 'admin'].includes(userWithProfile.profile.role);
}

/**
 * Check if user is agent
 */
export async function isAgent() {
  const userWithProfile = await getUserWithProfile();

  if (!userWithProfile) return false;

  return userWithProfile.profile.role === 'agent';
}

/**
 * Get agent record for current user (if user is an agent)
 */
export async function getCurrentAgent() {
  const userWithProfile = await getUserWithProfile();

  if (!userWithProfile || userWithProfile.profile.role !== 'agent') {
    return null;
  }

  const supabase = createClient();
  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', userWithProfile.profile.user_id)
    .single();

  return agent;
}
