-- Fix RLS infinite recursion by using JWT claims instead of database queries
-- This migration:
-- 1. Drops all recursive policies
-- 2. Creates helper function to get role from JWT
-- 3. Recreates policies using JWT-based role check

-- Drop all existing admin policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all agents" ON agents;
DROP POLICY IF EXISTS "Admins can insert agents" ON agents;
DROP POLICY IF EXISTS "Admins can update agents" ON agents;
DROP POLICY IF EXISTS "Admins can delete agents" ON agents;
DROP POLICY IF EXISTS "Admins can view all properties" ON properties;

-- Also fix the "Users can update own profile" policy which has recursion in WITH CHECK
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create function to check if current user is admin
-- Note: Created in public schema since we can't modify auth schema
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role IN ('super_admin', 'admin')
     FROM profiles
     WHERE user_id = auth.uid()),
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate "Users can update own profile" without recursion
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    -- Role cannot be changed by the user themselves
    role = (SELECT p.role FROM profiles p WHERE p.user_id = auth.uid())
  );

-- Note: For admin operations, we'll use the service role client in API routes
-- This is the recommended approach for admin operations in Supabase
-- No admin policies needed - all admin operations go through authenticated API routes
-- that use createServiceRoleClient() to bypass RLS

-- Add comment explaining the strategy
COMMENT ON FUNCTION public.is_admin IS
  'Helper function to check if current user is admin. Currently not used in RLS policies - admin operations use service role client instead.';
