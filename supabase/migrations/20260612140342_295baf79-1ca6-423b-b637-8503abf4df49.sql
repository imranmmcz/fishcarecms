
CREATE TABLE public.security_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  user_id UUID,
  user_role TEXT,
  resource_table TEXT,
  policy_name TEXT,
  action TEXT,
  request_path TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.security_audit_logs TO authenticated;
GRANT INSERT ON public.security_audit_logs TO anon;
GRANT ALL ON public.security_audit_logs TO service_role;

ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view security logs"
ON public.security_audit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert security events"
ON public.security_audit_logs FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins delete security logs"
ON public.security_audit_logs FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_security_audit_logs_created_at ON public.security_audit_logs (created_at DESC);
CREATE INDEX idx_security_audit_logs_severity ON public.security_audit_logs (severity);
CREATE INDEX idx_security_audit_logs_event_type ON public.security_audit_logs (event_type);

CREATE OR REPLACE FUNCTION public.log_security_event(
  _event_type TEXT,
  _severity TEXT DEFAULT 'info',
  _resource_table TEXT DEFAULT NULL,
  _policy_name TEXT DEFAULT NULL,
  _action TEXT DEFAULT NULL,
  _request_path TEXT DEFAULT NULL,
  _details JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id UUID;
  _role TEXT;
BEGIN
  SELECT role::text INTO _role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
  INSERT INTO public.security_audit_logs (
    event_type, severity, user_id, user_role, resource_table,
    policy_name, action, request_path, details
  ) VALUES (
    _event_type,
    COALESCE(_severity, 'info'),
    auth.uid(),
    _role,
    _resource_table,
    _policy_name,
    _action,
    _request_path,
    COALESCE(_details, '{}'::jsonb)
  ) RETURNING id INTO _id;
  RETURN _id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_security_event(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_security_event(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated, service_role;
