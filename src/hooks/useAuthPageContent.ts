import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AuthPageContent {
  loginContent: Record<string, any>;
  registerContent: Record<string, any>;
  siteLogoUrl: string;
  siteName: string;
}

export function useAuthPageContent() {
  const [content, setContent] = useState<AuthPageContent>({
    loginContent: {},
    registerContent: {},
    siteLogoUrl: "",
    siteName: "মাছ চাষ ম্যানেজমেন্ট",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from("page_content")
          .select("section_key, content")
          .in("section_key", ["auth_login", "auth_register", "header"]);

        if (data) {
          const login = data.find(d => d.section_key === "auth_login");
          const register = data.find(d => d.section_key === "auth_register");
          const header = data.find(d => d.section_key === "header");
          const headerContent = (header?.content as Record<string, any>) || {};

          setContent({
            loginContent: (login?.content as Record<string, any>) || {},
            registerContent: (register?.content as Record<string, any>) || {},
            siteLogoUrl: headerContent.logoUrl || "",
            siteName: headerContent.companyName || "মাছ চাষ ম্যানেজমেন্ট",
          });
        }
      } catch (err) {
        console.error("Error fetching auth page content:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { ...content, loading };
}
