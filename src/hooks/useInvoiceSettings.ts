/**
 * Hook to fetch invoice settings from system_settings
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface InvoiceCompanySettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  companyLogo: string;
}

const defaults: InvoiceCompanySettings = {
  companyName: "FishCare Pro",
  companyAddress: "ঢাকা, বাংলাদেশ",
  companyPhone: "+880 1XXX-XXXXXX",
  companyEmail: "support@fishcare.com.bd",
  companyWebsite: "www.fishcare.com.bd",
  companyLogo: "",
};

const keyMap: Record<string, keyof InvoiceCompanySettings> = {
  invoice_company_name: "companyName",
  invoice_company_address: "companyAddress",
  invoice_company_phone: "companyPhone",
  invoice_company_email: "companyEmail",
  invoice_company_website: "companyWebsite",
  invoice_company_logo: "companyLogo",
};

export function useInvoiceSettings() {
  const [settings, setSettings] = useState<InvoiceCompanySettings>(defaults);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from("system_settings")
          .select("setting_key, setting_value")
          .in("setting_key", Object.keys(keyMap));

        if (data && data.length > 0) {
          const updated = { ...defaults };
          data.forEach((s) => {
            const field = keyMap[s.setting_key];
            if (field && s.setting_value) {
              updated[field] = s.setting_value;
            }
          });
          setSettings(updated);
        }
      } catch (err) {
        console.error("Error fetching invoice settings:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  return { settings, isLoading };
}
