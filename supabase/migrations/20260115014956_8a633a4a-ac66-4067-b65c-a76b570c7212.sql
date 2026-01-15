
-- Create table for fish market prices
CREATE TABLE public.market_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fish_name TEXT NOT NULL,
  fish_name_bn TEXT NOT NULL,
  price_per_kg NUMERIC NOT NULL,
  min_price NUMERIC,
  max_price NUMERIC,
  division TEXT NOT NULL,
  district TEXT NOT NULL,
  upazila TEXT NOT NULL,
  market_name TEXT,
  price_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;

-- Anyone can view market prices (public data)
CREATE POLICY "Anyone can view market prices" 
ON public.market_prices 
FOR SELECT 
USING (true);

-- Only admins can manage market prices
CREATE POLICY "Admins can insert market prices" 
ON public.market_prices 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update market prices" 
ON public.market_prices 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete market prices" 
ON public.market_prices 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_market_prices_updated_at
BEFORE UPDATE ON public.market_prices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_prices;

-- Insert sample data for demonstration
INSERT INTO public.market_prices (fish_name, fish_name_bn, price_per_kg, min_price, max_price, division, district, upazila, market_name) VALUES
('Rohu', 'রুই', 280, 260, 300, 'ঢাকা', 'ঢাকা', 'ধামরাই', 'ধামরাই বাজার'),
('Catla', 'কাতলা', 320, 300, 350, 'ঢাকা', 'ঢাকা', 'ধামরাই', 'ধামরাই বাজার'),
('Mrigal', 'মৃগেল', 250, 230, 270, 'ঢাকা', 'ঢাকা', 'ধামরাই', 'ধামরাই বাজার'),
('Tilapia', 'তেলাপিয়া', 180, 160, 200, 'ঢাকা', 'ঢাকা', 'ধামরাই', 'ধামরাই বাজার'),
('Pangasius', 'পাঙ্গাস', 150, 130, 170, 'ঢাকা', 'ঢাকা', 'ধামরাই', 'ধামরাই বাজার'),
('Silver Carp', 'সিলভার কার্প', 200, 180, 220, 'ঢাকা', 'ঢাকা', 'ধামরাই', 'ধামরাই বাজার'),
('Grass Carp', 'গ্রাস কার্প', 220, 200, 240, 'ঢাকা', 'ঢাকা', 'ধামরাই', 'ধামরাই বাজার'),
('Common Carp', 'কমন কার্প', 210, 190, 230, 'ঢাকা', 'ঢাকা', 'ধামরাই', 'ধামরাই বাজার'),
('Rohu', 'রুই', 290, 270, 310, 'চট্টগ্রাম', 'চট্টগ্রাম', 'হাটহাজারী', 'হাটহাজারী বাজার'),
('Catla', 'কাতলা', 330, 310, 360, 'চট্টগ্রাম', 'চট্টগ্রাম', 'হাটহাজারী', 'হাটহাজারী বাজার'),
('Tilapia', 'তেলাপিয়া', 190, 170, 210, 'চট্টগ্রাম', 'চট্টগ্রাম', 'হাটহাজারী', 'হাটহাজারী বাজার'),
('Rohu', 'রুই', 270, 250, 290, 'রাজশাহী', 'রাজশাহী', 'পবা', 'পবা বাজার'),
('Catla', 'কাতলা', 310, 290, 340, 'রাজশাহী', 'রাজশাহী', 'পবা', 'পবা বাজার'),
('Pangasius', 'পাঙ্গাস', 140, 120, 160, 'রাজশাহী', 'রাজশাহী', 'পবা', 'পবা বাজার'),
('Rohu', 'রুই', 275, 255, 295, 'খুলনা', 'খুলনা', 'দাকোপ', 'দাকোপ বাজার'),
('Shrimp', 'চিংড়ি', 850, 800, 900, 'খুলনা', 'খুলনা', 'দাকোপ', 'দাকোপ বাজার'),
('Hilsa', 'ইলিশ', 1200, 1000, 1400, 'খুলনা', 'খুলনা', 'দাকোপ', 'দাকোপ বাজার');
