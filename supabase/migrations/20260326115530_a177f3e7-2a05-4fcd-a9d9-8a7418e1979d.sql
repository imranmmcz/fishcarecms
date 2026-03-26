
-- Add tracking column for end notification
ALTER TABLE public.flash_sales ADD COLUMN IF NOT EXISTS end_notification_sent boolean DEFAULT false;
