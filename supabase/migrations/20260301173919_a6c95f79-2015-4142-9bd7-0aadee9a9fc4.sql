
-- Create SMS settings table
CREATE TABLE public.sms_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  provider TEXT NOT NULL DEFAULT 'bulksmsbd',
  api_key TEXT DEFAULT '',
  api_url TEXT DEFAULT '',
  sender_id TEXT DEFAULT '',
  order_confirmation_enabled BOOLEAN DEFAULT false,
  order_status_update_enabled BOOLEAN DEFAULT false,
  due_reminder_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage
CREATE POLICY "Admins can manage sms settings"
  ON public.sms_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view sms settings"
  ON public.sms_settings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default row
INSERT INTO public.sms_settings (provider, api_key, api_url, sender_id) 
VALUES ('bulksmsbd', '', 'https://bulksmsbd.net/api/smsapi', '');

-- Create SMS logs table
CREATE TABLE public.sms_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT DEFAULT 'bulksmsbd',
  api_response TEXT,
  error_message TEXT,
  message_type TEXT NOT NULL DEFAULT 'general',
  order_number TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sms logs"
  ON public.sms_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert sms logs"
  ON public.sms_logs FOR INSERT
  WITH CHECK (true);
