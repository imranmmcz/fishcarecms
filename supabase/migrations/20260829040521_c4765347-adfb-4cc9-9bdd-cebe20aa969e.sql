
-- 1) POS due payments: restrict to admins/authorized staff
DROP POLICY IF EXISTS "Staff can insert due payments" ON public.pos_due_payments;
DROP POLICY IF EXISTS "Staff can view due payments" ON public.pos_due_payments;

CREATE POLICY "Authorized staff can insert due payments"
ON public.pos_due_payments FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_permission(auth.uid(), 'admin_orders'));

CREATE POLICY "Authorized staff can view due payments"
ON public.pos_due_payments FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_permission(auth.uid(), 'admin_orders'));

-- 2) blog_images: require ownership of the referenced post
DROP POLICY IF EXISTS "Auth users can insert blog images" ON public.blog_images;
CREATE POLICY "Users can insert images on their own posts"
ON public.blog_images FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.blog_posts p WHERE p.id = blog_images.post_id AND p.user_id = auth.uid())
);

-- 3) blog_comments: derive author_role server-side
CREATE OR REPLACE FUNCTION public.set_comment_author_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  real_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    NEW.author_role := 'guest';
    RETURN NEW;
  END IF;
  SELECT role::text INTO real_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY (role::text = 'admin') DESC
  LIMIT 1;
  NEW.author_role := COALESCE(real_role, 'user');
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_comment_author_role ON public.blog_comments;
CREATE TRIGGER trg_set_comment_author_role
BEFORE INSERT OR UPDATE OF author_role ON public.blog_comments
FOR EACH ROW EXECUTE FUNCTION public.set_comment_author_role();

REVOKE EXECUTE ON FUNCTION public.set_comment_author_role() FROM PUBLIC, anon, authenticated;

-- 4) product_reviews: hide user_email from public/client roles
REVOKE SELECT (user_email) ON public.product_reviews FROM anon, authenticated;

-- 5) partner_wallets: stop realtime broadcast of financial data
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'partner_wallets'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.partner_wallets';
  END IF;
END $$;
