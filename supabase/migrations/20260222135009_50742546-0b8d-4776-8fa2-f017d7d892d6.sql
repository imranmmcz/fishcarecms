-- Add cost_price column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.products.cost_price IS 'Purchase/cost price from supplier. The existing "price" column is the selling price for customers.';