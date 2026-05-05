
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_sign_in ON auth.users;
CREATE TRIGGER on_auth_user_sign_in
AFTER UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.update_last_sign_in();

-- Backfill missing profiles, dedupe mobile against existing + within batch
WITH missing AS (
  SELECT u.id, u.email,
    u.raw_user_meta_data->>'full_name' AS full_name,
    NULLIF(u.raw_user_meta_data->>'mobile','') AS mobile,
    u.raw_user_meta_data->>'division' AS division,
    u.raw_user_meta_data->>'district' AS district,
    u.raw_user_meta_data->>'upazila' AS upazila,
    u.raw_user_meta_data->>'village' AS village,
    u.created_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE p.user_id IS NULL
),
ranked AS (
  SELECT m.*,
    CASE
      WHEN m.mobile IS NULL THEN NULL
      WHEN EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.mobile = m.mobile) THEN NULL
      WHEN ROW_NUMBER() OVER (PARTITION BY m.mobile ORDER BY m.created_at) > 1 THEN NULL
      ELSE m.mobile
    END AS safe_mobile
  FROM missing m
)
INSERT INTO public.profiles (user_id, email, full_name, mobile, division, district, upazila, village)
SELECT id, email, full_name, safe_mobile, division, district, upazila, village FROM ranked;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id,
  COALESCE(NULLIF(u.raw_user_meta_data->>'role_type','')::app_role, 'farmer'::app_role)
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.user_id IS NULL;
