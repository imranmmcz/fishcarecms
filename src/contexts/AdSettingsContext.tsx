/**
 * AdSettingsContext - Supabase/Lovable Cloud Version
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface AdSettings {
  id: string;
  ad_client_id: string | null;
  header_ad_enabled: boolean;
  header_ad_slot: string | null;
  sidebar_ad_enabled: boolean;
  sidebar_ad_slot: string | null;
  footer_ad_enabled: boolean;
  footer_ad_slot: string | null;
  in_article_ad_enabled: boolean;
  in_article_ad_slot: string | null;
  between_modules_ad_enabled: boolean;
  between_modules_ad_slot: string | null;
}

interface AdSettingsContextType {
  adSettings: AdSettings | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const AdSettingsContext = createContext<AdSettingsContextType | undefined>(undefined);

export const AdSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [adSettings, setAdSettings] = useState<AdSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("ad_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setAdSettings({
          id: data.id,
          ad_client_id: data.ad_client_id,
          header_ad_enabled: data.header_ad_enabled ?? false,
          header_ad_slot: data.header_ad_slot,
          sidebar_ad_enabled: data.sidebar_ad_enabled ?? false,
          sidebar_ad_slot: data.sidebar_ad_slot,
          footer_ad_enabled: data.footer_ad_enabled ?? false,
          footer_ad_slot: data.footer_ad_slot,
          in_article_ad_enabled: data.in_article_ad_enabled ?? false,
          in_article_ad_slot: data.in_article_ad_slot,
          between_modules_ad_enabled: data.between_modules_ad_enabled ?? false,
          between_modules_ad_slot: data.between_modules_ad_slot,
        });
      }
    } catch (err) {
      console.error('Error fetching ad settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdSettings();
  }, []);

  return (
    <AdSettingsContext.Provider value={{ adSettings, loading, refetch: fetchAdSettings }}>
      {children}
    </AdSettingsContext.Provider>
  );
};

export const useAdSettings = () => {
  const context = useContext(AdSettingsContext);
  if (context === undefined) {
    throw new Error('useAdSettings must be used within an AdSettingsProvider');
  }
  return context;
};
