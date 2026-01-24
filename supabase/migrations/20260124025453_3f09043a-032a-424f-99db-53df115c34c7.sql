-- Insert payment settings into system_settings table
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES 
  ('payment_bkash_number', '01711-XXXXXX', 'বিকাশ পেমেন্ট নম্বর'),
  ('payment_bkash_type', 'Personal', 'বিকাশ একাউন্ট টাইপ (Personal/Merchant)'),
  ('payment_nagad_number', '01811-XXXXXX', 'নগদ পেমেন্ট নম্বর'),
  ('payment_nagad_type', 'Personal', 'নগদ একাউন্ট টাইপ (Personal/Merchant)'),
  ('payment_cod_enabled', 'true', 'ক্যাশ অন ডেলিভারি সক্রিয়'),
  ('payment_bkash_enabled', 'true', 'বিকাশ পেমেন্ট সক্রিয়'),
  ('payment_nagad_enabled', 'true', 'নগদ পেমেন্ট সক্রিয়')
ON CONFLICT (setting_key) DO NOTHING;