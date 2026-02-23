
-- Courier settings table for storing API credentials
CREATE TABLE public.courier_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_name text NOT NULL UNIQUE,
  api_key text,
  secret_key text,
  base_url text DEFAULT 'https://portal.packzy.com/api/v1',
  is_enabled boolean DEFAULT false,
  auto_create_order boolean DEFAULT false,
  auto_create_on_status text DEFAULT 'processing',
  webhook_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.courier_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage courier settings"
ON public.courier_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view courier settings"
ON public.courier_settings FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Steadfast consignment log table
CREATE TABLE public.steadfast_consignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  consignment_id text,
  tracking_code text,
  invoice text NOT NULL,
  status text DEFAULT 'pending',
  delivery_status text,
  cod_amount numeric DEFAULT 0,
  charge numeric DEFAULT 0,
  recipient_name text,
  recipient_phone text,
  recipient_address text,
  note text,
  api_response jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.steadfast_consignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage consignments"
ON public.steadfast_consignments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view consignments"
ON public.steadfast_consignments FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their order consignments"
ON public.steadfast_consignments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM orders WHERE orders.id = steadfast_consignments.order_id AND orders.user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_courier_settings_updated_at
BEFORE UPDATE ON public.courier_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_steadfast_consignments_updated_at
BEFORE UPDATE ON public.steadfast_consignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default Steadfast entry
INSERT INTO public.courier_settings (courier_name, base_url) 
VALUES ('steadfast', 'https://portal.packzy.com/api/v1');
