-- Insert auth page content sections for login and registration pages
INSERT INTO public.page_content (section_key, section_name, display_order, is_active, content) VALUES
('auth_login', 'লগইন পেজ', 20, true, '{
  "heading": "মাছ চাষ ম্যানেজমেন্ট",
  "description": "আপনার অ্যাকাউন্টে প্রবেশ করুন",
  "logoType": "icon",
  "logoUrl": "",
  "buttonText": "লগইন করুন",
  "homeButtonText": "হোম পেজে যান",
  "emailLabel": "ইমেইল",
  "emailPlaceholder": "your@email.com",
  "passwordLabel": "পাসওয়ার্ড",
  "passwordPlaceholder": "••••••••",
  "showDemoAccount": true,
  "demoEmail": "demo@fishfarm.com",
  "demoPassword": "demo123",
  "demoText": "ডেমো অ্যাকাউন্ট:"
}'::jsonb),
('auth_register', 'রেজিস্ট্রেশন পেজ', 21, true, '{
  "heading": "নতুন অ্যাকাউন্ট তৈরি করুন",
  "description": "আপনার তথ্য দিয়ে নিবন্ধন করুন",
  "buttonText": "নিবন্ধন করুন",
  "nameLabel": "পূর্ণ নাম",
  "namePlaceholder": "আপনার নাম",
  "emailLabel": "ইমেইল",
  "emailPlaceholder": "your@email.com",
  "passwordLabel": "পাসওয়ার্ড",
  "passwordPlaceholder": "••••••••",
  "confirmPasswordLabel": "পাসওয়ার্ড নিশ্চিত করুন",
  "confirmPasswordPlaceholder": "••••••••",
  "showAddressFields": true
}'::jsonb)
ON CONFLICT DO NOTHING;