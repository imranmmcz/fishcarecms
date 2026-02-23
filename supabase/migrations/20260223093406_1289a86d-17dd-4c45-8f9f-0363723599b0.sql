
-- Farmer Ponds table
CREATE TABLE public.farmer_ponds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  area NUMERIC NOT NULL DEFAULT 0,
  area_unit TEXT NOT NULL DEFAULT 'শতক',
  depth NUMERIC NOT NULL DEFAULT 0,
  depth_unit TEXT NOT NULL DEFAULT 'ফুট',
  fish_types TEXT[] DEFAULT '{}',
  fish_count INTEGER DEFAULT 0,
  stocking_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  fish_stock_entries JSONB DEFAULT '[]',
  total_stocking_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.farmer_ponds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ponds" ON public.farmer_ponds
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own ponds" ON public.farmer_ponds
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ponds" ON public.farmer_ponds
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ponds" ON public.farmer_ponds
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all ponds" ON public.farmer_ponds
  FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all ponds" ON public.farmer_ponds
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_farmer_ponds_updated_at
  BEFORE UPDATE ON public.farmer_ponds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Farmer Incomes table
CREATE TABLE public.farmer_incomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL DEFAULT 'মাছ বিক্রয়',
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  pond_name TEXT,
  fish_type TEXT,
  fish_weight NUMERIC,
  fish_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.farmer_incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own incomes" ON public.farmer_incomes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own incomes" ON public.farmer_incomes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own incomes" ON public.farmer_incomes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own incomes" ON public.farmer_incomes
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all incomes" ON public.farmer_incomes
  FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all incomes" ON public.farmer_incomes
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_farmer_incomes_updated_at
  BEFORE UPDATE ON public.farmer_incomes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Farmer Expenses table
CREATE TABLE public.farmer_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL DEFAULT 'খাবার',
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  pond_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.farmer_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own expenses" ON public.farmer_expenses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own expenses" ON public.farmer_expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own expenses" ON public.farmer_expenses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own expenses" ON public.farmer_expenses
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all expenses" ON public.farmer_expenses
  FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all expenses" ON public.farmer_expenses
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_farmer_expenses_updated_at
  BEFORE UPDATE ON public.farmer_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Farmer Samplings table
CREATE TABLE public.farmer_samplings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pond_id UUID REFERENCES public.farmer_ponds(id) ON DELETE CASCADE,
  pond_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  fish_entries JSONB DEFAULT '[]',
  total_fish INTEGER DEFAULT 0,
  total_weight NUMERIC DEFAULT 0,
  avg_weight NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.farmer_samplings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own samplings" ON public.farmer_samplings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own samplings" ON public.farmer_samplings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own samplings" ON public.farmer_samplings
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all samplings" ON public.farmer_samplings
  FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all samplings" ON public.farmer_samplings
  FOR ALL USING (has_role(auth.uid(), 'admin'));
