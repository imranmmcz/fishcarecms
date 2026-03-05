
-- Campaign management table
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_bn text,
  description text,
  description_bn text,
  campaign_type text NOT NULL DEFAULT 'discount',
  status text NOT NULL DEFAULT 'draft',
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  
  -- Discount/Coupon fields
  discount_type text DEFAULT 'percentage',
  discount_value numeric DEFAULT 0,
  coupon_code text,
  min_order_amount numeric DEFAULT 0,
  max_discount_amount numeric,
  usage_limit integer,
  used_count integer DEFAULT 0,
  
  -- Banner/Promo fields
  banner_image_url text,
  banner_link text,
  banner_position text DEFAULT 'homepage_top',
  show_popup boolean DEFAULT false,
  popup_delay_seconds integer DEFAULT 3,
  
  -- Notification fields
  notification_channels text[] DEFAULT '{}',
  notification_message text,
  notification_message_bn text,
  target_audience text DEFAULT 'all',
  
  -- Product targeting
  applicable_product_ids uuid[] DEFAULT '{}',
  applicable_category_ids uuid[] DEFAULT '{}',
  
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaigns" ON public.campaigns
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active campaigns" ON public.campaigns
  FOR SELECT TO anon, authenticated
  USING (is_active = true AND status = 'active' AND (end_date IS NULL OR end_date > now()));
