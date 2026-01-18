-- Fix: Restrict client data access to creators, assigned barbers, and admins
-- Drop the existing permissive SELECT policy
DROP POLICY IF EXISTS "Users can view clients in their organization" ON public.clients;

-- Create a more restrictive policy that limits access to:
-- 1. Admins can see all clients in their organization
-- 2. Barbers can only see clients they created OR clients with appointments assigned to them
CREATE POLICY "Users can view authorized clients"
ON public.clients
FOR SELECT
USING (
  organization_id = get_user_organization_id() AND (
    -- Admins can see all clients
    is_admin()
    -- Users can see clients they created
    OR created_by_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    -- Barbers can see clients they have appointments with
    OR id IN (
      SELECT client_id FROM appointments 
      WHERE barber_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  )
);