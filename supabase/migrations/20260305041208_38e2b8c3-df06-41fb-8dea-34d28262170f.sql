
-- Junction table: disease recommended products
CREATE TABLE public.disease_recommended_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_id uuid NOT NULL REFERENCES public.fish_diseases(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(disease_id, product_id)
);

ALTER TABLE public.disease_recommended_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view recommended products" ON public.disease_recommended_products
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage recommended products" ON public.disease_recommended_products
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
