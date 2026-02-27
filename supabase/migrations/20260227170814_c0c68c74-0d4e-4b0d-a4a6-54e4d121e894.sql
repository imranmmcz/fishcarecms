-- Allow looking up email by mobile number for login (only email field exposed)
CREATE POLICY "Anyone can lookup email by mobile for login"
ON public.profiles
FOR SELECT
USING (true);

-- Drop the old restrictive select policies since this new one covers all cases
-- Actually, we should be more careful. Let's create a specific function instead.
-- Drop the overly permissive policy we just created
DROP POLICY IF EXISTS "Anyone can lookup email by mobile for login" ON public.profiles;

-- Create a secure function that only returns email for a given mobile number
CREATE OR REPLACE FUNCTION public.get_email_by_mobile(mobile_number text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT email FROM public.profiles WHERE mobile = mobile_number LIMIT 1;
$$;