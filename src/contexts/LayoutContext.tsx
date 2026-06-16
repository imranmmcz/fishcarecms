import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type LayoutType = "classic" | "modern" | "megashop";

interface LayoutContextType {
  layout: LayoutType;
  setLayout: (layout: LayoutType) => void;
  isLoading: boolean;
}

const LayoutContext = createContext<LayoutContextType>({
  layout: "classic",
  setLayout: () => {},
  isLoading: true,
});

export const useLayout = () => useContext(LayoutContext);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [layout, setLayoutState] = useState<LayoutType>(() => {
    try {
      const cached = localStorage.getItem("lovable-layout-cache");
      if (cached && ["classic", "modern", "megashop"].includes(cached)) {
        return cached as LayoutType;
      }
    } catch { /* ignore */ }
    return "classic";
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from("system_settings")
          .select("setting_value")
          .eq("setting_key", "theme_layout")
          .maybeSingle();
        if (data?.setting_value && ["classic", "modern", "megashop"].includes(data.setting_value)) {
          setLayoutState(data.setting_value as LayoutType);
          try {
            localStorage.setItem("lovable-layout-cache", data.setting_value);
          } catch { /* ignore */ }
        }
      } catch (err) {
        console.error("Error loading layout:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const setLayout = (newLayout: LayoutType) => {
    setLayoutState(newLayout);
    try {
      localStorage.setItem("lovable-layout-cache", newLayout);
    } catch { /* ignore */ }
  };

  return (
    <LayoutContext.Provider value={{ layout, setLayout, isLoading }}>
      {children}
    </LayoutContext.Provider>
  );
}
