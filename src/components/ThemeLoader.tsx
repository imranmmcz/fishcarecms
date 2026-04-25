import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { applyThemeColors } from "@/components/ThemeColorSettings";

export type ButtonAnimationStyle =
  | "default"
  | "scale"
  | "lift"
  | "glow"
  | "shine"
  | "push"
  | "pulse"
  | "neon";

export interface ButtonStyleOverride {
  /** URL path pattern. Supports exact match, prefix with trailing /*, or "*" for any. */
  pattern: string;
  style: ButtonAnimationStyle;
}

export function applyButtonStyle(style: string | null | undefined) {
  const root = document.documentElement;
  if (!style || style === "default") {
    root.removeAttribute("data-btn-style");
  } else {
    root.setAttribute("data-btn-style", style);
  }
}

/** Returns the override that best matches the pathname, or null. */
export function pickButtonStyleForPath(
  pathname: string,
  overrides: ButtonStyleOverride[]
): ButtonAnimationStyle | null {
  if (!overrides?.length) return null;
  // Sort by specificity: exact > prefix > wildcard. Longer patterns win ties.
  const scored = overrides
    .map((o) => {
      const p = (o.pattern || "").trim();
      let score = -1;
      if (!p) score = -1;
      else if (p === "*") score = 0;
      else if (p.endsWith("/*")) {
        const base = p.slice(0, -2) || "/";
        if (pathname === base || pathname.startsWith(base === "/" ? "/" : base + "/")) {
          score = 100 + base.length;
        }
      } else if (pathname === p) {
        score = 1000 + p.length;
      }
      return { o, score };
    })
    .filter((s) => s.score >= 0)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.o.style ?? null;
}

// Module-level cache so the route-aware loader doesn't refetch on every navigation.
let cachedGlobalStyle: ButtonAnimationStyle = "default";
let cachedOverrides: ButtonStyleOverride[] = [];
let cacheLoaded = false;
let cachePromise: Promise<void> | null = null;

async function loadButtonStyleSettings() {
  if (cacheLoaded) return;
  if (cachePromise) return cachePromise;
  cachePromise = (async () => {
    const { data } = await supabase
      .from("system_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["button_animation_style", "button_animation_overrides"]);
    data?.forEach((d) => {
      if (d.setting_key === "button_animation_style" && d.setting_value) {
        cachedGlobalStyle = d.setting_value as ButtonAnimationStyle;
      }
      if (d.setting_key === "button_animation_overrides" && d.setting_value) {
        try {
          const parsed = JSON.parse(d.setting_value);
          if (Array.isArray(parsed)) cachedOverrides = parsed;
        } catch {
          /* ignore malformed */
        }
      }
    });
    cacheLoaded = true;
  })();
  return cachePromise;
}

/** Force a refresh of cached button-style settings (call after admin saves). */
export function invalidateButtonStyleCache() {
  cacheLoaded = false;
  cachePromise = null;
}

export function ThemeLoader() {
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const { data } = await supabase
          .from("system_settings")
          .select("setting_key, setting_value")
          .or(
            "setting_key.like.theme_%,setting_key.eq.button_animation_style,setting_key.eq.button_animation_overrides"
          );

        if (data && data.length > 0) {
          const colors: Record<string, string> = {};
          let btnStyle: string | null = null;
          data.forEach((d) => {
            if (!d.setting_value) return;
            if (d.setting_key === "button_animation_style") {
              btnStyle = d.setting_value;
              cachedGlobalStyle = d.setting_value as ButtonAnimationStyle;
            } else if (d.setting_key === "button_animation_overrides") {
              try {
                const parsed = JSON.parse(d.setting_value);
                if (Array.isArray(parsed)) cachedOverrides = parsed;
              } catch {
                /* ignore */
              }
            } else {
              colors[d.setting_key] = d.setting_value;
            }
          });
          if (Object.keys(colors).length > 0) {
            applyThemeColors(colors);
          }
          applyButtonStyle(btnStyle);
          cacheLoaded = true;
        }
      } catch (err) {
        console.error("Error loading theme:", err);
      }
    };
    loadTheme();
  }, []);

  return null;
}

/**
 * Route-aware button-style applier. Mount inside <BrowserRouter>.
 * Picks the best per-page override for the current path, or falls back
 * to the global button_animation_style.
 */
export function ButtonStyleRouteSync() {
  const { pathname } = useLocation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadButtonStyleSettings();
      if (cancelled) return;
      const matched = pickButtonStyleForPath(pathname, cachedOverrides);
      applyButtonStyle(matched ?? cachedGlobalStyle);
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
