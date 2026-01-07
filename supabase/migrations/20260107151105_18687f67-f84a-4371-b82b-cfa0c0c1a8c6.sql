-- Drop the public SELECT policy
DROP POLICY IF EXISTS "Anyone can view settings" ON public.system_settings;

-- Create new policy to allow only authenticated users to view settings
CREATE POLICY "Authenticated users can view settings" 
ON public.system_settings 
FOR SELECT 
TO authenticated
USING (true);