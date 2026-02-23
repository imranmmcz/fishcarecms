
-- Add dashboard_settings jsonb column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dashboard_settings jsonb DEFAULT '{"theme":"system","notifications":{"email":true,"push":true,"sound":true,"incomeAlerts":true,"expenseAlerts":true,"reportReminders":true}}'::jsonb;
