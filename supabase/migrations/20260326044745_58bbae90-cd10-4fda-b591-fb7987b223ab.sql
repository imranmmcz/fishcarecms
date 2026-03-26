
-- Login attempts tracking table
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  success boolean DEFAULT false,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_created ON public.login_attempts (email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_created ON public.login_attempts (ip_address, created_at DESC);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can read login attempts
CREATE POLICY "Admins can view login attempts"
ON public.login_attempts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can insert (for tracking)
CREATE POLICY "Anyone can insert login attempts"
ON public.login_attempts FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Function to check if login is rate limited
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(check_email text, check_ip text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  failed_count integer;
  last_attempt timestamptz;
  lockout_until timestamptz;
  max_attempts integer := 5;
  lockout_minutes integer := 15;
BEGIN
  -- Count failed attempts in last lockout window
  SELECT COUNT(*), MAX(created_at) INTO failed_count, last_attempt
  FROM public.login_attempts
  WHERE email = lower(check_email)
    AND success = false
    AND created_at > now() - (lockout_minutes || ' minutes')::interval;

  IF failed_count >= max_attempts THEN
    lockout_until := last_attempt + (lockout_minutes || ' minutes')::interval;
    IF lockout_until > now() THEN
      RETURN jsonb_build_object(
        'locked', true,
        'remaining_minutes', CEIL(EXTRACT(EPOCH FROM (lockout_until - now())) / 60),
        'failed_attempts', failed_count
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'locked', false,
    'failed_attempts', failed_count,
    'attempts_remaining', max_attempts - failed_count
  );
END;
$$;

-- Auto-cleanup old login attempts (keep 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.login_attempts WHERE created_at < now() - interval '30 days';
$$;
