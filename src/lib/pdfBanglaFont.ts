/**
 * PDF Bengali Font Manager for jsPDF
 * Robust font loading with fallback chain: Nikosh → HindSiliguri → NotoSansBengali
 */

import jsPDF from "jspdf";

// Font cache
let fontCache: Record<string, string> = {};
let loadingPromises: Record<string, Promise<string | null>> = {};
const registeredDocs = new WeakSet<jsPDF>();
const docFontName = new WeakMap<jsPDF, string>();

/**
 * Load a font file and convert to base64 string for jsPDF embedding
 */
async function loadFontBase64(url: string): Promise<string | null> {
  // Return cached
  if (fontCache[url]) return fontCache[url];

  // Return in-flight promise
  if (loadingPromises[url]) return loadingPromises[url];

  const promise = (async () => {
    try {
      const response = await fetch(url, { cache: "force-cache" });
      if (!response.ok) {
        console.warn(`Font fetch failed: ${url} (${response.status})`);
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength < 1000) {
        console.warn(`Font file too small: ${url} (${arrayBuffer.byteLength} bytes)`);
        return null;
      }

      // Convert ArrayBuffer to base64
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
        binary += String.fromCharCode(...Array.from(chunk));
      }
      const base64 = btoa(binary);

      fontCache[url] = base64;
      return base64;
    } catch (err) {
      console.error(`Font load error: ${url}`, err);
      return null;
    }
  })();

  loadingPromises[url] = promise;
  return promise;
}

interface FontDef {
  name: string;
  regularUrl: string;
  boldUrl: string;
}

const FONT_CHAIN: FontDef[] = [
  {
    name: "Nikosh",
    regularUrl: "/fonts/Nikosh.ttf",
    boldUrl: "/fonts/Nikosh.ttf",
  },
  {
    name: "HindSiliguri",
    regularUrl: "/fonts/HindSiliguri-Regular.ttf",
    boldUrl: "/fonts/HindSiliguri-Bold.ttf",
  },
  {
    name: "NotoSansBengali",
    regularUrl: "/fonts/NotoSansBengali-Regular.ttf",
    boldUrl: "/fonts/NotoSansBengali-Regular.ttf",
  },
];

/**
 * Register Bengali font on a jsPDF doc instance.
 * Tries Nikosh first (best Bengali support), then HindSiliguri, then NotoSansBengali.
 */
export async function registerBanglaFont(doc: jsPDF): Promise<boolean> {
  if (registeredDocs.has(doc)) return true;

  for (const fontDef of FONT_CHAIN) {
    try {
      const [regularB64, boldB64] = await Promise.all([
        loadFontBase64(fontDef.regularUrl),
        fontDef.boldUrl !== fontDef.regularUrl
          ? loadFontBase64(fontDef.boldUrl)
          : loadFontBase64(fontDef.regularUrl),
      ]);

      if (!regularB64) continue;

      // Register regular
      const regFile = `${fontDef.name}-Regular.ttf`;
      doc.addFileToVFS(regFile, regularB64);
      doc.addFont(regFile, fontDef.name, "normal");

      // Register bold
      const boldFile = `${fontDef.name}-Bold.ttf`;
      doc.addFileToVFS(boldFile, boldB64 || regularB64);
      doc.addFont(boldFile, fontDef.name, "bold");

      // Verify
      doc.setFont(fontDef.name, "normal");
      const current = doc.getFont();
      if (current.fontName !== fontDef.name) {
        console.warn(`Font verification failed for ${fontDef.name}`);
        continue;
      }

      registeredDocs.add(doc);
      docFontName.set(doc, fontDef.name);
      console.log(`✅ Bengali PDF font registered: ${fontDef.name}`);
      return true;
    } catch (err) {
      console.warn(`Font registration failed for ${fontDef.name}:`, err);
    }
  }

  console.error("❌ No Bengali font could be registered");
  return false;
}

/**
 * Set font on doc: Bengali font if isBn=true, helvetica otherwise.
 */
export function setBanglaFont(doc: jsPDF, isBn: boolean, style: "normal" | "bold" = "normal") {
  if (isBn) {
    const name = docFontName.get(doc) || "Nikosh";
    try {
      doc.setFont(name, style);
    } catch {
      try {
        doc.setFont("helvetica", style);
      } catch {}
    }
  } else {
    doc.setFont("helvetica", style);
  }
}

/**
 * Get font name for autoTable usage.
 */
export function getDocFontName(doc: jsPDF, isBn: boolean): string {
  return isBn ? (docFontName.get(doc) || "Nikosh") : "helvetica";
}

export function getFontName(isBn: boolean): string {
  return isBn ? "Nikosh" : "helvetica";
}

/**
 * Pre-load all fonts so they're cached for instant PDF generation.
 */
export async function preloadBanglaFont(): Promise<boolean> {
  const results = await Promise.allSettled(
    FONT_CHAIN.flatMap((f) => [
      loadFontBase64(f.regularUrl),
      f.boldUrl !== f.regularUrl ? loadFontBase64(f.boldUrl) : Promise.resolve(null),
    ])
  );
  return results.some((r) => r.status === "fulfilled" && r.value !== null);
}
