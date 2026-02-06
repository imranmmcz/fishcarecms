
-- Create categories table for dynamic product categories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_bn TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active categories" 
ON public.categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage categories" 
ON public.categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default categories based on existing product categories
INSERT INTO public.categories (name, name_bn, slug, display_order) VALUES
('medicine', 'ওষুধ', 'medicine', 1),
('feed', 'খাদ্য', 'feed', 2),
('equipment', 'সরঞ্জাম', 'equipment', 3),
('fish', 'মাছ', 'fish', 4),
('chemicals', 'কেমিক্যাল', 'chemicals', 5),
('probiotics', 'প্রোবায়োটিক', 'probiotics', 6),
('testing', 'টেস্টিং', 'testing', 7),
('accessories', 'এক্সেসরিজ', 'accessories', 8);

-- Create trigger for updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
