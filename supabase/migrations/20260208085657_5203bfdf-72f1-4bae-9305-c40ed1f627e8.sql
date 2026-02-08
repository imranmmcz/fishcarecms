-- Create hero_slides table for dynamic hero slider content
CREATE TABLE public.hero_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  tagline TEXT,
  tagline_icon TEXT DEFAULT 'Sparkles',
  button_text TEXT,
  button_link TEXT DEFAULT '/',
  button_variant TEXT DEFAULT 'primary',
  background_type TEXT DEFAULT 'gradient' CHECK (background_type IN ('gradient', 'image', 'color')),
  background_value TEXT DEFAULT 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 100%)',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Public can read active slides
CREATE POLICY "Anyone can view active hero slides"
ON public.hero_slides
FOR SELECT
USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage hero slides"
ON public.hero_slides
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_hero_slides_updated_at
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default slides
INSERT INTO public.hero_slides (title, subtitle, tagline, tagline_icon, button_text, button_link, button_variant, background_type, background_value, display_order) VALUES
('মাছ চাষের সকল হিসাব এখন হাতের মুঠোয়', 'পুকুরের আয়তন, মাছের মজুদ, খাদ্য ব্যবস্থাপনা থেকে শুরু করে ওষুধ প্রয়োগ এবং খরচ হিসাব - সবকিছু এক প্ল্যাটফর্মে', '🐟 বাংলাদেশের মৎস্য চাষীদের জন্য', 'Sparkles', 'শুরু করুন', '/pond-calculator', 'success', 'gradient', 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)', 1),
('সঠিক পুকুর পরিমাপ করুন', 'আয়তকার, বর্গাকার, ট্রাপিজয়েড বা বৃত্তাকার - যেকোনো আকৃতির পুকুরের আয়তন ও জলধারণ ক্ষমতা নির্ণয় করুন', '📐 পুকুর পরিমাপ', 'Droplets', 'পুকুর পরিমাপ করুন', '/pond-calculator', 'warning', 'gradient', 'linear-gradient(135deg, #14b8a6 0%, #0d9488 50%, #0f766e 100%)', 2),
('সঠিক মাছ মজুদ পরিকল্পনা', 'আপনার পুকুরের আয়তন অনুযায়ী সঠিক সংখ্যক মাছ মজুদ করুন এবং সর্বোচ্চ উৎপাদন নিশ্চিত করুন', '🐟 মাছ মজুদ', 'Fish', 'মাছ মজুদ পরিকল্পনা', '/fish-stocking', 'primary', 'gradient', 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)', 3),
('মানসম্মত পণ্য সংগ্রহ করুন', 'মাছের খাবার, ওষুধ, সরঞ্জাম - সবকিছু এক জায়গায়। সেরা দামে সেরা পণ্য পান', '🛒 মাছ চাষের সরঞ্জাম', 'Package', 'শপে যান', '/shop', 'success', 'gradient', 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)', 4);