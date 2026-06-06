
-- 1. Add 'partner' to app_role enum (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'partner' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'partner';
  END IF;
END $$;

-- 2. partners table
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  full_name TEXT NOT NULL,
  father_name TEXT,
  mother_name TEXT,
  date_of_birth DATE,
  nid_number TEXT,
  mobile TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  district TEXT,
  upazila TEXT,
  village TEXT,
  profile_photo_url TEXT,
  nid_front_url TEXT,
  nid_back_url TEXT,
  company_name TEXT,
  company_address TEXT,
  bank_name TEXT,
  account_name TEXT,
  account_number TEXT,
  branch TEXT,
  routing_number TEXT,
  bkash_number TEXT,
  nagad_number TEXT,
  rocket_number TEXT,
  experience TEXT,
  notes TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners view own row" ON public.partners FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own partner application" ON public.partners FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Partners update own row" ON public.partners FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete partners" ON public.partners FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_partners_updated_at BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. partner_referral_codes
CREATE TABLE IF NOT EXISTS public.partner_referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- percentage | fixed | free_shipping
  discount_value NUMERIC NOT NULL DEFAULT 0,
  commission_type TEXT NOT NULL DEFAULT 'percentage', -- percentage | fixed
  commission_value NUMERIC NOT NULL DEFAULT 0,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.partner_referral_codes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_referral_codes TO authenticated;
GRANT ALL ON public.partner_referral_codes TO service_role;
ALTER TABLE public.partner_referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active codes" ON public.partner_referral_codes FOR SELECT
  USING (is_active = true);
CREATE POLICY "Partners read own codes" ON public.partner_referral_codes FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
         OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage codes" ON public.partner_referral_codes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_partner_codes_updated_at BEFORE UPDATE ON public.partner_referral_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. partner_referral_clicks
CREATE TABLE IF NOT EXISTS public.partner_referral_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  landing_url TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.partner_referral_clicks TO anon, authenticated;
GRANT SELECT ON public.partner_referral_clicks TO authenticated;
GRANT ALL ON public.partner_referral_clicks TO service_role;
ALTER TABLE public.partner_referral_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log click" ON public.partner_referral_clicks FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Partners read own clicks" ON public.partner_referral_clicks FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
         OR public.has_role(auth.uid(), 'admin'));

-- 5. partner_commissions
CREATE TABLE IF NOT EXISTS public.partner_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  code_id UUID REFERENCES public.partner_referral_codes(id) ON DELETE SET NULL,
  code_used TEXT NOT NULL,
  order_id UUID NOT NULL UNIQUE,
  order_subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  commissionable_amount NUMERIC NOT NULL DEFAULT 0,
  commission_type TEXT NOT NULL,
  commission_value NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | paid | cancelled
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_commissions TO authenticated;
GRANT ALL ON public.partner_commissions TO service_role;
ALTER TABLE public.partner_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners read own commissions" ON public.partner_commissions FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
         OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage commissions" ON public.partner_commissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_partner_commissions_updated_at BEFORE UPDATE ON public.partner_commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Extend orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS partner_id UUID,
  ADD COLUMN IF NOT EXISTS referral_discount NUMERIC NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_partner_id ON public.orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_orders_referral_code ON public.orders(referral_code);

-- 7. Trigger: create commission on new order with referral code
CREATE OR REPLACE FUNCTION public.create_partner_commission_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code RECORD;
  v_partner_id UUID;
  v_subtotal NUMERIC;
  v_commissionable NUMERIC;
  v_commission NUMERIC;
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_code FROM public.partner_referral_codes
    WHERE upper(code) = upper(NEW.referral_code) LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  v_partner_id := v_code.partner_id;
  v_subtotal := COALESCE(NEW.subtotal, NEW.total_amount, 0);
  v_commissionable := GREATEST(v_subtotal - COALESCE(NEW.referral_discount, 0), 0);

  IF v_code.commission_type = 'percentage' THEN
    v_commission := ROUND(v_commissionable * v_code.commission_value / 100.0, 2);
  ELSE
    v_commission := v_code.commission_value;
  END IF;

  INSERT INTO public.partner_commissions (
    partner_id, code_id, code_used, order_id, order_subtotal, discount_amount,
    commissionable_amount, commission_type, commission_value, commission_amount, status
  ) VALUES (
    v_partner_id, v_code.id, NEW.referral_code, NEW.id, v_subtotal,
    COALESCE(NEW.referral_discount, 0), v_commissionable, v_code.commission_type,
    v_code.commission_value, v_commission, 'pending'
  ) ON CONFLICT (order_id) DO NOTHING;

  UPDATE public.partner_referral_codes
    SET used_count = used_count + 1
    WHERE id = v_code.id;

  -- Backfill partner_id on order if not set
  IF NEW.partner_id IS NULL THEN
    UPDATE public.orders SET partner_id = v_partner_id WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_create_commission ON public.orders;
CREATE TRIGGER trg_orders_create_commission
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.create_partner_commission_on_order();

-- 8. Trigger: sync commission status with order status
CREATE OR REPLACE FUNCTION public.sync_partner_commission_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'delivered' THEN
      UPDATE public.partner_commissions
        SET status = 'approved', approved_at = now()
        WHERE order_id = NEW.id AND status = 'pending';
    ELSIF NEW.status IN ('cancelled', 'refunded') THEN
      UPDATE public.partner_commissions
        SET status = 'cancelled'
        WHERE order_id = NEW.id AND status IN ('pending', 'approved');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_sync_commission ON public.orders;
CREATE TRIGGER trg_orders_sync_commission
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.sync_partner_commission_status();
