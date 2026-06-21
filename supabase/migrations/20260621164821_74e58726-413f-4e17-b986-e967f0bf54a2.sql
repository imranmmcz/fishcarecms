
DROP POLICY IF EXISTS "System can insert alert logs" ON public.alert_logs;
CREATE POLICY "Users can insert their own alert logs"
ON public.alert_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert market prices" ON public.market_prices;
DROP POLICY IF EXISTS "Authenticated can insert market prices" ON public.market_prices;
DROP POLICY IF EXISTS "Anyone can insert market prices" ON public.market_prices;

DROP POLICY IF EXISTS "Authenticated can insert security events" ON public.security_audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert security events" ON public.security_audit_logs;
CREATE POLICY "Users can insert their own security events"
ON public.security_audit_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND severity IN ('info','warning'));

ALTER PUBLICATION supabase_realtime DROP TABLE public.partner_commissions;
ALTER PUBLICATION supabase_realtime DROP TABLE public.partner_withdrawals;
