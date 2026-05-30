
-- 1. backup_logs: restrict INSERT to admins (service_role bypasses RLS)
DROP POLICY IF EXISTS "Authenticated users can insert backup logs" ON public.backup_logs;
CREATE POLICY "Admins can insert backup logs"
ON public.backup_logs
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. companies: remove broad authenticated read; admin-only via existing ALL policy
DROP POLICY IF EXISTS "Authenticated can view active companies" ON public.companies;

-- 3. notifications: drop public insert, require self-insert for authenticated users
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- 4. product_reviews: hide user_email from anon and authenticated (admins/service_role still see it)
REVOKE SELECT (user_email) ON public.product_reviews FROM anon, authenticated;

-- 5. products: hide cost_price from anonymous visitors
REVOKE SELECT (cost_price) ON public.products FROM anon;

-- 6. product_variations: hide cost_price from anonymous visitors
REVOKE SELECT (cost_price) ON public.product_variations FROM anon;
