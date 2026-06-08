ALTER TABLE public.partner_wallets REPLICA IDENTITY FULL;
ALTER TABLE public.partner_commissions REPLICA IDENTITY FULL;
ALTER TABLE public.partner_withdrawals REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_wallets; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_commissions; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_withdrawals; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;