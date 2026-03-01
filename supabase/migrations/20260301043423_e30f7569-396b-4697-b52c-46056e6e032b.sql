
-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create function to manage backup cron job
CREATE OR REPLACE FUNCTION public.manage_backup_cron(
  _action text,
  _schedule text DEFAULT '0 2 * * *',
  _backup_scope text DEFAULT 'system'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _job_name text := 'automatic_system_backup';
  _result jsonb;
  _supabase_url text;
  _anon_key text;
BEGIN
  -- Only admins can manage cron
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('error', 'Admin access required');
  END IF;

  -- Get Supabase URL and anon key from vault or hardcode
  _supabase_url := current_setting('app.settings.supabase_url', true);
  _anon_key := current_setting('app.settings.supabase_anon_key', true);

  IF _action = 'create' OR _action = 'update' THEN
    -- Remove existing job if any
    PERFORM cron.unschedule(_job_name);
    
    -- Create new cron job
    PERFORM cron.schedule(
      _job_name,
      _schedule,
      format(
        'SELECT net.http_post(url:=''%s/functions/v1/system-backup'', headers:=''{"Content-Type": "application/json", "Authorization": "Bearer %s"}''::jsonb, body:=''{"action": "create_backup", "backup_scope": "%s"}''::jsonb) as request_id;',
        _supabase_url,
        _anon_key,
        _backup_scope
      )
    );

    -- Save schedule to system_settings
    INSERT INTO system_settings (setting_key, setting_value, description)
    VALUES ('backup_cron_schedule', _schedule, 'স্বয়ংক্রিয় ব্যাকআপ শিডিউল')
    ON CONFLICT (setting_key) DO UPDATE SET setting_value = _schedule;

    INSERT INTO system_settings (setting_key, setting_value, description)
    VALUES ('backup_cron_enabled', 'true', 'স্বয়ংক্রিয় ব্যাকআপ সক্রিয়')
    ON CONFLICT (setting_key) DO UPDATE SET setting_value = 'true';

    _result := jsonb_build_object('status', 'scheduled', 'schedule', _schedule, 'job_name', _job_name);

  ELSIF _action = 'disable' THEN
    -- Remove cron job
    BEGIN
      PERFORM cron.unschedule(_job_name);
    EXCEPTION WHEN OTHERS THEN
      -- Job might not exist
      NULL;
    END;

    UPDATE system_settings SET setting_value = 'false' WHERE setting_key = 'backup_cron_enabled';

    _result := jsonb_build_object('status', 'disabled', 'job_name', _job_name);

  ELSIF _action = 'status' THEN
    SELECT jsonb_build_object(
      'active', EXISTS(SELECT 1 FROM cron.job WHERE jobname = _job_name),
      'schedule', (SELECT schedule FROM cron.job WHERE jobname = _job_name),
      'job_name', _job_name
    ) INTO _result;

  ELSE
    _result := jsonb_build_object('error', 'Invalid action. Use: create, update, disable, status');
  END IF;

  RETURN _result;
END;
$$;
