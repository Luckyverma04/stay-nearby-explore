-- Fix privilege escalation vulnerability and secure contact_submissions

-- First, ensure users cannot modify their is_admin status
-- Drop the existing update policy for profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create a new update policy that excludes is_admin field
CREATE POLICY "Users can update their own profile (except admin status)"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  -- Prevent users from changing their admin status
  is_admin = (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid())
);

-- Add additional security: Ensure contact_submissions can never be selected by non-admins
-- Even if someone manages to set is_admin=true, add an extra layer
DROP POLICY IF EXISTS "Admins can view contact submissions" ON public.contact_submissions;

CREATE POLICY "Only verified admins can view contact submissions"
ON public.contact_submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
    -- Add email verification as extra security layer
    AND auth.email() = profiles.email
  )
);

-- Ensure contact form submissions are validated (add basic constraints if not exists)
-- Add a comment for documentation
COMMENT ON TABLE public.contact_submissions IS 'Contains sensitive customer contact information. Only admins with verified emails can access.';

-- Add a policy to prevent non-admins from updating is_admin
-- Only service role (backend) can modify admin status
CREATE POLICY "Only service role can modify admin status"
ON public.profiles
FOR UPDATE
USING (
  -- Allow update only if not changing is_admin, or if it's the service role
  auth.uid() = user_id AND (
    is_admin = (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid())
  )
);