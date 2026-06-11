
-- ============================================================
-- OPTION 1: Restrict storage listing on public buckets
-- Public URL access (CDN) still works because buckets remain public.
-- Only API-level enumeration is restricted to admins.
-- ============================================================

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view blog images" ON storage.objects;

CREATE POLICY "Admins can list avatars"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can list product images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can list blog images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'blog-images' AND public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- OPTION 2: Revoke EXECUTE on internal SECURITY DEFINER functions
-- Trigger functions never need direct invocation; admin-only RPCs
-- enforce has_role() internally but we still revoke anon access
-- to reduce attack surface.
-- ============================================================

-- Trigger functions — revoke from anon AND authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_blog_comment_helpful_count() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_blog_post_comment_count() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_review_helpful_count() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_stock_on_order() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_stock_on_purchase_receive() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_last_sign_in() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_order_status_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_partner_commission_approved() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_partner_withdrawal_status() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_partner_commission_status() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_partner_commission_on_order() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_commission_wallet_sync() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_withdrawal_wallet_sync() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_partner_wallet(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_login_attempts() FROM anon, authenticated;

-- Admin/maintenance RPCs — revoke from anon only (authenticated admins call them)
REVOKE EXECUTE ON FUNCTION public.get_public_tables() FROM anon;
REVOKE EXECUTE ON FUNCTION public.manage_backup_cron(text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_products_cost_map() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_product_variations_cost_map() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_review_emails() FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_purchase_order_number() FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_shift_number() FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_pos_sale_number() FROM anon;
