
-- 1) Hide sensitive columns at the column-grant level
REVOKE SELECT (user_email) ON public.product_reviews FROM anon, authenticated;
REVOKE SELECT (cost_price) ON public.products FROM anon, authenticated;
REVOKE SELECT (cost_price) ON public.product_variations FROM anon, authenticated;

-- 2) Notification templates: admin-only reads
DROP POLICY IF EXISTS "Anyone can view active templates" ON public.notification_templates;
CREATE POLICY "Admins can view templates"
  ON public.notification_templates
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) Harden system_settings public SELECT to exclude all sensitive prefixes/suffixes
DROP POLICY IF EXISTS "Public can view non-sensitive settings" ON public.system_settings;
CREATE POLICY "Public can view non-sensitive settings"
  ON public.system_settings
  FOR SELECT
  USING (
    setting_key NOT ILIKE '%secret%'
    AND setting_key NOT ILIKE '%password%'
    AND setting_key NOT ILIKE '%api_key%'
    AND setting_key NOT ILIKE '%private_key%'
    AND setting_key NOT ILIKE '%access_token%'
    AND setting_key NOT ILIKE '%auth_token%'
    AND setting_key NOT ILIKE '%app_key%'
    AND setting_key NOT ILIKE 'bkash_%'
    AND setting_key NOT ILIKE 'nagad_%'
    AND setting_key NOT ILIKE 'sms_%'
    AND setting_key NOT ILIKE 'whatsapp_%'
    AND setting_key NOT ILIKE 'smtp_%'
    AND setting_key NOT ILIKE '%pg_public_key%'
  );

-- 4) Admin-only RPCs to read the now-restricted columns
CREATE OR REPLACE FUNCTION public.get_products_cost_map()
RETURNS TABLE(id uuid, cost_price numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.cost_price
  FROM public.products p
  WHERE public.has_role(auth.uid(), 'admin');
$$;

CREATE OR REPLACE FUNCTION public.get_product_variations_cost_map()
RETURNS TABLE(id uuid, cost_price numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.id, v.cost_price
  FROM public.product_variations v
  WHERE public.has_role(auth.uid(), 'admin');
$$;

CREATE OR REPLACE FUNCTION public.get_review_emails()
RETURNS TABLE(id uuid, user_email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.user_email
  FROM public.product_reviews r
  WHERE public.has_role(auth.uid(), 'admin');
$$;

REVOKE ALL ON FUNCTION public.get_products_cost_map() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_product_variations_cost_map() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_review_emails() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_products_cost_map() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_variations_cost_map() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_review_emails() TO authenticated;
