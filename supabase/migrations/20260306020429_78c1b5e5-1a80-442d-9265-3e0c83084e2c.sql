ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS recommendation_tags text[] DEFAULT '{}'::text[];

COMMENT ON COLUMN public.products.recommendation_tags IS 'Tags for product recommendations: popular_medicine, admin_recommended, calculator_related';
