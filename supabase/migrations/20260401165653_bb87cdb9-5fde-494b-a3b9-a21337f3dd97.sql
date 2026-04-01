
CREATE TABLE public.product_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variation_name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  weight_value NUMERIC NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  sku TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage product variations"
  ON public.product_variations FOR ALL
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active variations"
  ON public.product_variations FOR SELECT
  TO public
  USING (is_active = true);
