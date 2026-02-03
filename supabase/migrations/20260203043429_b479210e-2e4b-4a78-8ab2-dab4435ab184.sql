-- Fix overly permissive RLS policies

-- Drop and recreate order insert policy with proper check
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
ON public.orders FOR INSERT
WITH CHECK (
  -- Allow authenticated users to create orders for themselves
  -- Or allow anonymous orders (user_id can be null for guest checkout)
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR user_id IS NULL
);

-- Drop and recreate order items insert policy
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
CREATE POLICY "Users can insert order items for their orders"
ON public.order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
  )
);

-- Drop and recreate reviews insert policy
DROP POLICY IF EXISTS "Users can create reviews" ON public.product_reviews;
CREATE POLICY "Authenticated users can create reviews"
ON public.product_reviews FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());