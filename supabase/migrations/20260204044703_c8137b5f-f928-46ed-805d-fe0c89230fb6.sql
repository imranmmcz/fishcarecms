-- Create smtp_settings table
CREATE TABLE public.smtp_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  smtp_host VARCHAR(255) NOT NULL DEFAULT 'smtp.gmail.com',
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_user VARCHAR(255) NOT NULL DEFAULT '',
  smtp_password VARCHAR(255) NOT NULL DEFAULT '',
  smtp_from_email VARCHAR(255) NOT NULL DEFAULT '',
  smtp_from_name VARCHAR(255) NOT NULL DEFAULT 'FishCare BD',
  smtp_secure BOOLEAN NOT NULL DEFAULT true,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.smtp_settings ENABLE ROW LEVEL SECURITY;

-- Create policy: Only admins can read smtp settings
CREATE POLICY "Admins can read smtp settings"
ON public.smtp_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create policy: Only admins can update smtp settings
CREATE POLICY "Admins can update smtp settings"
ON public.smtp_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create policy: Only admins can insert smtp settings
CREATE POLICY "Admins can insert smtp settings"
ON public.smtp_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default smtp settings row
INSERT INTO public.smtp_settings (
  smtp_host,
  smtp_port,
  smtp_user,
  smtp_password,
  smtp_from_email,
  smtp_from_name,
  smtp_secure,
  is_enabled
) VALUES (
  'smtp.gmail.com',
  587,
  '',
  '',
  '',
  'FishCare BD',
  true,
  false
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_smtp_settings_updated_at
BEFORE UPDATE ON public.smtp_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();