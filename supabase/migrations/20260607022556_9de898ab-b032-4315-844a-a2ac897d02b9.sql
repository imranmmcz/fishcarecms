
-- Partner wallets
CREATE TABLE IF NOT EXISTS public.partner_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL UNIQUE REFERENCES public.partners(id) ON DELETE CASCADE,
  available_balance numeric NOT NULL DEFAULT 0,
  pending_balance numeric NOT NULL DEFAULT 0,
  total_earned numeric NOT NULL DEFAULT 0,
  total_paid numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_wallets TO authenticated;
GRANT ALL ON public.partner_wallets TO service_role;
ALTER TABLE public.partner_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all wallets" ON public.partner_wallets
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners view own wallet" ON public.partner_wallets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.partners p WHERE p.id = partner_wallets.partner_id AND p.user_id = auth.uid())
  );

-- Partner withdrawals
CREATE TABLE IF NOT EXISTS public.partner_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  method text NOT NULL DEFAULT 'bkash',
  account_number text,
  account_name text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  transaction_id text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_withdrawals_partner ON public.partner_withdrawals(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_withdrawals_status ON public.partner_withdrawals(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_withdrawals TO authenticated;
GRANT ALL ON public.partner_withdrawals TO service_role;
ALTER TABLE public.partner_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all withdrawals" ON public.partner_withdrawals
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners view own withdrawals" ON public.partner_withdrawals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.partners p WHERE p.id = partner_withdrawals.partner_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Partners create own withdrawal requests" ON public.partner_withdrawals
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.partners p WHERE p.id = partner_withdrawals.partner_id AND p.user_id = auth.uid() AND p.status = 'approved')
    AND status = 'pending'
  );

CREATE POLICY "Partners cancel own pending withdrawals" ON public.partner_withdrawals
  FOR UPDATE USING (
    status = 'pending'
    AND EXISTS (SELECT 1 FROM public.partners p WHERE p.id = partner_withdrawals.partner_id AND p.user_id = auth.uid())
  );

CREATE TRIGGER trg_partner_wallets_updated_at BEFORE UPDATE ON public.partner_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_partner_withdrawals_updated_at BEFORE UPDATE ON public.partner_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recompute wallet for a partner
CREATE OR REPLACE FUNCTION public.recompute_partner_wallet(_partner_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pending numeric := 0;
  v_approved numeric := 0;
  v_paid_commissions numeric := 0;
  v_total_earned numeric := 0;
  v_paid_withdrawals numeric := 0;
  v_locked_withdrawals numeric := 0;
  v_available numeric := 0;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN status='pending' THEN commission_amount ELSE 0 END),0),
    COALESCE(SUM(CASE WHEN status='approved' THEN commission_amount ELSE 0 END),0),
    COALESCE(SUM(CASE WHEN status='paid' THEN commission_amount ELSE 0 END),0)
  INTO v_pending, v_approved, v_paid_commissions
  FROM public.partner_commissions WHERE partner_id = _partner_id;

  v_total_earned := v_approved + v_paid_commissions;

  SELECT
    COALESCE(SUM(CASE WHEN status='paid' THEN amount ELSE 0 END),0),
    COALESCE(SUM(CASE WHEN status IN ('pending','processing') THEN amount ELSE 0 END),0)
  INTO v_paid_withdrawals, v_locked_withdrawals
  FROM public.partner_withdrawals WHERE partner_id = _partner_id;

  v_available := GREATEST(0, v_total_earned - v_paid_withdrawals - v_locked_withdrawals);

  INSERT INTO public.partner_wallets (partner_id, available_balance, pending_balance, total_earned, total_paid)
  VALUES (_partner_id, v_available, v_pending, v_total_earned, v_paid_withdrawals)
  ON CONFLICT (partner_id) DO UPDATE SET
    available_balance = EXCLUDED.available_balance,
    pending_balance = EXCLUDED.pending_balance,
    total_earned = EXCLUDED.total_earned,
    total_paid = EXCLUDED.total_paid,
    updated_at = now();
END;
$$;

-- Trigger glue
CREATE OR REPLACE FUNCTION public.tg_commission_wallet_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.recompute_partner_wallet(COALESCE(NEW.partner_id, OLD.partner_id));
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_commission_wallet_sync ON public.partner_commissions;
CREATE TRIGGER trg_commission_wallet_sync
AFTER INSERT OR UPDATE OR DELETE ON public.partner_commissions
FOR EACH ROW EXECUTE FUNCTION public.tg_commission_wallet_sync();

CREATE OR REPLACE FUNCTION public.tg_withdrawal_wallet_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.recompute_partner_wallet(COALESCE(NEW.partner_id, OLD.partner_id));
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_withdrawal_wallet_sync ON public.partner_withdrawals;
CREATE TRIGGER trg_withdrawal_wallet_sync
AFTER INSERT OR UPDATE OR DELETE ON public.partner_withdrawals
FOR EACH ROW EXECUTE FUNCTION public.tg_withdrawal_wallet_sync();

-- Seed wallets for existing partners
INSERT INTO public.partner_wallets (partner_id)
SELECT id FROM public.partners
ON CONFLICT (partner_id) DO NOTHING;
