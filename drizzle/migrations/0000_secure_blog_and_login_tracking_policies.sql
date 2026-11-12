DROP POLICY IF EXISTS "Auth users can create comments" ON public.blog_comments;
CREATE POLICY "Users can create comments for themselves"
ON public.blog_comments FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view votes" ON public.blog_comment_votes;
CREATE POLICY "Users can view their own votes"
ON public.blog_comment_votes FOR SELECT TO authenticated
USING (auth.uid() = user_id);
GRANT SELECT, INSERT, DELETE ON public.blog_comment_votes TO authenticated;
REVOKE ALL ON public.blog_comment_votes FROM anon;

DROP POLICY IF EXISTS "Anyone can insert login attempts" ON public.login_attempts;
REVOKE INSERT, UPDATE, DELETE ON public.login_attempts FROM anon, authenticated;
GRANT SELECT ON public.login_attempts TO authenticated;
GRANT ALL ON public.login_attempts TO service_role;
