
-- Hide cost_price column from public roles
REVOKE SELECT (cost_price) ON public.products FROM anon, authenticated;
REVOKE SELECT (cost_price) ON public.product_variations FROM anon, authenticated;

-- Hide user_email column on product_reviews from public roles
REVOKE SELECT (user_email) ON public.product_reviews FROM anon, authenticated;

-- Companies: explicit admin-only SELECT
DROP POLICY IF EXISTS "Admins can view companies" ON public.companies;
CREATE POLICY "Admins can view companies" ON public.companies FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- system_settings: allow anon SELECT
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='system_settings') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view system settings" ON public.system_settings';
    EXECUTE 'CREATE POLICY "Anyone can view system settings" ON public.system_settings FOR SELECT TO anon, authenticated USING (true)';
    EXECUTE 'GRANT SELECT ON public.system_settings TO anon';
  END IF;
END $$;
