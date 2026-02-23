import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CourierSettings {
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

interface SteadfastConsignment {
  id: string;
  order_id: string;
  consignment_id: string | null;
  tracking_code: string | null;
  invoice: string;
  status: string;
  delivery_status: string | null;
  cod_amount: number;
  charge: number;
  recipient_name: string | null;
  recipient_phone: string | null;
  recipient_address: string | null;
  note: string | null;
  api_response: any;
  created_at: string;
}

export const useSteadfast = () => {
  const [settings, setSettings] = useState<CourierSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("courier_settings" as any)
        .select("*")
        .eq("courier_name", "steadfast")
        .single();

      if (data && !error) {
        setSettings(data as any);
      }
    } catch (err) {
      console.error("Failed to fetch courier settings:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (updates: Partial<CourierSettings>) => {
    if (!settings) return false;
    try {
      const { error } = await supabase
        .from("courier_settings" as any)
        .update(updates as any)
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("সেটিংস আপডেট হয়েছে");
      await fetchSettings();
      return true;
    } catch (err) {
      console.error("Failed to update settings:", err);
      toast.error("সেটিংস আপডেট করতে সমস্যা হয়েছে");
      return false;
    }
  };

  const callSteadfastAPI = async (action: string, body: Record<string, any> = {}) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/steadfast-courier`,
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

  const createOrder = async (params: {
    order_id: string;
    invoice: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    cod_amount: number;
    note?: string;
  }) => {
    const result = await callSteadfastAPI("create_order", params);
    if (result.error) {
      toast.error(`কুরিয়ার অর্ডার তৈরি ব্যর্থ: ${result.error}`);
    } else if (result.data?.status === 200) {
      toast.success("Steadfast-এ অর্ডার সফলভাবে তৈরি হয়েছে");
    } else {
      toast.error(result.data?.message || "কুরিয়ার অর্ডার তৈরি ব্যর্থ");
    }
    return result;
  };

  const checkStatus = async (consignment_id: string) => {
    return callSteadfastAPI("check_status_by_cid", { consignment_id });
  };

  const getBalance = async () => {
    return callSteadfastAPI("get_balance");
  };

  const fraudCheck = async (phone: string) => {
    return callSteadfastAPI("fraud_check", { phone });
  };

  const syncAllStatuses = async () => {
    const result = await callSteadfastAPI("sync_all_statuses");
    if (result.error) {
      toast.error("স্ট্যাটাস সিঙ্ক ব্যর্থ");
    } else {
      toast.success(`${result.data?.synced || 0}টি কনসাইনমেন্ট সিঙ্ক হয়েছে`);
    }
    return result;
  };

  const getConsignments = async (orderId?: string) => {
    let query = supabase
      .from("steadfast_consignments" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (orderId) {
      query = query.eq("order_id", orderId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Failed to fetch consignments:", error);
      return [];
    }
    return (data || []) as unknown as SteadfastConsignment[];
  };

  return {
    settings,
    isLoading,
    updateSettings,
    createOrder,
    checkStatus,
    getBalance,
    fraudCheck,
    syncAllStatuses,
    getConsignments,
    refreshSettings: fetchSettings,
  };
};
