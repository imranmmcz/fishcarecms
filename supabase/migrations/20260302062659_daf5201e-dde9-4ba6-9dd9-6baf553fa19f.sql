
-- Add last_sign_in_at and deletion_warning_sent_at to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_sign_in_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS deletion_warning_sent_at timestamp with time zone DEFAULT NULL;

-- Update existing profiles to set last_sign_in_at to now
UPDATE public.profiles SET last_sign_in_at = now() WHERE last_sign_in_at IS NULL;

-- Create a function to update last_sign_in_at when user signs in
CREATE OR REPLACE FUNCTION public.update_last_sign_in()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at THEN
    UPDATE public.profiles 
    SET last_sign_in_at = NEW.last_sign_in_at,
        deletion_warning_sent_at = NULL
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to track sign-ins
DROP TRIGGER IF EXISTS on_auth_user_sign_in ON auth.users;
CREATE TRIGGER on_auth_user_sign_in
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_sign_in();
