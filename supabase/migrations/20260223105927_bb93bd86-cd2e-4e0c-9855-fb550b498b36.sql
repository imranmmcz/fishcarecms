-- Allow authenticated users to submit market prices
CREATE POLICY "Authenticated users can submit market prices"
ON public.market_prices
FOR INSERT
TO authenticated
WITH CHECK (true);
