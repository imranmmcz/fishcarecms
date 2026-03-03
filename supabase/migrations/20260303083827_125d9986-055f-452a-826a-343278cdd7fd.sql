
-- 1. Add blocking fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS block_reason text,
ADD COLUMN IF NOT EXISTS blocked_by uuid;

-- 2. Add unique constraint on mobile (non-null only)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_mobile_unique 
ON public.profiles (mobile) WHERE mobile IS NOT NULL AND mobile != '';

-- 3. Registration attempts table for rate limiting
CREATE TABLE IF NOT EXISTS public.registration_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  email text,
  attempted_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.registration_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view registration attempts"
ON public.registration_attempts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert registration attempts"
ON public.registration_attempts FOR INSERT
WITH CHECK (true);

-- Auto-cleanup old attempts (older than 24h)
CREATE INDEX idx_registration_attempts_ip_time 
ON public.registration_attempts (ip_address, attempted_at DESC);

-- 4. User activity logs table
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_type text NOT NULL DEFAULT 'page_view',
  page_path text,
  description text,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all activity logs"
ON public.user_activity_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert activity logs"
ON public.user_activity_logs FOR INSERT
WITH CHECK (true);

CREATE INDEX idx_activity_logs_user_time 
ON public.user_activity_logs (user_id, created_at DESC);

CREATE INDEX idx_activity_logs_type 
ON public.user_activity_logs (activity_type, created_at DESC);

-- 5. Function to check registration rate limit
CREATE OR REPLACE FUNCTION public.check_registration_rate_limit(client_ip text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) < 3
  FROM public.registration_attempts
  WHERE ip_address = client_ip
    AND attempted_at > now() - interval '1 hour';
$$;

-- 6. Function to check if mobile is already used
CREATE OR REPLACE FUNCTION public.is_mobile_available(mobile_number text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE mobile = mobile_number 
    AND mobile IS NOT NULL 
    AND mobile != ''
  );
$$;

-- 7. Function to check if user is blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = check_user_id
    AND is_blocked = true
    AND (blocked_until IS NULL OR blocked_until > now())
  );
$$;
