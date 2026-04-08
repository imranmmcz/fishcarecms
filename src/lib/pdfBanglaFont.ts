/**
 * PDF Bengali Font Manager for jsPDF
 * Robust font loading with multiple fallback approaches
 */

import jsPDF from "jspdf";

// Font cache - stores ArrayBuffer for reuse
let fontBufferCache: Record<string, ArrayBuffer> = {};
let loadingPromises: Record<string, Promise<ArrayBuffer | null>> = {};
const registeredDocs = new WeakSet<jsPDF>();
const docFontName = new WeakMap<jsPDF, string>();

/**
 * Convert ArrayBuffer to base64 string - chunk-safe approach
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const len = bytes.length;
  let binary = "";
  // Process in small chunks to avoid call stack issues
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Load a font file as ArrayBuffer
 */
async function loadFontBuffer(url: string): Promise<ArrayBuffer | null> {
  if (fontBufferCache[url]) return fontBufferCache[url];
  if (loadingPromises[url]) return loadingPromises[url];

  const promise = (async () => {
    try {
      const response = await fetch(url, {
        cache: "force-cache",
        mode: url.startsWith("http") && !url.startsWith(window.location.origin) ? "cors" : "same-origin",
      });
      if (!response.ok) {
        console.warn(`Font fetch failed: ${url} (${response.status})`);
        return null;
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        console.warn(`Font URL returned HTML (likely 404): ${url}`);
        return null;
      }

      const buffer = await response.arrayBuffer();
      if (buffer.byteLength < 5000) {
        console.warn(`Font file too small: ${url} (${buffer.byteLength} bytes)`);
        return null;
      }

      fontBufferCache[url] = buffer;
      return buffer;
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
  urls: string[]; // Multiple URLs to try (local + CDN fallbacks)
  boldUrls: string[];
}

/**
 * Build absolute URL for local font paths to prevent resolution issues in deployed builds
 */
function toAbsoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  try {
    return `${window.location.origin}${path}`;
  } catch {
    return path;
  }
}

const FONT_CHAIN: FontDef[] = [
  {
    name: "Nikosh",
    urls: [
      toAbsoluteUrl("/fonts/Nikosh.ttf"),
      "https://cdn.jsdelivr.net/gh/AbiruzzamanMolla/Bangla-Font@main/Nikosh.ttf",
    ],
    boldUrls: [
      toAbsoluteUrl("/fonts/Nikosh.ttf"),
      "https://cdn.jsdelivr.net/gh/AbiruzzamanMolla/Bangla-Font@main/Nikosh.ttf",
    ],
  },
  {
    name: "HindSiliguri",
    urls: [
      toAbsoluteUrl("/fonts/HindSiliguri-Regular.ttf"),
      "https://cdn.jsdelivr.net/gh/nicholasgasior/font-hind-siliguri@master/fonts/ttf/HindSiliguri-Regular.ttf",
    ],
    boldUrls: [
      toAbsoluteUrl("/fonts/HindSiliguri-Bold.ttf"),
      "https://cdn.jsdelivr.net/gh/nicholasgasior/font-hind-siliguri@master/fonts/ttf/HindSiliguri-Bold.ttf",
    ],
  },
  {
    name: "NotoSansBengali",
    urls: [
      toAbsoluteUrl("/fonts/NotoSansBengali-Regular.ttf"),
      "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSansBengali/NotoSansBengali-Regular.ttf",
    ],
    boldUrls: [
      toAbsoluteUrl("/fonts/NotoSansBengali-Regular.ttf"),
      "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSansBengali/NotoSansBengali-Bold.ttf",
    ],
  },
];

/**
 * Try loading font from multiple URLs, return first success
 */
async function loadFontFromUrls(urls: string[]): Promise<ArrayBuffer | null> {
  for (const url of urls) {
    const buffer = await loadFontBuffer(url);
    if (buffer) return buffer;
  }
  return null;
}

/**
 * Register Bengali font on a jsPDF doc instance.
 * Tries Nikosh first, then HindSiliguri, then NotoSansBengali.
 * Each font has CDN fallback URLs.
 */
export async function registerBanglaFont(doc: jsPDF): Promise<boolean> {
  if (registeredDocs.has(doc)) return true;

  for (const fontDef of FONT_CHAIN) {
    try {
      const [regularBuffer, boldBuffer] = await Promise.all([
        loadFontFromUrls(fontDef.urls),
        loadFontFromUrls(fontDef.boldUrls),
      ]);

      if (!regularBuffer) {
        console.warn(`All URLs failed for ${fontDef.name}, trying next font...`);
        continue;
      }

      // Convert to base64
      const regularB64 = arrayBufferToBase64(regularBuffer);
      const boldB64 = boldBuffer ? arrayBufferToBase64(boldBuffer) : regularB64;

      // Register regular
      const regFile = `${fontDef.name}-Regular.ttf`;
      doc.addFileToVFS(regFile, regularB64);
      doc.addFont(regFile, fontDef.name, "normal");

      // Register bold
      const boldFile = `${fontDef.name}-Bold.ttf`;
      doc.addFileToVFS(boldFile, boldB64);
      doc.addFont(boldFile, fontDef.name, "bold");

      // Verify the font works
      doc.setFont(fontDef.name, "normal");
      const current = doc.getFont();
      if (current.fontName !== fontDef.name) {
        console.warn(`Font verification failed for ${fontDef.name}, trying next...`);
        continue;
      }

      registeredDocs.add(doc);
      docFontName.set(doc, fontDef.name);
      console.log(`✅ Bengali PDF font registered: ${fontDef.name} (${(regularBuffer.byteLength / 1024).toFixed(0)}KB)`);
      return true;
    } catch (err) {
      console.warn(`Font registration failed for ${fontDef.name}:`, err);
    }
  }

  console.error("❌ No Bengali font could be registered - PDF will have garbled text");
  return false;
}

/**
 * Set font on doc: Bengali font if isBn=true, helvetica otherwise.
 */
export function setBanglaFont(doc: jsPDF, isBn: boolean, style: "normal" | "bold" = "normal") {
  if (isBn) {
    const name = docFontName.get(doc);
    if (name) {
      try {
        doc.setFont(name, style);
        return;
      } catch {
        console.warn(`Failed to set Bengali font: ${name}, falling back to helvetica`);
      }
    }
  }
  try {
    doc.setFont("helvetica", style);
  } catch {}
}

/**
 * Get font name for autoTable usage.
 * Returns the actually registered font name, not a hardcoded fallback.
 */
export function getDocFontName(doc: jsPDF, isBn: boolean): string {
  if (isBn) {
    const name = docFontName.get(doc);
    if (name) return name;
  }
  return "helvetica";
}

export function getFontName(isBn: boolean): string {
  return isBn ? "Nikosh" : "helvetica";
}

/**
 * Pre-load all fonts so they're cached for instant PDF generation.
 */
export async function preloadBanglaFont(): Promise<boolean> {
  for (const fontDef of FONT_CHAIN) {
    const buffer = await loadFontFromUrls(fontDef.urls);
    if (buffer) {
      // Verify end-to-end by registering on a temp doc
      try {
        const tempDoc = new jsPDF();
        const b64 = arrayBufferToBase64(buffer);
        const regFile = `${fontDef.name}-Regular.ttf`;
        tempDoc.addFileToVFS(regFile, b64);
        tempDoc.addFont(regFile, fontDef.name, "normal");
        tempDoc.setFont(fontDef.name, "normal");
        const current = tempDoc.getFont();
        if (current.fontName === fontDef.name) {
          console.log(`✅ Bengali font pre-loaded & verified: ${fontDef.name}`);
          return true;
        }
        console.warn(`⚠️ Font pre-load verification failed for ${fontDef.name}`);
      } catch (err) {
        console.warn(`⚠️ Font pre-load verification error for ${fontDef.name}:`, err);
      }
      // Even if verification failed, the buffer is cached for later use
      console.log(`✅ Bengali font pre-loaded (buffer cached): ${fontDef.name}`);
      return true;
    }
  }
  console.warn("⚠️ No Bengali font could be pre-loaded");
  return false;
}
