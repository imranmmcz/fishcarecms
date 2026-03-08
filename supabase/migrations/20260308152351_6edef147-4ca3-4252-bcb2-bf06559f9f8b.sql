
-- Flash Sales table
CREATE TABLE public.flash_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_bn TEXT,
  description TEXT,
  description_bn TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_quantity_per_user INTEGER DEFAULT NULL,
  banner_image_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Flash Sale Items (products in a flash sale)
CREATE TABLE public.flash_sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flash_sale_id UUID NOT NULL REFERENCES public.flash_sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  override_discount_type TEXT,
  override_discount_value NUMERIC,
  stock_limit INTEGER,
  sold_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(flash_sale_id, product_id)
);

-- Enable RLS
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_sale_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for flash_sales
CREATE POLICY "Admins can manage flash sales" ON public.flash_sales FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view active flash sales" ON public.flash_sales FOR SELECT USING (is_active = true AND start_time <= now() AND end_time > now());

-- RLS policies for flash_sale_items
CREATE POLICY "Admins can manage flash sale items" ON public.flash_sale_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view flash sale items" ON public.flash_sale_items FOR SELECT USING (true);

-- Updated at trigger
CREATE TRIGGER update_flash_sales_updated_at BEFORE UPDATE ON public.flash_sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
