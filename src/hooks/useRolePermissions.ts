/**
 * Hook to fetch and manage role-based permissions
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RolePermission {
  id: string;
  role: string;
  permission_key: string;
  is_allowed: boolean;
}

export const PERMISSION_LABELS: Record<string, string> = {
  admin_dashboard: "ড্যাশবোর্ড",
  admin_orders: "অর্ডার ম্যানেজমেন্ট",
  admin_products: "পণ্য ব্যবস্থাপনা",
  admin_inventory: "ইনভেন্টরি",
  admin_customers: "কাস্টমার",
  admin_market_prices: "বাজার দর",
  admin_reports: "রিপোর্ট",
  admin_pages: "পেজ ম্যানেজমেন্ট",
  admin_settings: "সেটিংস",
  admin_ads: "বিজ্ঞাপন",
  admin_backup: "সিস্টেম ব্যাকআপ",
  admin_suppliers: "সাপ্লায়ার",
  admin_users: "ব্যবহারকারী ব্যবস্থাপনা",
  admin_ecommerce: "ই-কমার্স ওভারভিউ",
};

export const ALL_PERMISSION_KEYS = Object.keys(PERMISSION_LABELS);

export const ROLE_LABELS: Record<string, string> = {
  admin: "সুপার অ্যাডমিন",
  manager: "ম্যানেজার",
  cashier: "ক্যাশিয়ার",
  delivery_staff: "ডেলিভারি স্টাফ",
  farmer: "কৃষক",
  blogger: "ব্লগার",
  customer: "কাস্টমার",
  user: "সাধারণ ব্যবহারকারী",
};

export const STAFF_ROLES = ["manager", "cashier", "delivery_staff"] as const;

export function useRolePermissions() {
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("role_permissions" as any)
        .select("*");

      if (error) throw error;
      setPermissions((data as any[]) || []);
    } catch (err) {
      console.error("Error fetching permissions:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const getPermissionsForRole = useCallback(
    (role: string): Record<string, boolean> => {
      const result: Record<string, boolean> = {};
      ALL_PERMISSION_KEYS.forEach((key) => {
        const perm = permissions.find(
          (p) => p.role === role && p.permission_key === key
        );
        result[key] = perm ? perm.is_allowed : false;
      });
      return result;
    },
    [permissions]
  );

  const updatePermission = useCallback(
    async (role: string, permissionKey: string, isAllowed: boolean) => {
      try {
        const existing = permissions.find(
          (p) => p.role === role && p.permission_key === permissionKey
        );

        if (existing) {
          await supabase
            .from("role_permissions" as any)
            .update({ is_allowed: isAllowed } as any)
            .eq("id", existing.id);
        } else {
          await supabase
            .from("role_permissions" as any)
            .insert({ role, permission_key: permissionKey, is_allowed: isAllowed } as any);
        }

        // Update local state
        setPermissions((prev) => {
          const idx = prev.findIndex(
            (p) => p.role === role && p.permission_key === permissionKey
          );
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], is_allowed: isAllowed };
            return updated;
          }
          return [
            ...prev,
            { id: crypto.randomUUID(), role, permission_key: permissionKey, is_allowed: isAllowed },
          ];
        });

        return true;
      } catch (err) {
        console.error("Error updating permission:", err);
        return false;
      }
    },
    [permissions]
  );

  const hasPermission = useCallback(
    (role: string, permissionKey: string): boolean => {
      if (role === "admin") return true;
      const perm = permissions.find(
        (p) => p.role === role && p.permission_key === permissionKey
      );
      return perm?.is_allowed ?? false;
    },
    [permissions]
  );

  return {
    permissions,
    isLoading,
    getPermissionsForRole,
    updatePermission,
    hasPermission,
    refetch: fetchPermissions,
  };
}
