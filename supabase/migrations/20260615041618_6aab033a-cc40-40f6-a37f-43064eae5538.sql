
-- 1. Hide cost_price on products from anon + authenticated (admins use get_products_cost_map RPC)
REVOKE SELECT (cost_price) ON public.products FROM anon, authenticated;

-- 2. Hide cost_price on product_variations from anon + authenticated (admins use get_product_variations_cost_map RPC)
REVOKE SELECT (cost_price) ON public.product_variations FROM anon, authenticated;

-- 3. Hide user_email on product_reviews from anon + authenticated (admins use get_review_emails RPC)
REVOKE SELECT (user_email) ON public.product_reviews FROM anon, authenticated;

-- 4. Partner referral codes: drop the public SELECT policy that exposed commission_* fields
DROP POLICY IF EXISTS "Public can read active codes" ON public.partner_referral_codes;

-- Public-safe validator: returns ONLY non-sensitive fields needed at checkout (no commission_*)
CREATE OR REPLACE FUNCTION public.validate_referral_code(p_code text)
RETURNS TABLE (
  id uuid,
  code text,
  discount_type text,
  discount_value numeric,
  usage_limit integer,
  used_count integer,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean,
  partner_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, code, discount_type, discount_value, usage_limit, used_count,
         valid_from, valid_until, is_active, partner_id
  FROM public.partner_referral_codes
  WHERE upper(code) = upper(p_code)
    AND is_active = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.validate_referral_code(text) TO anon, authenticated;
