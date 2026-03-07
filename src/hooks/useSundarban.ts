import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SundarbanSettings {
  id: string;
  courier_name: string;
  api_key: string | null;
  secret_key: string | null;
  base_url: string;
  is_enabled: boolean;
  auto_create_order: boolean;
  auto_create_on_status: string;
  webhook_url: string | null;
}

export interface SundarbanConsignment {
  id: string;
  order_id: string;
  consignment_id: string | null;
  tracking_code: string | null;
  invoice: string;
  status: string;
  delivery_status: string | null;
  cod_amount: number;
  recipient_name: string | null;
  recipient_phone: string | null;
  recipient_address: string | null;
  note: string | null;
  created_at: string;
}

export const useSundarban = () => {
  const [settings, setSettings] = useState<SundarbanSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("courier_settings" as any)
        .select("*")
        .eq("courier_name", "sundarban")
        .single();

      if (data && !error) {
        setSettings(data as any);
      }
    } catch (err) {
      console.error("Failed to fetch Sundarban settings:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (updates: Partial<SundarbanSettings>) => {
    if (!settings) return false;
    try {
      const { error } = await supabase
        .from("courier_settings" as any)
        .update(updates as any)
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("সুন্দরবন কুরিয়ার সেটিংস আপডেট হয়েছে");
      await fetchSettings();
      return true;
    } catch (err) {
      console.error("Failed to update Sundarban settings:", err);
      toast.error("সেটিংস আপডেট করতে সমস্যা হয়েছে");
      return false;
    }
  };

  const callSundarbanAPI = async (action: string, body: Record<string, any> = {}) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/sundarban-courier`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action, ...body }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "API call failed");
      }
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const trackParcel = async (trackingNumber: string) => {
    const result = await callSundarbanAPI("track_parcel", { tracking_number: trackingNumber });
    if (result.error) {
      toast.error(`ট্র্যাকিং তথ্য আনতে সমস্যা: ${result.error}`);
    }
    return result;
  };

  const createBooking = async (params: {
    order_id: string;
    invoice: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    recipient_city: string;
    recipient_zone: string;
    cod_amount: number;
    weight: number;
    note?: string;
  }) => {
    const result = await callSundarbanAPI("create_booking", params);
    if (result.error) {
      toast.error(`সুন্দরবন বুকিং ব্যর্থ: ${result.error}`);
    } else if (result.data?.success) {
      toast.success("সুন্দরবন কুরিয়ারে বুকিং সফল হয়েছে");
    } else {
      toast.error(result.data?.message || "বুকিং ব্যর্থ হয়েছে");
    }
    return result;
  };

  const getTrackingUrl = (trackingNumber: string) => {
    return `https://sundarbancourier.com/tracking?tracking_id=${trackingNumber}`;
  };

  return {
    settings,
    isLoading,
    updateSettings,
    trackParcel,
    createBooking,
    getTrackingUrl,
    refreshSettings: fetchSettings,
  };
};
