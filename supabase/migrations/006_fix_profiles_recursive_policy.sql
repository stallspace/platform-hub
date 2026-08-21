-- ============================================================
-- Stallspace — Fix infinite recursion in the profiles RLS policy
-- Migration: 006_fix_profiles_recursive_policy
--
-- The original policy from 001:
--   CREATE POLICY "Admins can view all profiles" ON profiles FOR ALL
--     USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
--
-- ...queries `profiles` from within a policy ON `profiles`, which recurses.
-- Every profile lookup (login, admin checks, vendor checks) is affected —
-- symptoms are hanging or failing sign-ins.
--
-- Fix: use the SECURITY DEFINER helper is_admin() (created in 002), which
-- bypasses RLS and therefore cannot recurse.
-- Idempotent.
-- ============================================================

-- Ensure the helper exists (safe to re-run).
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Replace the recursive policy.
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins manage all profiles" ON profiles
  FOR ALL USING (is_admin());

-- Keep the self-access policies explicit and non-recursive.
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow a user's own profile row to be created (the signup trigger is
-- SECURITY DEFINER, but this covers any client-side upsert path).
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
