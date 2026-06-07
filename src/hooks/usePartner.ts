import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Partner {
  id: string;
  user_id: string;
  status: string;
  full_name: string | null;
  mobile: string | null;
  email: string | null;
  bkash_number?: string | null;
  nagad_number?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  account_name?: string | null;
  profile_photo_url?: string | null;
  nid_front_url?: string | null;
  nid_back_url?: string | null;
  [k: string]: any;
}

export function usePartner() {
  const { user } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) { setPartner(null); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("partners").select("*").eq("user_id", user.id).maybeSingle();
    setPartner(data || null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  return { partner, loading, reload: load };
}