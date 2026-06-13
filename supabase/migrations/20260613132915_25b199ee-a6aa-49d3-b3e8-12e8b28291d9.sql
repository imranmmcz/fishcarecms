
CREATE TABLE IF NOT EXISTS public.admin_notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT false,
  email_address TEXT,
  event_types TEXT[] NOT NULL DEFAULT ARRAY['critical','admin_route_denied','rls_policy_denied']::text[],
  min_severity TEXT NOT NULL DEFAULT 'warning',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_notification_preferences TO authenticated;
GRANT ALL ON public.admin_notification_preferences TO service_role;

ALTER TABLE public.admin_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage own preferences"
ON public.admin_notification_preferences
FOR ALL
TO authenticated
USING (auth.uid() = user_id AND public.has_role(auth.uid(),'admin'))
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins can view all preferences"
ON public.admin_notification_preferences
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_admin_notif_prefs_updated_at
BEFORE UPDATE ON public.admin_notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update the trigger fn to respect preferences
CREATE OR REPLACE FUNCTION public.notify_admins_on_critical_security_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  should_notify BOOLEAN := false;
  title_en TEXT;
  title_bn TEXT;
  msg_en TEXT;
  msg_bn TEXT;
  sev_rank INT;
BEGIN
  IF NEW.severity = 'critical'
     OR (NEW.event_type IN ('admin_route_denied', 'rls_policy_denied') AND NEW.severity = 'warning')
  THEN
    should_notify := true;
  END IF;
  IF NOT should_notify THEN RETURN NEW; END IF;

  sev_rank := CASE NEW.severity WHEN 'info' THEN 1 WHEN 'warning' THEN 2 WHEN 'critical' THEN 3 ELSE 0 END;

  title_en := 'Security Alert: ' || NEW.event_type;
  title_bn := 'নিরাপত্তা সতর্কতা: ' || NEW.event_type;
  msg_en := 'A ' || NEW.severity || ' security event was logged'
            || COALESCE(' on ' || NEW.resource_table, '')
            || COALESCE(' (path: ' || NEW.request_path || ')', '') || '.';
  msg_bn := NEW.severity || ' মাত্রার একটি নিরাপত্তা ইভেন্ট রেকর্ড হয়েছে'
            || COALESCE(' (টেবিল: ' || NEW.resource_table || ')', '')
            || COALESCE(' (পাথ: ' || NEW.request_path || ')', '') || '।';

  INSERT INTO public.notifications (user_id, title, title_bn, message, message_bn, type, reference_id, reference_type)
  SELECT ur.user_id, title_en, title_bn, msg_en, msg_bn, 'security_alert', NEW.id::text, 'security_audit_log'
  FROM public.user_roles ur
  LEFT JOIN public.admin_notification_preferences p ON p.user_id = ur.user_id
  WHERE ur.role = 'admin'
    AND ur.user_id <> COALESCE(NEW.user_id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND COALESCE(p.in_app_enabled, true) = true
    AND (
      p.event_types IS NULL
      OR NEW.event_type = ANY(p.event_types)
      OR 'all' = ANY(p.event_types)
    )
    AND (
      CASE COALESCE(p.min_severity,'warning')
        WHEN 'info' THEN 1 WHEN 'warning' THEN 2 WHEN 'critical' THEN 3 ELSE 2
      END
    ) <= sev_rank;

  RETURN NEW;
END;
$function$;
