
-- Create alert_type enum
CREATE TYPE public.alert_type AS ENUM (
  'feed_reminder', 'medicine_reminder', 'water_check', 'pond_cleaning',
  'fish_sampling', 'harvest_reminder', 'weather_risk', 'disease_outbreak',
  'government_advisory', 'custom'
);

-- Create alert_status enum
CREATE TYPE public.alert_status AS ENUM ('pending', 'sent', 'completed', 'dismissed', 'overdue');

-- Alerts table
CREATE TABLE public.farming_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pond_id UUID REFERENCES public.farmer_ponds(id) ON DELETE SET NULL,
  pond_name TEXT DEFAULT '',
  alert_type alert_type NOT NULL DEFAULT 'custom',
  title TEXT NOT NULL,
  title_bn TEXT,
  message TEXT NOT NULL,
  message_bn TEXT,
  alert_date DATE NOT NULL DEFAULT CURRENT_DATE,
  alert_time TIME DEFAULT '08:00',
  is_recurring BOOLEAN DEFAULT false,
  recurrence_interval TEXT DEFAULT 'daily',
  status alert_status DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  is_global BOOLEAN DEFAULT false,
  fish_species TEXT,
  channels TEXT[] DEFAULT '{in_app}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Alert logs table
CREATE TABLE public.alert_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.farming_alerts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sent_channel TEXT NOT NULL DEFAULT 'in_app',
  status TEXT NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Alert settings per farmer
CREATE TABLE public.alert_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feed_reminder_enabled BOOLEAN DEFAULT true,
  feed_reminder_times TEXT[] DEFAULT '{08:00,12:00,17:00}',
  medicine_reminder_enabled BOOLEAN DEFAULT true,
  water_check_enabled BOOLEAN DEFAULT true,
  water_check_interval_days INTEGER DEFAULT 7,
  sampling_reminder_enabled BOOLEAN DEFAULT true,
  sampling_interval_days INTEGER DEFAULT 30,
  harvest_reminder_days_before INTEGER DEFAULT 10,
  channels TEXT[] DEFAULT '{in_app}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.farming_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_settings ENABLE ROW LEVEL SECURITY;

-- RLS for farming_alerts
CREATE POLICY "Users can view own and global alerts" ON public.farming_alerts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_global = true);

CREATE POLICY "Users can insert own alerts" ON public.farming_alerts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_global = false);

CREATE POLICY "Users can update own alerts" ON public.farming_alerts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts" ON public.farming_alerts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND is_global = false);

CREATE POLICY "Admins can manage all alerts" ON public.farming_alerts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS for alert_logs
CREATE POLICY "Users can view own alert logs" ON public.alert_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert alert logs" ON public.alert_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage all logs" ON public.alert_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS for alert_settings
CREATE POLICY "Users can manage own settings" ON public.alert_settings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all settings" ON public.alert_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_farming_alerts_updated_at
  BEFORE UPDATE ON public.farming_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_settings_updated_at
  BEFORE UPDATE ON public.alert_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.farming_alerts;
