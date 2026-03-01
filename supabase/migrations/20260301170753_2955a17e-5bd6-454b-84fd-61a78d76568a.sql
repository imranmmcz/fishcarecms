
-- Add due_amount and payment_status columns to pos_sales
ALTER TABLE public.pos_sales ADD COLUMN IF NOT EXISTS due_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.pos_sales ADD COLUMN IF NOT EXISTS payment_type text NOT NULL DEFAULT 'full';

-- Create table for tracking installment/due payments
CREATE TABLE public.pos_due_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id uuid NOT NULL REFERENCES public.pos_sales(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  mobile_banking_provider text,
  transaction_id text,
  notes text,
  collected_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pos_due_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage due payments"
ON public.pos_due_payments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can insert due payments"
ON public.pos_due_payments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can view due payments"
ON public.pos_due_payments FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Index for performance
CREATE INDEX idx_pos_due_payments_sale_id ON public.pos_due_payments(sale_id);
CREATE INDEX idx_pos_sales_payment_type ON public.pos_sales(payment_type);
