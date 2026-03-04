
-- Expense categories table
CREATE TABLE public.pos_expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Expenses table
CREATE TABLE public.pos_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.pos_expense_categories(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  reference_no TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.pos_expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage expense categories" ON public.pos_expense_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active expense categories" ON public.pos_expense_categories FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage expenses" ON public.pos_expenses FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff can create expenses" ON public.pos_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff can view own expenses" ON public.pos_expenses FOR SELECT USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_pos_expense_categories_updated_at BEFORE UPDATE ON public.pos_expense_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_expenses_updated_at BEFORE UPDATE ON public.pos_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
