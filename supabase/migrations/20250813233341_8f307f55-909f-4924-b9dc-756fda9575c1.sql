-- Remove the overly permissive policy that allows anonymous users to view all participations
DROP POLICY IF EXISTS "Participants can view their own participation" ON public.participations;

-- Keep only the secure policy for campaign owners to view their campaign participations
-- The remaining policy "Users can view participations of their own campaigns" is secure and should remain

-- Add a comment explaining the security fix
COMMENT ON TABLE public.participations IS 'Personal data is protected - only campaign owners can view participations of their campaigns';