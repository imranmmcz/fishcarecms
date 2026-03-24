
-- Abandoned carts table to track visitors/users who start checkout but don't complete
CREATE TABLE public.abandoned_carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  division TEXT,
  district TEXT,
  upazila TEXT,
  shipping_address TEXT,
  cart_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  cart_total NUMERIC NOT NULL DEFAULT 0,
  source TEXT DEFAULT 'direct',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  status TEXT NOT NULL DEFAULT 'abandoned',
  recovery_sent BOOLEAN NOT NULL DEFAULT false,
  recovery_sent_at TIMESTAMP WITH TIME ZONE,
  recovered_at TIMESTAMP WITH TIME ZONE,
  recovered_order_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Admin can manage all abandoned carts
CREATE POLICY "Admins can manage abandoned carts"
  ON public.abandoned_carts FOR ALL
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert abandoned carts (for guest users)
CREATE POLICY "System can insert abandoned carts"
  ON public.abandoned_carts FOR INSERT
  TO public
  WITH CHECK (true);

-- Users can view their own abandoned carts
CREATE POLICY "Users can view own abandoned carts"
  ON public.abandoned_carts FOR SELECT
  TO public
  USING (auth.uid() = user_id);
