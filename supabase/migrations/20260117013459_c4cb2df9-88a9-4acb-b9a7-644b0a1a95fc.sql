-- Create a function to get all public tables dynamically
CREATE OR REPLACE FUNCTION public.get_public_tables()
RETURNS TABLE (
  name text,
  label text,
  label_bn text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text as name,
    REPLACE(INITCAP(REPLACE(t.table_name::text, '_', ' ')), '_', ' ')::text as label,
    CASE t.table_name::text
      WHEN 'market_prices' THEN 'বাজার দর'
      WHEN 'products' THEN 'পণ্যসমূহ'
      WHEN 'page_content' THEN 'পেজ কন্টেন্ট'
      WHEN 'ad_settings' THEN 'বিজ্ঞাপন সেটিংস'
      WHEN 'system_settings' THEN 'সিস্টেম সেটিংস'
      WHEN 'profiles' THEN 'ব্যবহারকারী প্রোফাইল'
      WHEN 'user_roles' THEN 'ব্যবহারকারী রোল'
      ELSE t.table_name::text
    END as label_bn
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
    AND t.table_name NOT LIKE '_realtime%'
  ORDER BY t.table_name;
END;
$$;