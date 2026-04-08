CREATE POLICY "Users can view own posts"
ON public.blog_posts
FOR SELECT
USING (auth.uid() = user_id);