import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export function InactivityWarningBanner() {
  const { user, isAdmin } = useAuth();
  const { language } = useLanguage();
  const isBn = language === "bn";
  const [daysInactive, setDaysInactive] = useState<number | null>(null);
  const [daysUntilDeletion, setDaysUntilDeletion] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [warningActive, setWarningActive] = useState(false);

  useEffect(() => {
    if (!user || isAdmin) return;

    const fetchInactivityInfo = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("last_sign_in_at, deletion_warning_sent_at")
        .eq("user_id", user.id)
        .single();

      if (error || !data) return;

      const lastSignIn = data.last_sign_in_at ? new Date(data.last_sign_in_at) : null;
      if (!lastSignIn) return;

      const now = new Date();
      const diffMs = now.getTime() - lastSignIn.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays >= 75) {
        setDaysInactive(diffDays);
        if (diffDays >= 90) {
          const deletionDate = data.deletion_warning_sent_at
            ? new Date(new Date(data.deletion_warning_sent_at).getTime() + 15 * 24 * 60 * 60 * 1000)
            : new Date(lastSignIn.getTime() + 105 * 24 * 60 * 60 * 1000);
          const remaining = Math.max(0, Math.ceil((deletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          setDaysUntilDeletion(remaining);
          setWarningActive(true);
        } else {
          setWarningActive(true);
          setDaysUntilDeletion(null);
        }
      }
    };

    fetchInactivityInfo();
  }, [user, isAdmin]);

  if (!warningActive || dismissed || isAdmin) return null;

  const isUrgent = daysInactive !== null && daysInactive >= 90;

  return (
    <div className={`relative mx-4 mt-4 p-4 rounded-xl border ${
      isUrgent
        ? "bg-destructive/10 border-destructive/30 text-destructive"
        : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
    }`}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 p-1 rounded-lg hover:bg-black/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${isUrgent ? "animate-pulse" : ""}`} />
        <div className="space-y-1">
          <h4 className="font-semibold text-sm">
            {isBn ? "⚠️ অ্যাকাউন্ট নিষ্ক্রিয়তার সতর্কতা" : "⚠️ Account Inactivity Warning"}
          </h4>
          <p className="text-sm opacity-90">
            {isUrgent ? (
              isBn
                ? `আপনার অ্যাকাউন্ট ${daysInactive} দিন ধরে নিষ্ক্রিয়। আপনার অ্যাকাউন্ট ${daysUntilDeletion} দিনের মধ্যে স্বয়ংক্রিয়ভাবে মুছে ফেলা হবে। নিয়মিত লগইন করলে এটি প্রতিরোধ করা যাবে।`
                : `Your account has been inactive for ${daysInactive} days. It will be automatically deleted in ${daysUntilDeletion} days. Logging in regularly will prevent this.`
            ) : (
              isBn
                ? `আপনার অ্যাকাউন্ট ${daysInactive} দিন ধরে নিষ্ক্রিয়। ৯০ দিন নিষ্ক্রিয় থাকলে সতর্কতা নোটিশ দেওয়া হবে এবং তার ১৫ দিন পর অ্যাকাউন্ট মুছে ফেলা হবে।`
                : `Your account has been inactive for ${daysInactive} days. After 90 days of inactivity, a warning will be issued and your account will be deleted 15 days later.`
            )}
          </p>
          <p className="text-xs opacity-70">
            {isBn
              ? "📌 নীতি: ৯০ দিন নিষ্ক্রিয় → সতর্কতা → ১৫ দিন পর অটো-ডিলিট"
              : "📌 Policy: 90 days inactive → Warning → Auto-delete after 15 days"}
          </p>
        </div>
      </div>
    </div>
  );
}
