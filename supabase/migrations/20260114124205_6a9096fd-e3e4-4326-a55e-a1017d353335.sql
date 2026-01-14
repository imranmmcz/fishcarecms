-- Create page_content table to store editable page sections
CREATE TABLE public.page_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  section_name TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view page content" 
ON public.page_content 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert page content" 
ON public.page_content 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update page content" 
ON public.page_content 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete page content" 
ON public.page_content 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_page_content_updated_at
BEFORE UPDATE ON public.page_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default content for all sections
INSERT INTO public.page_content (section_key, section_name, content, display_order) VALUES
(
  'hero',
  'হিরো সেকশন',
  '{
    "title": "মাছ চাষ ব্যবস্থাপনা সিস্টেম",
    "subtitle": "আধুনিক প্রযুক্তি দিয়ে মাছ চাষ সহজ করুন",
    "ctaText": "শুরু করুন",
    "ctaLink": "/auth",
    "backgroundImage": ""
  }'::jsonb,
  1
),
(
  'modules',
  'মডিউল/ফিচার কার্ড',
  '{
    "sectionTitle": "আমাদের সেবাসমূহ",
    "sectionSubtitle": "মাছ চাষে সফলতার জন্য প্রয়োজনীয় সকল টুলস",
    "items": [
      {"title": "পুকুর ক্যালকুলেটর", "description": "পুকুরের আয়তন ও পানির পরিমাণ হিসাব করুন", "icon": "Calculator", "link": "/pond-calculator", "isActive": true},
      {"title": "মাছ মজুদ", "description": "সঠিক মাছ মজুদ পরিকল্পনা করুন", "icon": "Fish", "link": "/stocking-density", "isActive": true},
      {"title": "খাদ্য ব্যবস্থাপনা", "description": "মাছের খাদ্য পরিমাণ নির্ধারণ করুন", "icon": "Wheat", "link": "/feed-management", "isActive": true},
      {"title": "পানির গুণগত মান", "description": "পুকুরের পানির মান পরীক্ষা করুন", "icon": "Droplets", "link": "/water-quality", "isActive": true},
      {"title": "রোগ নির্ণয়", "description": "মাছের রোগ শনাক্ত ও চিকিৎসা জানুন", "icon": "Stethoscope", "link": "/fish-advice", "isActive": true},
      {"title": "খরচ হিসাব", "description": "লাভ-ক্ষতি হিসাব করুন", "icon": "DollarSign", "link": "/cost-calculator", "isActive": true}
    ]
  }'::jsonb,
  2
),
(
  'benefits',
  'সুবিধা/কেন ব্যবহার করবেন',
  '{
    "sectionTitle": "কেন এই সিস্টেম ব্যবহার করবেন?",
    "items": [
      {"title": "সহজ ব্যবহার", "description": "কোনো প্রশিক্ষণ ছাড়াই ব্যবহার করুন", "icon": "CheckCircle"},
      {"title": "সম্পূর্ণ বিনামূল্যে", "description": "সকল ফিচার বিনামূল্যে ব্যবহার করুন", "icon": "Gift"},
      {"title": "বাংলা ভাষায়", "description": "সম্পূর্ণ বাংলায় তৈরি", "icon": "Globe"},
      {"title": "মোবাইল ফ্রেন্ডলি", "description": "মোবাইলে সহজে ব্যবহার করুন", "icon": "Smartphone"}
    ]
  }'::jsonb,
  3
),
(
  'faq',
  'প্রশ্নোত্তর (FAQ)',
  '{
    "sectionTitle": "সচরাচর জিজ্ঞাসা",
    "items": [
      {"question": "এই সিস্টেম কি বিনামূল্যে?", "answer": "হ্যাঁ, সকল ফিচার সম্পূর্ণ বিনামূল্যে।"},
      {"question": "কিভাবে শুরু করবো?", "answer": "রেজিস্ট্রেশন করে লগইন করুন এবং ড্যাশবোর্ড থেকে শুরু করুন।"},
      {"question": "ডাটা কি নিরাপদ?", "answer": "হ্যাঁ, আপনার সকল ডাটা এনক্রিপ্টেড এবং সুরক্ষিত।"}
    ]
  }'::jsonb,
  4
),
(
  'social_proof',
  'সোশ্যাল প্রুফ/পরিসংখ্যান',
  '{
    "sectionTitle": "আমাদের অর্জন",
    "stats": [
      {"value": "১০০০+", "label": "সক্রিয় ব্যবহারকারী"},
      {"value": "৫০০+", "label": "পুকুর নিবন্ধিত"},
      {"value": "৯৫%", "label": "সন্তুষ্টির হার"}
    ]
  }'::jsonb,
  5
),
(
  'cta',
  'কল টু অ্যাকশন',
  '{
    "title": "আজই শুরু করুন",
    "subtitle": "মাছ চাষে সফলতা অর্জন করুন",
    "buttonText": "বিনামূল্যে রেজিস্ট্রেশন করুন",
    "buttonLink": "/auth"
  }'::jsonb,
  6
);