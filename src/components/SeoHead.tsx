import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SeoHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  keywords?: string;
  imageAlt?: string;
}

// Cache for tab title settings to avoid repeated queries
let cachedTabTitle: string | null = null;
let cachedSuffix: string | null = null;
let fetchPromise: Promise<void> | null = null;

const fetchTabTitleSettings = async () => {
  if (cachedTabTitle !== null) return;
  if (fetchPromise) {
    await fetchPromise;
    return;
  }
  fetchPromise = (async () => {
    try {
      const { data } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["seo_browser_tab_title", "seo_site_name_suffix"]);

      if (data) {
        const titleRow = data.find(d => d.setting_key === "seo_browser_tab_title");
        const suffixRow = data.find(d => d.setting_key === "seo_site_name_suffix");
        cachedTabTitle = titleRow?.setting_value || "";
        cachedSuffix = suffixRow?.setting_value || "";
      }
    } catch (err) {
      console.error("Error fetching tab title settings:", err);
      cachedTabTitle = "";
      cachedSuffix = "";
    }
  })();
  await fetchPromise;
};

const SeoHead = ({
  title,
  description,
  image,
  url,
  type = "website",
  keywords,
  imageAlt,
}: SeoHeadProps) => {
  const [tabSettings, setTabSettings] = useState({ title: cachedTabTitle, suffix: cachedSuffix });

  useEffect(() => {
    let cancelled = false;
    fetchTabTitleSettings().then(() => {
      if (!cancelled) {
        setTabSettings({ title: cachedTabTitle, suffix: cachedSuffix });
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const baseUrl = "https://fishcare.com.bd";
    const defaultImage = `${baseUrl}/icons/icon-512x512.png`;

    const defaultTabTitle = tabSettings.title || "Fish Care | Fish Medicine, Pond Calculator & Aquaculture Solutions";
    const siteNameSuffix = tabSettings.suffix || "Fish Care";

    const fullTitle = title
      ? `${title} | ${siteNameSuffix}`
      : defaultTabTitle;
    const fullUrl = url ? `${baseUrl}${url}` : baseUrl;
    const metaImage = image || defaultImage;
    const metaDesc =
      description ||
      "Fish Care provides fish medicine information, disease management, pond calculators, feed formulation, fish farming dashboard and aquaculture solutions in Bangladesh.";
    const metaAlt = imageAlt || title || siteNameSuffix;

    // Update document title
    document.title = fullTitle;

    // Helper to set a meta tag
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Standard meta
    setMeta("name", "description", metaDesc);
    if (keywords) setMeta("name", "keywords", keywords);

    // Open Graph
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", metaDesc);
    setMeta("property", "og:type", type);
    setMeta("property", "og:url", fullUrl);
    setMeta("property", "og:image", metaImage);
    setMeta("property", "og:image:alt", metaAlt);
    setMeta("property", "og:site_name", siteNameSuffix);
    setMeta("property", "og:locale", "bn_BD");

    // Twitter Card
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", metaDesc);
    setMeta("name", "twitter:image", metaImage);
    setMeta("name", "twitter:image:alt", metaAlt);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", fullUrl);

    // Cleanup: restore defaults on unmount
    return () => {
      document.title = defaultTabTitle;
    };
  }, [title, description, image, url, type, keywords, imageAlt, tabSettings]);

  return null;
};

export default SeoHead;
