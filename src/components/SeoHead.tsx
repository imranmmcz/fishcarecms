import { useEffect } from "react";

interface SeoHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  keywords?: string;
  imageAlt?: string;
}

/**
 * Dynamically updates document meta tags for SEO, Open Graph, and Twitter Cards.
 * Place in any page component to override defaults from index.html.
 */
const SeoHead = ({
  title,
  description,
  image,
  url,
  type = "website",
  keywords,
  imageAlt,
}: SeoHeadProps) => {
  useEffect(() => {
    const baseUrl = "https://fishcal.lovable.app";
    const defaultImage = `${baseUrl}/icons/icon-512x512.png`;

    const fullTitle = title
      ? `${title} | FishCare BD`
      : "বৈজ্ঞানিক মাছ চাষ ব্যবস্থাপনা | মৎস্য খাত ক্যালকুলেটর";
    const fullUrl = url ? `${baseUrl}${url}` : baseUrl;
    const metaImage = image || defaultImage;
    const metaDesc =
      description ||
      "বাংলাদেশের মৎস্য খাতের জন্য সমন্বিত ক্যালকুলেটর সিস্টেম।";
    const metaAlt = imageAlt || title || "FishCare BD";

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
    setMeta("property", "og:site_name", "FishCare BD");
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
      document.title = "বৈজ্ঞানিক মাছ চাষ ব্যবস্থাপনা | মৎস্য খাত ক্যালকুলেটর";
    };
  }, [title, description, image, url, type, keywords, imageAlt]);

  return null;
};

export default SeoHead;
