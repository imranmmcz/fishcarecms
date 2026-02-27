
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  title_bn TEXT,
  message TEXT NOT NULL,
  message_bn TEXT,
  type TEXT NOT NULL DEFAULT 'general',
  reference_id TEXT,
  reference_type TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update (mark read) their own notifications
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- System/admin can insert notifications
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Admins can manage all notifications
CREATE POLICY "Admins can manage all notifications"
ON public.notifications FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast user lookups
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notification on order status change
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  status_bn TEXT;
  status_en TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.user_id IS NOT NULL THEN
    CASE NEW.status
      WHEN 'pending' THEN status_bn := 'অপেক্ষমাণ'; status_en := 'Pending';
      WHEN 'processing' THEN status_bn := 'প্রসেসিং'; status_en := 'Processing';
      WHEN 'shipped' THEN status_bn := 'শিপড'; status_en := 'Shipped';
      WHEN 'delivered' THEN status_bn := 'ডেলিভারড'; status_en := 'Delivered';
      WHEN 'cancelled' THEN status_bn := 'বাতিল'; status_en := 'Cancelled';
      ELSE status_bn := NEW.status; status_en := NEW.status;
    END CASE;

    INSERT INTO public.notifications (user_id, title, title_bn, message, message_bn, type, reference_id, reference_type)
    VALUES (
      NEW.user_id,
      'Order ' || NEW.order_number || ' - ' || status_en,
      'অর্ডার ' || NEW.order_number || ' - ' || status_bn,
      'Your order status has been updated to ' || status_en,
      'আপনার অর্ডারের স্ট্যাটাস আপডেট হয়েছে: ' || status_bn,
      'order_update',
      NEW.id::TEXT,
      'order'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for order status changes
CREATE TRIGGER on_order_status_change
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_status_change();
