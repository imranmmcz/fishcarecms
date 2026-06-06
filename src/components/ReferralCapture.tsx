import { useEffect } from "react";
import { logReferralClick } from "@/hooks/usePartnerCode";

const STORAGE_KEY = "fc_partner_ref";
const TTL_DAYS = 30;

export function setStoredReferral(code: string) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ code: code.toUpperCase(), at: Date.now() })
    );
  } catch {}
}

export function getStoredReferral(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { code, at } = JSON.parse(raw);
    if (Date.now() - at > TTL_DAYS * 86400_000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return code || null;
  } catch {
    return null;
  }
}

export function clearStoredReferral() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/** Captures ?ref=CODE into localStorage and logs a click event. */
export function ReferralCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("ref") || params.get("partner");
      if (code) {
        setStoredReferral(code);
        logReferralClick(code);
      }
    } catch {}
  }, []);
  return null;
}