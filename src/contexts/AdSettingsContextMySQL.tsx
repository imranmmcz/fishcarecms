/**
 * MySQL Backend AdSettingsContext
 * Hostinger-এ ডেপ্লয় করার সময় এই Context ব্যবহার করুন
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, AdSettings } from '@/lib/api-client';

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
        setAdSettings(response.data.settings);
        
        // Dynamically update AdSense script if client ID is set
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
