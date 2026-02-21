
-- Delivery charge rules table
CREATE TABLE public.delivery_charge_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_type text NOT NULL DEFAULT 'district', -- 'district', 'order_amount', 'product_weight'
  district_name text, -- for district-based rules
  min_value numeric DEFAULT 0, -- min order amount or weight
  max_value numeric, -- max order amount or weight (null = unlimited)
  charge_amount numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0, -- higher priority wins
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_charge_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage delivery rules"
  ON public.delivery_charge_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active delivery rules"
  ON public.delivery_charge_rules FOR SELECT
  USING (is_active = true);

-- Add delivery/partial payment settings to system_settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
  ('delivery_charge_enabled', 'true', 'Enable delivery charge calculation'),
  ('delivery_default_charge', '100', 'Default delivery charge when no rule matches'),
  ('delivery_free_above', '0', 'Free delivery for orders above this amount (0=disabled)'),
  ('partial_payment_enabled', 'false', 'Enable partial payment / advance payment'),
  ('partial_payment_min_percent', '50', 'Minimum advance payment percentage'),
  ('partial_payment_methods', 'bkash,nagad', 'Payment methods that support partial payment')
ON CONFLICT (setting_key) DO NOTHING;

-- Add weight column to products if not exists
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight_kg numeric DEFAULT 0;

-- Trigger for updated_at
CREATE TRIGGER update_delivery_charge_rules_updated_at
  BEFORE UPDATE ON public.delivery_charge_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
