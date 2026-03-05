/**
 * PDF Font Manager for jsPDF
 * Nikosh ফন্ট (বাংলা) এবং Roboto ফন্ট (ইংরেজি) লোড ও রেজিস্টার করে
 */

import jsPDF from "jspdf";

let nikoshBase64Cache: string | null = null;
let nikoshLoading: Promise<string | null> | null = null;

async function loadFontAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Font fetch failed: ${url}`);
    const buffer = await res.arrayBuffer();
    const binary = Array.from(new Uint8Array(buffer))
      .map((b) => String.fromCharCode(b))
      .join("");
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
    if (base64) nikoshBase64Cache = base64;
    else nikoshLoading = null;
    return base64;
  });

  return nikoshLoading;
}

/**
 * Register Nikosh font with a jsPDF instance.
 * Call this once before using setBanglaFont().
 */
export async function registerBanglaFont(doc: jsPDF): Promise<boolean> {
  const base64 = await loadNikoshFont();
  if (!base64) return false;

  try {
    doc.addFileToVFS("Nikosh.ttf", base64);
    doc.addFont("Nikosh.ttf", "Nikosh", "normal");
    // Register same font for bold (Nikosh doesn't have a separate bold file)
    doc.addFileToVFS("Nikosh-Bold.ttf", base64);
    doc.addFont("Nikosh-Bold.ttf", "Nikosh", "bold");
    return true;
  } catch (err) {
    console.error("Failed to register Nikosh font:", err);
    return false;
  }
}

/**
 * Set font based on language.
 * Bengali → Nikosh, English → helvetica (clean, professional built-in)
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

/**
 * Get the font name string for autoTable usage
 */
export function getFontName(isBn: boolean): string {
  return isBn ? "Nikosh" : "helvetica";
}
