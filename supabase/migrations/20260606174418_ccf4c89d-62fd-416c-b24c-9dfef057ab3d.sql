
-- 1. Hide cost_price on products from anon/authenticated
REVOKE SELECT (cost_price) ON public.products FROM anon, authenticated;

-- 2. Hide cost_price on product_variations
REVOKE SELECT (cost_price) ON public.product_variations FROM anon, authenticated;

-- 3. Hide reviewer email on product_reviews
REVOKE SELECT (user_email) ON public.product_reviews FROM anon, authenticated;

-- 4. Restrict sensitive payment credentials in system_settings
DROP POLICY IF EXISTS "Anyone can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.system_settings;

CREATE POLICY "Public can view non-sensitive settings"
ON public.system_settings
FOR SELECT
TO anon, authenticated
USING (
  setting_key NOT IN (
    'bkash_password',
    'bkash_app_key',
    'bkash_app_secret',
    'nagad_merchant_private_key'
  )
);
