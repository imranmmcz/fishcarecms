import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useActivityLogger = () => {
  const { user } = useAuth();
  const location = useLocation();
  const lastPath = useRef<string>("");

  useEffect(() => {
    if (!user || location.pathname === lastPath.current) return;
    lastPath.current = location.pathname;

    const logActivity = async () => {
      try {
        await supabase.from("user_activity_logs").insert({
          user_id: user.id,
          activity_type: "page_view",
          page_path: location.pathname,
          description: `পেজ ভিজিট: ${location.pathname}`,
        } as any);
      } catch (error) {
        // Silent fail - don't interrupt user experience
      }
    };

    logActivity();
  }, [user, location.pathname]);
};
