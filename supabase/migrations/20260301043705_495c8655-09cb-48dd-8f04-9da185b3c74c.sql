
CREATE OR REPLACE FUNCTION public.manage_backup_cron(
  _action text,
  _schedule text DEFAULT '0 2 * * *',
  _backup_scope text DEFAULT 'system'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  _job_name text := 'automatic_system_backup';
  _result jsonb;
  _sql text;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('error', 'Admin access required');
  END IF;

  IF _action = 'create' OR _action = 'update' THEN
    BEGIN
      PERFORM cron.unschedule(_job_name);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    _sql := 'SELECT net.http_post(url:=''https://cozwxamdldjkeeffjvvf.supabase.co/functions/v1/system-backup'', headers:=''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvend4YW1kbGRqa2VlZmZqdnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjAwNDQsImV4cCI6MjA4NzQzNjA0NH0.sT7wCRL_gm9N_LM6JTSwYeReHoheECPXloYIEAkjhu4"}''::jsonb, body:=''{"action": "create_backup", "backup_scope": "system"}''::jsonb) as request_id;';

    PERFORM cron.schedule(_job_name, _schedule, _sql);

    INSERT INTO system_settings (setting_key, setting_value, description)
    VALUES ('backup_cron_schedule', _schedule, 'স্বয়ংক্রিয় ব্যাকআপ শিডিউল')
    ON CONFLICT (setting_key) DO UPDATE SET setting_value = _schedule;

    INSERT INTO system_settings (setting_key, setting_value, description)
    VALUES ('backup_cron_enabled', 'true', 'স্বয়ংক্রিয় ব্যাকআপ সক্রিয়')
    ON CONFLICT (setting_key) DO UPDATE SET setting_value = 'true';

    _result := jsonb_build_object('status', 'scheduled', 'schedule', _schedule, 'job_name', _job_name);

  ELSIF _action = 'disable' THEN
    BEGIN
      PERFORM cron.unschedule(_job_name);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    INSERT INTO system_settings (setting_key, setting_value, description)
    VALUES ('backup_cron_enabled', 'false', 'স্বয়ংক্রিয় ব্যাকআপ সক্রিয়')
    ON CONFLICT (setting_key) DO UPDATE SET setting_value = 'false';

    _result := jsonb_build_object('status', 'disabled', 'job_name', _job_name);

  ELSIF _action = 'status' THEN
    SELECT jsonb_build_object(
      'active', EXISTS(SELECT 1 FROM cron.job WHERE jobname = _job_name),
      'schedule', (SELECT schedule FROM cron.job WHERE jobname = _job_name),
      'job_name', _job_name
    ) INTO _result;

  ELSE
    _result := jsonb_build_object('error', 'Invalid action');
  END IF;

  RETURN _result;
END;
$fn$;
