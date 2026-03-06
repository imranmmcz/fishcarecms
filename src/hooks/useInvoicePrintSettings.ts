/**
 * Hook to fetch all invoice print settings from system_settings
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface InvoicePrintSettings {
  template: "minimal" | "modern" | "pos" | "detailed";
  languageMode: "bn" | "en" | "dual";
  paperSize: "a4" | "pos80";
  logoPosition: "left" | "center" | "right";
  showQr: boolean;
  showPaymentMethod: boolean;
  showProductImage: boolean;
  showTax: boolean;
  footerText: string;
  footerTextBn: string;
  primaryColor: string;
  socialFacebook: string;
  socialYoutube: string;
  // Company settings (from existing keys)
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  companyLogo: string;
}

const defaults: InvoicePrintSettings = {
  template: "modern",
  languageMode: "bn",
  paperSize: "a4",
  logoPosition: "left",
  showQr: false,
  showPaymentMethod: true,
  showProductImage: false,
  showTax: false,
  footerText: "",
  footerTextBn: "",
  primaryColor: "#167850",
  socialFacebook: "",
  socialYoutube: "",
  companyName: "FishCare Pro",
  companyAddress: "ঢাকা, বাংলাদেশ",
  companyPhone: "+880 1XXX-XXXXXX",
  companyEmail: "support@fishcare.com.bd",
  companyWebsite: "www.fishcare.com.bd",
  companyLogo: "",
};

const keyMap: Record<string, keyof InvoicePrintSettings> = {
  invoice_template: "template",
  invoice_language_mode: "languageMode",
  invoice_paper_size: "paperSize",
  invoice_logo_position: "logoPosition",
  invoice_show_qr: "showQr",
  invoice_show_payment_method: "showPaymentMethod",
  invoice_show_product_image: "showProductImage",
  invoice_show_tax: "showTax",
  invoice_footer_text: "footerText",
  invoice_footer_text_bn: "footerTextBn",
  invoice_primary_color: "primaryColor",
  invoice_social_facebook: "socialFacebook",
  invoice_social_youtube: "socialYoutube",
  invoice_company_name: "companyName",
  invoice_company_address: "companyAddress",
  invoice_company_phone: "companyPhone",
  invoice_company_email: "companyEmail",
  invoice_company_website: "companyWebsite",
  invoice_company_logo: "companyLogo",
};

const booleanFields: (keyof InvoicePrintSettings)[] = [
  "showQr", "showPaymentMethod", "showProductImage", "showTax",
];

export function useInvoicePrintSettings() {
  const [settings, setSettings] = useState<InvoicePrintSettings>(defaults);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .in("setting_key", Object.keys(keyMap));

      if (data && data.length > 0) {
        const updated = { ...defaults } as any;
        data.forEach((s) => {
          const field = keyMap[s.setting_key];
          if (field && s.setting_value !== null && s.setting_value !== undefined) {
            if (booleanFields.includes(field)) {
              updated[field] = s.setting_value === "true";
            } else {
              updated[field] = s.setting_value;
            }
          }
        });
        setSettings(updated);
      }
    } catch (err) {
      console.error("Error fetching invoice print settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, isLoading, refetch: fetchSettings };
}
