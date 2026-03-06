
CREATE TABLE public.farm_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pond_name TEXT NOT NULL DEFAULT '',
  fish_species TEXT NOT NULL DEFAULT '',
  pond_size NUMERIC NOT NULL DEFAULT 0,
  pond_size_unit TEXT NOT NULL DEFAULT 'decimal',
  stocking_density NUMERIC NOT NULL DEFAULT 0,
  fingerling_price NUMERIC NOT NULL DEFAULT 0,
  feed_type TEXT DEFAULT '',
  feed_cost_per_kg NUMERIC NOT NULL DEFAULT 0,
  fcr NUMERIC NOT NULL DEFAULT 1.5,
  medicine_cost NUMERIC NOT NULL DEFAULT 0,
  labor_cost NUMERIC NOT NULL DEFAULT 0,
  electricity_cost NUMERIC NOT NULL DEFAULT 0,
  other_cost NUMERIC NOT NULL DEFAULT 0,
  culture_duration INTEGER NOT NULL DEFAULT 6,
  survival_rate NUMERIC NOT NULL DEFAULT 85,
  avg_harvest_weight NUMERIC NOT NULL DEFAULT 0.5,
  market_price_per_kg NUMERIC NOT NULL DEFAULT 0,
  total_fish_stocked INTEGER NOT NULL DEFAULT 0,
  total_harvest_biomass NUMERIC NOT NULL DEFAULT 0,
  total_fingerling_cost NUMERIC NOT NULL DEFAULT 0,
  total_feed_cost NUMERIC NOT NULL DEFAULT 0,
  total_farming_cost NUMERIC NOT NULL DEFAULT 0,
  predicted_revenue NUMERIC NOT NULL DEFAULT 0,
  predicted_profit NUMERIC NOT NULL DEFAULT 0,
  roi NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.farm_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own predictions" ON public.farm_predictions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions" ON public.farm_predictions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own predictions" ON public.farm_predictions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own predictions" ON public.farm_predictions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all predictions" ON public.farm_predictions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
