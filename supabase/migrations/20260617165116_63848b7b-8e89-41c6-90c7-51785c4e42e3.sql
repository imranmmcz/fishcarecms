
-- 1) products: hide cost_price from anonymous
REVOKE SELECT ON public.products FROM anon;
GRANT SELECT (
  id, name, description, price, discount_percentage, category, image_url,
  external_link, created_at, updated_at, stock_quantity, sku, reorder_level,
  brand_id, company_id, unit, focus_keyword, meta_title, meta_description,
  image_alt_text, seo_url, weight_kg, recommendation_tags
) ON public.products TO anon;

-- 2) product_variations: hide cost_price from anonymous
REVOKE SELECT ON public.product_variations FROM anon;
GRANT SELECT (
  id, product_id, variation_name, unit, weight_value, price,
  stock_quantity, sku, is_active, created_at, updated_at
) ON public.product_variations TO anon;

-- 3) product_reviews: hide user_email from anon and authenticated.
-- Admins read emails through public.get_review_emails() (SECURITY DEFINER).
REVOKE SELECT ON public.product_reviews FROM anon, authenticated;
GRANT SELECT (
  id, product_id, user_id, user_name, rating, title, comment,
  is_verified_purchase, is_approved, helpful_count, created_at, updated_at
) ON public.product_reviews TO anon, authenticated;

-- 4) security_audit_logs: block anonymous inserts
DROP POLICY IF EXISTS "Anyone can insert security events" ON public.security_audit_logs;
CREATE POLICY "Authenticated can insert security events"
ON public.security_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);
