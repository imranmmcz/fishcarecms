
-- Drop overly permissive insert policy and replace with authenticated-only
DROP POLICY IF EXISTS "Allow system insert backup logs" ON public.backup_logs;

CREATE POLICY "Authenticated users can insert backup logs"
ON public.backup_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
