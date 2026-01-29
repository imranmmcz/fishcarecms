-- Create companies/suppliers table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_bn TEXT,
  company_type TEXT NOT NULL DEFAULT 'supplier' CHECK (company_type IN ('supplier', 'manufacturer', 'distributor')),
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_bn TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  logo_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add inventory columns to products table
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'pcs';

-- Create purchase orders table
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'received', 'cancelled')),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  received_date DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  shipping_cost NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase order items table
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  received_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stock adjustments table for tracking stock changes
CREATE TABLE public.stock_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('purchase', 'sale', 'return', 'damage', 'correction', 'initial')),
  quantity_change INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Anyone can view active companies" ON public.companies FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage companies" ON public.companies FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for brands
CREATE POLICY "Anyone can view active brands" ON public.brands FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage brands" ON public.brands FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for purchase_orders
CREATE POLICY "Admins can view purchase orders" ON public.purchase_orders FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage purchase orders" ON public.purchase_orders FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for purchase_order_items
CREATE POLICY "Admins can view purchase items" ON public.purchase_order_items FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage purchase items" ON public.purchase_order_items FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for stock_adjustments
CREATE POLICY "Admins can view stock adjustments" ON public.stock_adjustments FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage stock adjustments" ON public.stock_adjustments FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate purchase order number
CREATE OR REPLACE FUNCTION public.generate_purchase_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  order_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO order_count FROM public.purchase_orders;
  new_number := 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(order_count::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

-- Function to update stock on purchase receive
CREATE OR REPLACE FUNCTION public.update_stock_on_purchase_receive()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
  current_stock INTEGER;
BEGIN
  -- Only trigger when status changes to 'received'
  IF NEW.status = 'received' AND (OLD.status IS NULL OR OLD.status != 'received') THEN
    -- Update stock for each item in the purchase order
    FOR item IN SELECT * FROM public.purchase_order_items WHERE purchase_order_id = NEW.id
    LOOP
      -- Get current stock
      SELECT stock_quantity INTO current_stock FROM public.products WHERE id = item.product_id;
      
      -- Update product stock
      UPDATE public.products 
      SET stock_quantity = stock_quantity + item.quantity
      WHERE id = item.product_id;
      
      -- Log stock adjustment
      INSERT INTO public.stock_adjustments (
        product_id, adjustment_type, quantity_change, previous_quantity, new_quantity,
        reference_type, reference_id, notes
      ) VALUES (
        item.product_id, 'purchase', item.quantity, current_stock, current_stock + item.quantity,
        'purchase_order', NEW.id::TEXT, 'Purchase Order: ' || NEW.order_number
      );
    END LOOP;
    
    -- Set received date
    NEW.received_date := CURRENT_DATE;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for stock update on purchase receive
CREATE TRIGGER trigger_update_stock_on_purchase_receive
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_on_purchase_receive();