/**
 * Abandoned Cart Tracker
 * Tracks when users visit checkout page with items but leave without ordering.
 * Captures: cart items, user info, UTM params, referrer, and source.
 */
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

function getSessionId(): string {
  let sid = sessionStorage.getItem("_ac_sid");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("_ac_sid", sid);
  }
  return sid;
}

function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
  };
}

function detectSource(): string {
  const ref = document.referrer.toLowerCase();
  if (!ref) return "direct";
  if (ref.includes("google")) return "google";
  if (ref.includes("facebook") || ref.includes("fb.com")) return "facebook";
  if (ref.includes("youtube")) return "youtube";
  if (ref.includes("instagram")) return "instagram";
  if (ref.includes("tiktok")) return "tiktok";
  return "referral";
}

function getCheckoutFormData() {
  try {
    const raw = sessionStorage.getItem("_checkout_form");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function useAbandonedCartTracker() {
  const { user } = useAuth();
  const { items, subtotal } = useCart();
  const location = useLocation();
  const savedRef = useRef(false);
  const checkoutVisited = useRef(false);

  // Detect when user enters checkout
  useEffect(() => {
    if (location.pathname === "/checkout" && items.length > 0) {
      checkoutVisited.current = true;
      savedRef.current = false;
    }
  }, [location.pathname, items.length]);

  // Save abandoned cart when leaving checkout without completing
  useEffect(() => {
    if (!checkoutVisited.current) return;
    if (location.pathname === "/checkout") return; // Still on checkout
    if (location.pathname.startsWith("/order-confirmation")) {
      // Order was completed - don't save as abandoned
      checkoutVisited.current = false;
      savedRef.current = false;
      return;
    }

    // User left checkout without completing
    if (!savedRef.current && items.length > 0) {
      savedRef.current = true;
      checkoutVisited.current = false;

      const utm = getUtmParams();
      const cartItems = items.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image_url,
      }));

      const formData = getCheckoutFormData();

      supabase.from("abandoned_carts").insert({
        user_id: user?.id || null,
        session_id: getSessionId(),
        customer_name: formData.name || (user as any)?.full_name || null,
        customer_phone: formData.phone || (user as any)?.mobile || null,
        customer_email: user?.email || null,
        division: formData.division || null,
        district: formData.district || null,
        upazila: formData.upazila || null,
        shipping_address: formData.address || null,
        cart_items: cartItems,
        cart_total: subtotal,
        source: detectSource(),
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        referrer_url: document.referrer || null,
        user_agent: navigator.userAgent,
        status: "abandoned",
      } as any).then(({ error }) => {
        if (error) console.error("Abandoned cart tracking error:", error);
        // Clear form data after saving
        try { sessionStorage.removeItem("_checkout_form"); } catch {}
      });
    }
  }, [location.pathname, items, subtotal, user]);

  // Also save on page unload if on checkout
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (location.pathname !== "/checkout" || items.length === 0) return;

      const utm = getUtmParams();
      const cartItems = items.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image_url,
      }));

      // Use sendBeacon for reliable unload tracking
      const payload = JSON.stringify({
        user_id: user?.id || null,
        session_id: getSessionId(),
        customer_name: (user as any)?.full_name || null,
        customer_phone: (user as any)?.mobile || null,
        customer_email: user?.email || null,
        cart_items: cartItems,
        cart_total: subtotal,
        source: detectSource(),
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        referrer_url: document.referrer || null,
        user_agent: navigator.userAgent,
        status: "abandoned",
      });

      // Use supabase REST API via sendBeacon
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/abandoned_carts`;
      navigator.sendBeacon?.(url + `?apikey=${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`, new Blob([payload], { type: "application/json" }));
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [location.pathname, items, subtotal, user]);
}
