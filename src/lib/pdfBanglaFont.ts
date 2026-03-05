/**
 * Bangla Font Loader for jsPDF
 * Nikosh ফন্ট লোড করে jsPDF এ রেজিস্টার করে
 */

import jsPDF from "jspdf";

let fontBase64Cache: string | null = null;
let fontLoading: Promise<string | null> | null = null;

async function loadFontAsBase64(): Promise<string | null> {
  if (fontBase64Cache) return fontBase64Cache;
  if (fontLoading) return fontLoading;

  fontLoading = fetch("/fonts/Nikosh.ttf")
    .then((res) => {
      if (!res.ok) throw new Error("Font fetch failed");
      return res.arrayBuffer();
    })
    .then((buffer) => {
      const binary = Array.from(new Uint8Array(buffer))
        .map((b) => String.fromCharCode(b))
        .join("");
      const base64 = btoa(binary);
      fontBase64Cache = base64;
      return base64;
    })
    .catch((err) => {
      console.error("Failed to load Nikosh font:", err);
      fontLoading = null;
      return null;
    });

  return fontLoading;
}

/**
 * Register Nikosh font with a jsPDF instance.
 * Call this once before using setBanglaFont().
 */
export async function registerBanglaFont(doc: jsPDF): Promise<boolean> {
  const base64 = await loadFontAsBase64();
  if (!base64) return false;

  try {
    doc.addFileToVFS("Nikosh.ttf", base64);
    doc.addFont("Nikosh.ttf", "Nikosh", "normal");
    return true;
  } catch (err) {
    console.error("Failed to register Nikosh font:", err);
    return false;
  }
}

/**
 * Set font to Nikosh (Bengali) or helvetica (English) based on language.
 */
export function setBanglaFont(doc: jsPDF, isBn: boolean, style: "normal" | "bold" = "normal") {
  if (isBn) {
    try {
      doc.setFont("Nikosh", style);
    } catch {
      doc.setFont("helvetica", style);
    }
  } else {
    doc.setFont("helvetica", style);
  }
}
