
-- Create custom_pages table
CREATE TABLE public.custom_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_bn TEXT,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  content_type TEXT NOT NULL DEFAULT 'rich', -- 'rich' or 'html'
  meta_title TEXT,
  meta_description TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- 'published' or 'draft'
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage custom pages"
  ON public.custom_pages
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view published pages
CREATE POLICY "Anyone can view published pages"
  ON public.custom_pages
  FOR SELECT
  USING (status = 'published');

-- Trigger to update updated_at
CREATE TRIGGER update_custom_pages_updated_at
  BEFORE UPDATE ON public.custom_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
