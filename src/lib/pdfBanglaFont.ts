/**
 * PDF Font Manager for jsPDF
 * বাংলা ফন্ট সাপোর্ট: HindSiliguri (primary), NotoSansBengali, Nikosh (fallback)
 * 
 * সমাধান:
 * - একাধিক ফন্ট ফলব্যাক চেইন
 * - ফন্ট ক্যাশিং ও রেস কন্ডিশন ফিক্স
 * - jsPDF ইনস্ট্যান্স ট্র্যাকিং
 * - Bold / Normal আলাদা ফন্ট ফাইল
 */

import jsPDF from "jspdf";

// Cache structure per font file
interface FontCache {
  base64: string | null;
  loading: Promise<string | null> | null;
}

const fontCaches: Record<string, FontCache> = {};
const registeredDocs = new WeakSet<jsPDF>();

// Which Bengali font was successfully registered (so setBanglaFont uses the right name)
const docFontName = new WeakMap<jsPDF, string>();

async function loadFontAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) throw new Error(`Font fetch failed (${res.status}): ${url}`);
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength < 1000) {
      console.error("Font file too small, likely invalid:", url, buffer.byteLength);
      return null;
    }
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return btoa(binary);
  } catch (err) {
    console.error("Failed to load font:", url, err);
    return null;
  }
}

function getCachedFont(url: string): Promise<string | null> {
  if (!fontCaches[url]) {
    fontCaches[url] = { base64: null, loading: null };
  }
  const cache = fontCaches[url];
  if (cache.base64) return Promise.resolve(cache.base64);
  if (cache.loading) return cache.loading;

  cache.loading = loadFontAsBase64(url)
    .then((b64) => {
      if (b64) cache.base64 = b64;
      else cache.loading = null;
      return b64;
    })
    .catch((err) => {
      console.error("Font loading rejected:", err);
      cache.loading = null;
      return null;
    });

  return cache.loading;
}

// Font definitions with fallback priority
interface BanglaFontDef {
  name: string; // jsPDF font family name
  regularUrl: string;
  boldUrl: string; // can be same as regular if no separate bold
}

const BANGLA_FONTS: BanglaFontDef[] = [
  {
    name: "HindSiliguri",
    regularUrl: "/fonts/HindSiliguri-Regular.ttf",
    boldUrl: "/fonts/HindSiliguri-Bold.ttf",
  },
  {
    name: "NotoSansBengali",
    regularUrl: "/fonts/NotoSansBengali-Regular.ttf",
    boldUrl: "/fonts/NotoSansBengali-Regular.ttf", // variable font handles weight
  },
  {
    name: "Nikosh",
    regularUrl: "/fonts/Nikosh.ttf",
    boldUrl: "/fonts/Nikosh.ttf",
  },
];

/**
 * Try registering a single font (both regular and bold) on a jsPDF doc.
 * Returns true if successful.
 */
async function tryRegisterFont(doc: jsPDF, fontDef: BanglaFontDef): Promise<boolean> {
  try {
    const [regularBase64, boldBase64] = await Promise.all([
      getCachedFont(fontDef.regularUrl),
      fontDef.boldUrl === fontDef.regularUrl
        ? getCachedFont(fontDef.regularUrl)
        : getCachedFont(fontDef.boldUrl),
    ]);

    if (!regularBase64) return false;

    // Register regular
    const regFileName = `${fontDef.name}-Regular.ttf`;
    doc.addFileToVFS(regFileName, regularBase64);
    doc.addFont(regFileName, fontDef.name, "normal");

    // Register bold
    const boldFileName = `${fontDef.name}-Bold.ttf`;
    const boldData = boldBase64 || regularBase64;
    doc.addFileToVFS(boldFileName, boldData);
    doc.addFont(boldFileName, fontDef.name, "bold");

    // Verify by trying to set it
    doc.setFont(fontDef.name, "normal");
    const currentFont = doc.getFont();
    if (currentFont.fontName !== fontDef.name) {
      console.warn(`Font ${fontDef.name} registration seemed to succeed but setFont failed`);
      return false;
    }

    console.log(`Bengali PDF font registered: ${fontDef.name}`);
    return true;
  } catch (err) {
    console.warn(`Failed to register font ${fontDef.name}:`, err);
    return false;
  }
}

/**
 * Register the best available Bengali font with a jsPDF instance.
 * Tries fonts in order: HindSiliguri → NotoSansBengali → Nikosh
 * Uses WeakSet to prevent double-registration on the same doc.
 */
export async function registerBanglaFont(doc: jsPDF): Promise<boolean> {
  if (registeredDocs.has(doc)) return true;

  for (const fontDef of BANGLA_FONTS) {
    const success = await tryRegisterFont(doc, fontDef);
    if (success) {
      registeredDocs.add(doc);
      docFontName.set(doc, fontDef.name);
      return true;
    }
  }

  console.warn("No Bengali font could be registered - Bengali text may not render correctly");
  return false;
}

/**
 * Get the registered Bengali font name for a doc, or fallback.
 */
function getRegisteredFontName(doc: jsPDF): string {
  return docFontName.get(doc) || "HindSiliguri";
}

/**
 * Set font based on language.
 * Bengali → registered Bengali font, English → helvetica
 */
export function setBanglaFont(doc: jsPDF, isBn: boolean, style: "normal" | "bold" = "normal") {
  if (isBn) {
    const fontName = getRegisteredFontName(doc);
    try {
      doc.setFont(fontName, style);
      const currentFont = doc.getFont();
      if (currentFont.fontName !== fontName) {
        console.warn(`${fontName} set failed, falling back to helvetica`);
        doc.setFont("helvetica", style);
      }
    } catch {
      console.warn(`${fontName} not available, using helvetica`);
      doc.setFont("helvetica", style);
    }
  } else {
    doc.setFont("helvetica", style);
  }
}

/**
 * Get the font name string for autoTable usage.
 * Uses the first font name as default (HindSiliguri).
 */
export function getFontName(isBn: boolean): string {
  return isBn ? "HindSiliguri" : "helvetica";
}

/**
 * Get the actual registered font name for a specific doc instance.
 * Use this for autoTable when you have the doc reference.
 */
export function getDocFontName(doc: jsPDF, isBn: boolean): string {
  return isBn ? getRegisteredFontName(doc) : "helvetica";
}

/**
 * Pre-load all Bengali fonts so they're cached for future use.
 * Call this early (e.g., on app load) to avoid delays.
 */
export async function preloadBanglaFont(): Promise<boolean> {
  const results = await Promise.allSettled(
    BANGLA_FONTS.flatMap((f) => [
      getCachedFont(f.regularUrl),
      f.boldUrl !== f.regularUrl ? getCachedFont(f.boldUrl) : Promise.resolve(null),
    ])
  );
  return results.some((r) => r.status === "fulfilled" && r.value !== null);
}
