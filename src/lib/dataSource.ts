/**
 * Data Source Router (Hybrid Supabase ⇄ MySQL).
 *
 * Per-module routing flag stored in Supabase `system_settings`
 * under key `data_source_routing`. Mirrored in localStorage so
 * synchronous reads work in render paths.
 *
 * Default for every module is `supabase` — nothing changes
 * until an admin explicitly flips a module to `mysql`.
 */
import { supabase } from "@/integrations/supabase/client";

export const ROUTABLE_MODULES = [
  "products",
  "product_variations",
  "categories",
  "brands",
  "orders",
  "order_items",
  "customers",
  "pos_sales",
  "pos_sale_items",
  "pos_shifts",
  "pos_expenses",
  "stock_adjustments",
] as const;

export type RoutableModule = (typeof ROUTABLE_MODULES)[number];
export type DataSource = "supabase" | "mysql";
export type RoutingMap = Record<RoutableModule, DataSource>;

/** Modules that have a working MySQL backend route today.
 *  Others appear in the admin UI but the toggle warns the user. */
export const MYSQL_READY_MODULES: ReadonlySet<RoutableModule> = new Set([
  "products",
  "orders",
  "order_items",
  "customers",
]);

const LS_KEY = "data_source_routing";
const SETTING_KEY = "data_source_routing";

const defaultRouting = (): RoutingMap =>
  ROUTABLE_MODULES.reduce((acc, m) => {
    acc[m] = "supabase";
    return acc;
  }, {} as RoutingMap);

let cache: RoutingMap | null = null;

function readLocal(): RoutingMap {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultRouting();
    const parsed = JSON.parse(raw) as Partial<RoutingMap>;
    return { ...defaultRouting(), ...parsed };
  } catch {
    return defaultRouting();
  }
}

function writeLocal(map: RoutingMap) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/** Synchronous lookup used by repo facades on every call. */
export function getDataSource(module: RoutableModule): DataSource {
  if (!cache) cache = readLocal();
  return cache[module] ?? "supabase";
}

export function isMysql(module: RoutableModule): boolean {
  return getDataSource(module) === "mysql";
}

export function getRouting(): RoutingMap {
  if (!cache) cache = readLocal();
  return { ...cache };
}

/** Pull routing from Supabase and hydrate the local cache. Call on app boot. */
export async function loadRoutingFromServer(): Promise<RoutingMap> {
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", SETTING_KEY)
      .maybeSingle();
    if (error) throw error;
    if (data?.setting_value) {
      const parsed =
        typeof data.setting_value === "string"
          ? JSON.parse(data.setting_value)
          : (data.setting_value as Partial<RoutingMap>);
      const merged: RoutingMap = { ...defaultRouting(), ...parsed };
      cache = merged;
      writeLocal(merged);
      return merged;
    }
  } catch (e) {
    console.warn("[dataSource] failed to load routing, using local:", e);
  }
  cache = readLocal();
  return cache;
}

/** Persist routing both to localStorage and Supabase. Admin only. */
export async function saveRouting(map: RoutingMap): Promise<void> {
  cache = { ...map };
  writeLocal(cache);
  const payload = JSON.stringify(cache);
  // Upsert: try update first, then insert if missing.
  const { error: updErr } = await supabase
    .from("system_settings")
    .update({ setting_value: payload })
    .eq("setting_key", SETTING_KEY);
  if (updErr) throw updErr;

  const { data: existing } = await supabase
    .from("system_settings")
    .select("id")
    .eq("setting_key", SETTING_KEY)
    .maybeSingle();
  if (!existing) {
    const { error: insErr } = await supabase.from("system_settings").insert({
      setting_key: SETTING_KEY,
      setting_value: payload,
      description: "Per-module data-source routing (supabase | mysql)",
    });
    if (insErr) throw insErr;
  }
}

export function resetCache() {
  cache = null;
}