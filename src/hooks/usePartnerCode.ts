import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ReferralCode {
  id: string;
  partner_id: string;
  code: string;
  discount_type: "percentage" | "fixed" | "free_shipping";
  discount_value: number;
  commission_type: "percentage" | "fixed";
  commission_value: number;
  usage_limit: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
}

export interface ValidationResult {
  valid: boolean;
  code?: ReferralCode;
  discountAmount?: number;
  freeShipping?: boolean;
  error?: string;
}

export function usePartnerCode() {
  const [isValidating, setIsValidating] = useState(false);
  const [applied, setApplied] = useState<ReferralCode | null>(null);

  const validate = async (raw: string, subtotal: number): Promise<ValidationResult> => {
    const code = (raw || "").trim().toUpperCase();
    if (!code) return { valid: false, error: "কোড লিখুন" };
    setIsValidating(true);
    try {
      const { data, error } = await (supabase as any)
        .from("partner_referral_codes")
        .select("*")
        .ilike("code", code)
        .eq("is_active", true)
        .maybeSingle();
      if (error || !data) return { valid: false, error: "কোড পাওয়া যায়নি বা নিষ্ক্রিয়" };
      const c = data as ReferralCode;
      const now = new Date();
      if (c.valid_from && new Date(c.valid_from) > now)
        return { valid: false, error: "কোডটি এখনো কার্যকর নয়" };
      if (c.valid_until && new Date(c.valid_until) < now)
        return { valid: false, error: "কোডের মেয়াদ শেষ" };
      if (c.usage_limit != null && c.used_count >= c.usage_limit)
        return { valid: false, error: "কোডের ব্যবহারের সীমা শেষ" };

      let discountAmount = 0;
      let freeShipping = false;
      if (c.discount_type === "percentage") {
        discountAmount = Math.min(subtotal, Math.round((subtotal * c.discount_value) / 100));
      } else if (c.discount_type === "fixed") {
        discountAmount = Math.min(subtotal, c.discount_value);
      } else if (c.discount_type === "free_shipping") {
        freeShipping = true;
      }
      return { valid: true, code: c, discountAmount, freeShipping };
    } finally {
      setIsValidating(false);
    }
  };

  const apply = (c: ReferralCode | null) => setApplied(c);
  const clear = () => setApplied(null);

  return { validate, apply, clear, applied, isValidating };
}

// Track click on landing
export async function logReferralClick(code: string) {
  try {
    await (supabase as any).from("partner_referral_clicks").insert({
      code: code.toUpperCase(),
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      referrer: typeof document !== "undefined" ? document.referrer : null,
      landing_url: typeof window !== "undefined" ? window.location.href : null,
    });
  } catch (e) {
    console.warn("referral click log failed", e);
  }
}