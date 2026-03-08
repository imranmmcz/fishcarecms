/**
 * PDF Font Manager for jsPDF
 * Nikosh ফন্ট (বাংলা) এবং Helvetica ফন্ট (ইংরেজি) লোড ও রেজিস্টার করে
 * 
 * সমস্যা সমাধান:
 * - ফন্ট ক্যাশিং ও রেস কন্ডিশন ফিক্স
 * - এরর হ্যান্ডলিং উন্নত
 * - jsPDF ইনস্ট্যান্স ট্র্যাকিং যাতে একই ডকে দুবার রেজিস্টার না হয়
 */

import jsPDF from "jspdf";

let nikoshBase64Cache: string | null = null;
let nikoshLoading: Promise<string | null> | null = null;
const registeredDocs = new WeakSet<jsPDF>();

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
    // Process in chunks to avoid call stack issues with large fonts
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

async function loadNikoshFont(): Promise<string | null> {
  if (nikoshBase64Cache) return nikoshBase64Cache;
  if (nikoshLoading) return nikoshLoading;

  nikoshLoading = loadFontAsBase64("/fonts/Nikosh.ttf").then((base64) => {
    if (base64) {
      nikoshBase64Cache = base64;
    } else {
      // Reset so next call retries
      nikoshLoading = null;
    }
    return base64;
  }).catch((err) => {
    console.error("Font loading promise rejected:", err);
    nikoshLoading = null;
    return null;
  });

  return nikoshLoading;
}

/**
 * Register Nikosh font with a jsPDF instance.
 * Call this once before using setBanglaFont().
 * Uses WeakSet to prevent double-registration on the same doc.
 */
export async function registerBanglaFont(doc: jsPDF): Promise<boolean> {
  // Skip if already registered on this doc
  if (registeredDocs.has(doc)) return true;

  const base64 = await loadNikoshFont();
  if (!base64) {
    console.warn("Nikosh font not available - Bengali text may not render correctly in PDF");
    return false;
  }

  try {
    doc.addFileToVFS("Nikosh.ttf", base64);
    doc.addFont("Nikosh.ttf", "Nikosh", "normal");
    // Register same font data for bold style
    doc.addFileToVFS("Nikosh-Bold.ttf", base64);
    doc.addFont("Nikosh-Bold.ttf", "Nikosh", "bold");
    registeredDocs.add(doc);
    return true;
  } catch (err) {
    console.error("Failed to register Nikosh font:", err);
    return false;
  }
}

/**
 * Set font based on language.
 * Bengali → Nikosh, English → helvetica
 */
export function setBanglaFont(doc: jsPDF, isBn: boolean, style: "normal" | "bold" = "normal") {
  if (isBn) {
    try {
      doc.setFont("Nikosh", style);
      // Verify the font was actually set
      const currentFont = doc.getFont();
      if (currentFont.fontName !== "Nikosh") {
        console.warn("Nikosh font set failed, falling back to helvetica");
        doc.setFont("helvetica", style);
      }
    } catch {
      console.warn("Nikosh font not available, using helvetica");
      doc.setFont("helvetica", style);
    }
  } else {
    doc.setFont("helvetica", style);
  }
}

/**
 * Get the font name string for autoTable usage
 */
export function getFontName(isBn: boolean): string {
  return isBn ? "Nikosh" : "helvetica";
}

/**
 * Pre-load the Nikosh font so it's cached for future use.
 * Call this early (e.g., on app load) to avoid delays when generating PDFs.
 */
export async function preloadBanglaFont(): Promise<boolean> {
  const result = await loadNikoshFont();
  return result !== null;
}
