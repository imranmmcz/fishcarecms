-- Add address and mobile fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mobile TEXT,
ADD COLUMN IF NOT EXISTS division TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS upazila TEXT,
ADD COLUMN IF NOT EXISTS village TEXT;

-- Update the handle_new_user function to accept address fields from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, mobile, division, district, upazila, village)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'mobile',
    new.raw_user_meta_data ->> 'division',
    new.raw_user_meta_data ->> 'district',
    new.raw_user_meta_data ->> 'upazila',
    new.raw_user_meta_data ->> 'village'
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;