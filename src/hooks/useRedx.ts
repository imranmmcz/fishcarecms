import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RedxSettings {
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

export const useRedx = () => {
  const [settings, setSettings] = useState<RedxSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("courier_settings" as any)
        .select("*")
        .eq("courier_name", "redx")
        .single();

      if (data && !error) {
        setSettings(data as any);
      }
    } catch (err) {
      console.error("Failed to fetch RedX settings:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (updates: Partial<RedxSettings>) => {
    if (!settings) return false;
    try {
      const { error } = await supabase
        .from("courier_settings" as any)
        .update(updates as any)
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("RedX কুরিয়ার সেটিংস আপডেট হয়েছে");
      await fetchSettings();
      return true;
    } catch (err) {
      console.error("Failed to update RedX settings:", err);
      toast.error("সেটিংস আপডেট করতে সমস্যা হয়েছে");
      return false;
    }
  };

  const callRedxAPI = async (action: string, body: Record<string, any> = {}) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/redx-courier`,
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

  const trackParcel = async (trackingId: string) => {
    const result = await callRedxAPI("track_parcel", { tracking_id: trackingId });
    if (result.error) {
      toast.error(`ট্র্যাকিং তথ্য আনতে সমস্যা: ${result.error}`);
    }
    return result;
  };

  const createParcel = async (params: {
    order_id: string;
    invoice: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    recipient_area: string;
    cod_amount: number;
    weight: number;
    note?: string;
  }) => {
    const result = await callRedxAPI("create_parcel", params);
    if (result.error) {
      toast.error(`RedX পার্সেল তৈরি ব্যর্থ: ${result.error}`);
    } else if (result.data?.success) {
      toast.success("RedX-এ পার্সেল সফলভাবে তৈরি হয়েছে");
    } else {
      toast.error(result.data?.message || "পার্সেল তৈরি ব্যর্থ হয়েছে");
    }
    return result;
  };

  const getTrackingUrl = (trackingId: string) => {
    return `https://redx.com.bd/track-parcel/?trackingId=${trackingId}`;
  };

  const getAreas = async () => {
    return callRedxAPI("get_areas");
  };

  return {
    settings,
    isLoading,
    updateSettings,
    trackParcel,
    createParcel,
    getTrackingUrl,
    getAreas,
    refreshSettings: fetchSettings,
  };
};
