
GRANT SELECT (id, name, description, price, discount_percentage, category, image_url, external_link, created_at, updated_at, stock_quantity, sku, reorder_level, brand_id, company_id, unit, focus_keyword, meta_title, meta_description, image_alt_text, seo_url, weight_kg, recommendation_tags) ON public.products TO anon;
GRANT SELECT (id, name, description, price, discount_percentage, category, image_url, external_link, created_at, updated_at, stock_quantity, sku, reorder_level, brand_id, company_id, unit, focus_keyword, meta_title, meta_description, image_alt_text, seo_url, weight_kg, recommendation_tags) ON public.products TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

GRANT SELECT (id, product_id, variation_name, unit, weight_value, price, stock_quantity, sku, is_active, created_at, updated_at) ON public.product_variations TO anon;
GRANT SELECT (id, product_id, variation_name, unit, weight_value, price, stock_quantity, sku, is_active, created_at, updated_at) ON public.product_variations TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_variations TO authenticated;
GRANT ALL ON public.product_variations TO service_role;
