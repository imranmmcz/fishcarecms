
CREATE OR REPLACE FUNCTION public.notify_admins_on_critical_security_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  should_notify BOOLEAN := false;
  title_en TEXT;
  title_bn TEXT;
  msg_en TEXT;
  msg_bn TEXT;
BEGIN
  -- Notify on critical severity, or on admin-route denials (privilege escalation attempts)
  IF NEW.severity = 'critical'
     OR NEW.event_type IN ('admin_route_denied', 'rls_policy_denied') AND NEW.severity = 'warning'
  THEN
    should_notify := true;
  END IF;

  IF NOT should_notify THEN
    RETURN NEW;
  END IF;

  title_en := 'Security Alert: ' || NEW.event_type;
  title_bn := 'নিরাপত্তা সতর্কতা: ' || NEW.event_type;
  msg_en := 'A ' || NEW.severity || ' security event was logged'
            || COALESCE(' on ' || NEW.resource_table, '')
            || COALESCE(' (path: ' || NEW.request_path || ')', '')
            || '.';
  msg_bn := NEW.severity || ' মাত্রার একটি নিরাপত্তা ইভেন্ট রেকর্ড হয়েছে'
            || COALESCE(' (টেবিল: ' || NEW.resource_table || ')', '')
            || COALESCE(' (পাথ: ' || NEW.request_path || ')', '')
            || '।';

  INSERT INTO public.notifications (user_id, title, title_bn, message, message_bn, type, reference_id, reference_type)
  SELECT ur.user_id, title_en, title_bn, msg_en, msg_bn, 'security_alert', NEW.id::text, 'security_audit_log'
  FROM public.user_roles ur
  WHERE ur.role = 'admin'
    AND ur.user_id <> COALESCE(NEW.user_id, '00000000-0000-0000-0000-000000000000'::uuid);

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_admins_on_critical_security_event() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_admins_security_event ON public.security_audit_logs;
CREATE TRIGGER trg_notify_admins_security_event
AFTER INSERT ON public.security_audit_logs
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_critical_security_event();
