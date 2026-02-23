
-- Create fish_diseases table
CREATE TABLE public.fish_diseases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'bacterial',
  affected_fish TEXT[] NOT NULL DEFAULT '{}',
  season TEXT[] NOT NULL DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'medium',
  symptoms TEXT[] NOT NULL DEFAULT '{}',
  causes TEXT[] NOT NULL DEFAULT '{}',
  prevention TEXT[] NOT NULL DEFAULT '{}',
  treatment JSONB NOT NULL DEFAULT '[]'::jsonb,
  image_url TEXT,
  image_description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fish_diseases ENABLE ROW LEVEL SECURITY;

-- Anyone can view active diseases
CREATE POLICY "Anyone can view active diseases"
ON public.fish_diseases FOR SELECT
USING (is_active = true);

-- Admins can manage diseases
CREATE POLICY "Admins can manage diseases"
ON public.fish_diseases FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_fish_diseases_updated_at
BEFORE UPDATE ON public.fish_diseases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
