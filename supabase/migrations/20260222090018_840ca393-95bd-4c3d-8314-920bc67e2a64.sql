
-- Add farmer and customer to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'farmer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';

-- Update handle_new_user function to use role_type from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  assigned_role app_role;
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
  
  -- Determine role from metadata, default to 'farmer' for direct registration
  assigned_role := COALESCE(
    NULLIF(new.raw_user_meta_data ->> 'role_type', '')::app_role,
    'farmer'
  );
  
  -- Assign role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, assigned_role);
  
  RETURN new;
END;
$function$;
