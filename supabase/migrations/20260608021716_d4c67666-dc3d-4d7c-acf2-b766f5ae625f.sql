CREATE OR REPLACE FUNCTION public.notify_partner_commission_approved()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_user uuid;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'approved' THEN
    SELECT user_id INTO v_user FROM public.partners WHERE id = NEW.partner_id;
    IF v_user IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, title_bn, message, message_bn, type, reference_id, reference_type)
      VALUES (v_user,
        'Commission Approved',
        'কমিশন অনুমোদিত হয়েছে',
        'Your commission of ৳' || NEW.commission_amount || ' (code ' || NEW.code_used || ') has been approved.',
        'আপনার ৳' || NEW.commission_amount || ' কমিশন (কোড ' || NEW.code_used || ') অনুমোদিত হয়েছে।',
        'partner_commission', NEW.id::text, 'partner_commission');
    END IF;
  END IF;
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_notify_partner_commission_approved ON public.partner_commissions;
CREATE TRIGGER trg_notify_partner_commission_approved
AFTER UPDATE ON public.partner_commissions
FOR EACH ROW EXECUTE FUNCTION public.notify_partner_commission_approved();

CREATE OR REPLACE FUNCTION public.notify_partner_withdrawal_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_user uuid; v_title text; v_title_bn text; v_msg text; v_msg_bn text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('paid','rejected','processing') THEN
    SELECT user_id INTO v_user FROM public.partners WHERE id = NEW.partner_id;
    IF v_user IS NULL THEN RETURN NEW; END IF;
    IF NEW.status = 'paid' THEN
      v_title := 'Withdrawal Completed'; v_title_bn := 'উত্তোলন সম্পন্ন';
      v_msg := 'Your withdrawal of ৳' || NEW.amount || ' via ' || NEW.method || ' has been paid.';
      v_msg_bn := 'আপনার ৳' || NEW.amount || ' উইথড্রয়াল (' || NEW.method || ') সম্পন্ন হয়েছে।';
    ELSIF NEW.status = 'rejected' THEN
      v_title := 'Withdrawal Rejected'; v_title_bn := 'উত্তোলন প্রত্যাখ্যাত';
      v_msg := 'Your withdrawal of ৳' || NEW.amount || ' was rejected.' || COALESCE(' Reason: ' || NEW.admin_notes, '');
      v_msg_bn := 'আপনার ৳' || NEW.amount || ' উইথড্রয়াল প্রত্যাখ্যাত হয়েছে।' || COALESCE(' কারণ: ' || NEW.admin_notes, '');
    ELSE
      v_title := 'Withdrawal Processing'; v_title_bn := 'উত্তোলন প্রক্রিয়াধীন';
      v_msg := 'Your withdrawal of ৳' || NEW.amount || ' is now being processed.';
      v_msg_bn := 'আপনার ৳' || NEW.amount || ' উইথড্রয়াল প্রক্রিয়াকরণ চলছে।';
    END IF;
    INSERT INTO public.notifications (user_id, title, title_bn, message, message_bn, type, reference_id, reference_type)
    VALUES (v_user, v_title, v_title_bn, v_msg, v_msg_bn, 'partner_withdrawal', NEW.id::text, 'partner_withdrawal');
  END IF;
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_notify_partner_withdrawal_status ON public.partner_withdrawals;
CREATE TRIGGER trg_notify_partner_withdrawal_status
AFTER UPDATE ON public.partner_withdrawals
FOR EACH ROW EXECUTE FUNCTION public.notify_partner_withdrawal_status();