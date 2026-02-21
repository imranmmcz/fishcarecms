
-- Add SEO fields to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS focus_keyword text,
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS image_alt_text text,
  ADD COLUMN IF NOT EXISTS seo_url text;
