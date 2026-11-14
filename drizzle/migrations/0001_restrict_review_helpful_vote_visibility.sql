DROP POLICY IF EXISTS "Anyone can view votes" ON public.review_helpful_votes;
CREATE POLICY "Users can view their own review votes"
ON public.review_helpful_votes FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can vote" ON public.review_helpful_votes;
CREATE POLICY "Authenticated users can vote for themselves"
ON public.review_helpful_votes FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.review_helpful_votes TO authenticated;
REVOKE ALL ON public.review_helpful_votes FROM anon;
