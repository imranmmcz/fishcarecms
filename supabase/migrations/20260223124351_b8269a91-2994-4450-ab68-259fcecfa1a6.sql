
-- Create WhatsApp settings table
CREATE TABLE public.whatsapp_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  access_token TEXT DEFAULT '',
  phone_number_id TEXT DEFAULT '',
  business_account_id TEXT DEFAULT '',
  api_version TEXT DEFAULT 'v21.0',
  -- Notification toggles
  order_confirmation_enabled BOOLEAN DEFAULT true,
  shipping_notification_enabled BOOLEAN DEFAULT true,
  delivery_update_enabled BOOLEAN DEFAULT true,
  -- Template names (Meta approved templates)
  order_confirmation_template TEXT DEFAULT 'order_confirmation',
  shipping_template TEXT DEFAULT 'shipping_notification',
  delivery_template TEXT DEFAULT 'delivery_update',
  -- Language
  template_language TEXT DEFAULT 'bn',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can manage whatsapp settings"
  ON public.whatsapp_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view whatsapp settings"
  ON public.whatsapp_settings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- WhatsApp message logs
CREATE TABLE public.whatsapp_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT,
  recipient_phone TEXT NOT NULL,
  message_type TEXT NOT NULL,
  template_name TEXT,
  whatsapp_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view whatsapp logs"
  ON public.whatsapp_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Allow system insert whatsapp logs"
  ON public.whatsapp_logs FOR INSERT
  WITH CHECK (true);
