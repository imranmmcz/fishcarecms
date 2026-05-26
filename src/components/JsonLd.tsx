import { useEffect } from "react";

interface JsonLdProps {
  data: Record<string, unknown>;
  id?: string;
}

/**
 * Inject a JSON-LD <script> tag into <head> for rich-result structured data.
 * Cleans up on unmount and updates in place when `data` changes.
 */
const JsonLd = ({ data, id = "ld-json-route" }: JsonLdProps) => {
  useEffect(() => {
    let el = document.getElementById(id) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
    return () => {
      const existing = document.getElementById(id);
      if (existing) existing.remove();
    };
  }, [data, id]);

  return null;
};

export default JsonLd;