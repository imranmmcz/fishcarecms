/**
 * AdSettingsContext - MySQL Backend API Version
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api-client';

interface AdSettings {
  id: string | number;
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
      const response = await apiClient.getAdSettings();
      if (response.data?.settings) {
        setAdSettings(response.data.settings as unknown as AdSettings);
        if (response.data.settings.ad_client_id) {
          const scriptEl = document.getElementById('adsense-script');
          if (scriptEl) {
            scriptEl.setAttribute('src', `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${response.data.settings.ad_client_id}`);
            scriptEl.setAttribute('crossorigin', 'anonymous');
          }
        }
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
