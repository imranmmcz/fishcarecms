-- Fix remaining RLS policy - review votes insert
DROP POLICY IF EXISTS "Authenticated users can vote" ON public.review_helpful_votes;
CREATE POLICY "Authenticated users can vote on reviews"
ON public.review_helpful_votes FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());