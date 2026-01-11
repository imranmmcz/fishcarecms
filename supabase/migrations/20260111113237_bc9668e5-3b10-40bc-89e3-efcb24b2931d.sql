
-- Create ad_settings table for Google AdSense management
CREATE TABLE public.ad_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ad_client_id TEXT,
    header_ad_enabled BOOLEAN DEFAULT false,
    header_ad_slot TEXT,
    sidebar_ad_enabled BOOLEAN DEFAULT false,
    sidebar_ad_slot TEXT,
    footer_ad_enabled BOOLEAN DEFAULT false,
    footer_ad_slot TEXT,
    in_article_ad_enabled BOOLEAN DEFAULT false,
    in_article_ad_slot TEXT,
    between_modules_ad_enabled BOOLEAN DEFAULT false,
    between_modules_ad_slot TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read ad settings (needed to display ads)
CREATE POLICY "Anyone can view ad settings"
ON public.ad_settings
FOR SELECT
USING (true);

-- Only admins can manage ad settings
CREATE POLICY "Admins can insert ad settings"
ON public.ad_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update ad settings"
ON public.ad_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete ad settings"
ON public.ad_settings
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_ad_settings_updated_at
BEFORE UPDATE ON public.ad_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings row
INSERT INTO public.ad_settings (id) VALUES (gen_random_uuid());
