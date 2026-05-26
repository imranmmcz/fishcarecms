
-- 1. product_reviews: hide user_email from public via column-level grants
REVOKE SELECT ON public.product_reviews FROM anon, authenticated;
GRANT SELECT (id, product_id, user_id, user_name, rating, title, comment, is_verified_purchase, is_approved, helpful_count, created_at, updated_at)
  ON public.product_reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_reviews TO authenticated;
GRANT ALL ON public.product_reviews TO service_role;

-- 2. companies: restrict contact info read to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active companies" ON public.companies;
CREATE POLICY "Authenticated can view active companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 3. abandoned_carts: require session_id (or matching user) on insert
DROP POLICY IF EXISTS "System can insert abandoned carts" ON public.abandoned_carts;
CREATE POLICY "Insert abandoned carts with session"
  ON public.abandoned_carts FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    session_id IS NOT NULL
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- 4. email_logs: restrict insert to service_role/admins only
DROP POLICY IF EXISTS "Allow insert for system" ON public.email_logs;
CREATE POLICY "Admins can insert email logs"
  ON public.email_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. notification_logs: restrict insert to authenticated admins
DROP POLICY IF EXISTS "System can insert notification logs" ON public.notification_logs;
CREATE POLICY "Admins can insert notification logs"
  ON public.notification_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 6. sms_logs: restrict insert to authenticated admins
DROP POLICY IF EXISTS "System can insert sms logs" ON public.sms_logs;
CREATE POLICY "Admins can insert sms logs"
  ON public.sms_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 7. whatsapp_logs: restrict insert to authenticated admins
DROP POLICY IF EXISTS "Allow system insert whatsapp logs" ON public.whatsapp_logs;
CREATE POLICY "Admins can insert whatsapp logs"
  ON public.whatsapp_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 8. user_activity_logs: require auth.uid() = user_id
DROP POLICY IF EXISTS "System can insert activity logs" ON public.user_activity_logs;
CREATE POLICY "Users can insert own activity logs"
  ON public.user_activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 9. registration_attempts: tighten with non-null requirement
DROP POLICY IF EXISTS "System can insert registration attempts" ON public.registration_attempts;
CREATE POLICY "Insert registration attempts with identifiers"
  ON public.registration_attempts FOR INSERT
  TO anon, authenticated
  WITH CHECK (ip_address IS NOT NULL OR email IS NOT NULL);

-- 10. storage.objects: restrict blog-images delete to uploader or admin
DROP POLICY IF EXISTS "Users can delete own blog images" ON storage.objects;
CREATE POLICY "Users can delete own blog images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'blog-images'
    AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  );
