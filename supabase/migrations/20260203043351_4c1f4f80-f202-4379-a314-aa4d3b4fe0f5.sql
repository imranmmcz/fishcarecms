-- Create orders table for e-commerce
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  division TEXT,
  district TEXT,
  upazila TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cod',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  sender_number TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  shipping_cost NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  product_image TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  discount_percentage NUMERIC DEFAULT 0,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product reviews table
CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create review helpful votes table
CREATE TABLE public.review_helpful_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id),
  UNIQUE(review_id, ip_address)
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
ON public.orders FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage orders"
ON public.orders FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Order items policies
CREATE POLICY "Users can view their order items"
ON public.order_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.orders 
  WHERE orders.id = order_items.order_id 
  AND orders.user_id = auth.uid()
));

CREATE POLICY "Anyone can insert order items"
ON public.order_items FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all order items"
ON public.order_items FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage order items"
ON public.order_items FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Product reviews policies
CREATE POLICY "Anyone can view approved reviews"
ON public.product_reviews FOR SELECT
USING (is_approved = true);

CREATE POLICY "Users can create reviews"
ON public.product_reviews FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own reviews"
ON public.product_reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.product_reviews FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews"
ON public.product_reviews FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Review votes policies
CREATE POLICY "Anyone can view votes"
ON public.review_helpful_votes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can vote"
ON public.review_helpful_votes FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can remove their votes"
ON public.review_helpful_votes FOR DELETE
USING (auth.uid() = user_id);

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  order_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO order_count FROM public.orders;
  new_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(order_count::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

-- Trigger to update stock on order creation
CREATE OR REPLACE FUNCTION public.update_stock_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reduce stock quantity
  UPDATE public.products 
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER reduce_stock_on_order
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.update_stock_on_order();

-- Trigger to update helpful count
CREATE OR REPLACE FUNCTION public.update_review_helpful_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.product_reviews 
    SET helpful_count = helpful_count + 1
    WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.product_reviews 
    SET helpful_count = helpful_count - 1
    WHERE id = OLD.review_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_helpful_count
AFTER INSERT OR DELETE ON public.review_helpful_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_review_helpful_count();

-- Updated at trigger for orders
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Updated at trigger for reviews
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();