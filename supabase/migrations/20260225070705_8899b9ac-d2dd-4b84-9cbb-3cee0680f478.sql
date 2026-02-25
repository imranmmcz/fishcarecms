
-- POS Shifts table
CREATE TABLE public.pos_shifts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  shift_number text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  opening_amount numeric NOT NULL DEFAULT 0,
  closing_amount numeric,
  expected_amount numeric,
  cash_sales numeric NOT NULL DEFAULT 0,
  mobile_banking_sales numeric NOT NULL DEFAULT 0,
  total_sales numeric NOT NULL DEFAULT 0,
  total_transactions integer NOT NULL DEFAULT 0,
  notes text,
  opened_at timestamp with time zone NOT NULL DEFAULT now(),
  closed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pos_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage shifts" ON public.pos_shifts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff can view own shifts" ON public.pos_shifts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can create shifts" ON public.pos_shifts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff can update own shifts" ON public.pos_shifts FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_pos_shifts_updated_at BEFORE UPDATE ON public.pos_shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- POS Sales table
CREATE TABLE public.pos_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_number text NOT NULL,
  shift_id uuid REFERENCES public.pos_shifts(id),
  user_id uuid NOT NULL,
  customer_name text,
  customer_phone text,
  payment_method text NOT NULL DEFAULT 'cash',
  subtotal numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  change_amount numeric NOT NULL DEFAULT 0,
  mobile_banking_provider text,
  mobile_banking_number text,
  transaction_id text,
  status text NOT NULL DEFAULT 'completed',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pos_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pos sales" ON public.pos_sales FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff can view own sales" ON public.pos_sales FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can create sales" ON public.pos_sales FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_pos_sales_updated_at BEFORE UPDATE ON public.pos_sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- POS Sale Items table
CREATE TABLE public.pos_sale_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id uuid NOT NULL REFERENCES public.pos_sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  product_name text NOT NULL,
  unit_price numeric NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  discount_percentage numeric DEFAULT 0,
  total_price numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pos_sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sale items" ON public.pos_sale_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff can view sale items" ON public.pos_sale_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.pos_sales WHERE pos_sales.id = pos_sale_items.sale_id AND pos_sales.user_id = auth.uid())
);
CREATE POLICY "Staff can insert sale items" ON public.pos_sale_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.pos_sales WHERE pos_sales.id = pos_sale_items.sale_id AND pos_sales.user_id = auth.uid())
);

-- Generate POS sale number function
CREATE OR REPLACE FUNCTION public.generate_pos_sale_number()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  new_number TEXT;
  sale_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO sale_count FROM public.pos_sales;
  new_number := 'POS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(sale_count::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

-- Generate shift number function
CREATE OR REPLACE FUNCTION public.generate_shift_number()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  new_number TEXT;
  shift_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO shift_count FROM public.pos_shifts;
  new_number := 'SHIFT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(shift_count::TEXT, 3, '0');
  RETURN new_number;
END;
$$;
