/**
 * Invoice PDF Generator - Multi-template, Bengali/English/Dual support
 * 4 Templates: minimal, modern, pos, detailed
 * QR Code & Product Image support
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import type { Order } from "@/lib/api-client";
import { registerBanglaFont, setBanglaFont, getDocFontName } from "@/lib/pdfBanglaFont";
import type { InvoicePrintSettings } from "@/hooks/useInvoicePrintSettings";

// Generate QR code as base64 data URL
const generateQRCode = async (text: string, size = 100): Promise<string | null> => {
  try {
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "M",
    });
  } catch (err) {
    console.error("QR code generation failed:", err);
    return null;
  }
};

// Load product image as base64
const loadProductImage = async (url: string): Promise<string | null> => {
  if (!url) return null;
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    return new Promise((resolve) => {
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 40;
          canvas.height = 40;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, 40, 40);
            resolve(canvas.toDataURL("image/jpeg", 0.7));
          } else resolve(null);
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  } catch { return null; }
};

export interface InvoiceOptions {
  language: "bn" | "en";
  copyType?: "customer" | "admin";
  printSettings?: Partial<InvoicePrintSettings>;
  // Legacy compat
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyLogo?: string;
}

// Helper to parse hex color to RGB
const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
};

const formatPrice = (amount: number) =>
  `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT`;

const formatDate = (dateStr: string, isBn: boolean) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(isBn ? "bn-BD" : "en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
};

const loadImageAsBase64 = (url: string): Promise<string | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) { ctx.drawImage(img, 0, 0); resolve(canvas.toDataURL("image/png")); }
        else resolve(null);
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

// Translation helper for dual mode
const t = (bn: string, en: string, mode: string) => {
  if (mode === "dual") return `${bn} / ${en}`;
  return mode === "bn" ? bn : en;
};

// Resolve settings merging printSettings + legacy options
function resolveSettings(options: InvoiceOptions) {
  const ps = options.printSettings || {};
  return {
    template: (ps.template || "modern") as string,
    langMode: (ps.languageMode || options.language || "bn") as string,
    paperSize: (ps.paperSize || "a4") as string,
    logoPosition: (ps.logoPosition || "left") as string,
    showQr: ps.showQr ?? false,
    showPaymentMethod: ps.showPaymentMethod ?? true,
    showProductImage: ps.showProductImage ?? false,
    showTax: ps.showTax ?? false,
    footerText: ps.footerText || "",
    footerTextBn: ps.footerTextBn || "",
    primaryColor: ps.primaryColor || "#167850",
    socialFacebook: ps.socialFacebook || "",
    socialYoutube: ps.socialYoutube || "",
    companyName: ps.companyName || options.companyName || "FishCare Pro",
    companyAddress: ps.companyAddress || options.companyAddress || "ঢাকা, বাংলাদেশ",
    companyPhone: ps.companyPhone || options.companyPhone || "+880 1XXX-XXXXXX",
    companyEmail: ps.companyEmail || options.companyEmail || "support@fishcare.com.bd",
    companyWebsite: ps.companyWebsite || options.companyWebsite || "www.fishcare.com.bd",
    companyLogo: ps.companyLogo || options.companyLogo || "",
    copyType: options.copyType || "customer",
  };
}

// ============================================================
// TEMPLATE: MINIMAL
// ============================================================
async function renderMinimal(doc: jsPDF, order: Order, s: ReturnType<typeof resolveSettings>) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const isBn = s.langMode !== "en";
  const fontName = getFontName(isBn);
  const setFont = (style: "normal" | "bold" = "normal") => setBanglaFont(doc, isBn, style);
  const primary = hexToRgb(s.primaryColor);
  let y = 15;

  // Simple header
  if (s.companyLogo) {
    try {
      const logoBase64 = await loadImageAsBase64(s.companyLogo);
      if (logoBase64) {
        const lx = s.logoPosition === "center" ? pageWidth / 2 - 8 : s.logoPosition === "right" ? pageWidth - margin - 16 : margin;
        doc.addImage(logoBase64, "PNG", lx, y - 3, 16, 16);
        if (s.logoPosition === "left") y += 0;
      }
    } catch {}
  }

  doc.setFontSize(18);
  setFont("bold");
  doc.setTextColor(...primary);
  const nameX = s.logoPosition === "left" && s.companyLogo ? margin + 20 : margin;
  doc.text(s.companyName, nameX, y + 8);

  // Invoice title right
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(t("ইনভয়েস", "INVOICE", s.langMode), pageWidth - margin, y + 8, { align: "right" });

  y += 18;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Order info
  doc.setFontSize(9);
  setFont("normal");
  doc.setTextColor(80, 80, 80);
  doc.text(`${t("অর্ডার", "Order", s.langMode)}: ${order.order_number}`, margin, y);
  doc.text(`${t("তারিখ", "Date", s.langMode)}: ${formatDate(order.created_at, isBn)}`, pageWidth - margin, y, { align: "right" });
  y += 6;

  // Customer
  doc.text(`${t("গ্রাহক", "Customer", s.langMode)}: ${order.shipping_name || ""}`, margin, y);
  doc.text(`${t("ফোন", "Phone", s.langMode)}: ${order.shipping_mobile || ""}`, pageWidth - margin, y, { align: "right" });
  y += 6;

  const addr = [order.shipping_address, order.shipping_upazila, order.shipping_district, order.shipping_division].filter(Boolean).join(", ");
  if (addr) {
    const addrLines = doc.splitTextToSize(addr, contentWidth);
    addrLines.forEach((line: string) => { doc.text(line, margin, y); y += 4; });
  }
  y += 4;

  // Items table - with product images if enabled
  const hasImages = s.showProductImage && order.items?.some(item => item.product_image);
  const headers = hasImages
    ? [["#", "", t("পণ্য", "Product", s.langMode), t("দাম", "Price", s.langMode), t("পরিমাণ", "Qty", s.langMode), t("মোট", "Total", s.langMode)]]
    : [["#", t("পণ্য", "Product", s.langMode), t("দাম", "Price", s.langMode), t("পরিমাণ", "Qty", s.langMode), t("মোট", "Total", s.langMode)]];

  // Pre-load product images
  let productImages: (string | null)[] = [];
  if (hasImages && order.items) {
    productImages = await Promise.all(order.items.map(item => loadProductImage(item.product_image || "")));
  }

  const body = order.items?.map((item, i) => {
    const row = [(i + 1).toString()];
    if (hasImages) row.push(""); // placeholder for image
    row.push(item.product_name, formatPrice(item.unit_price), item.quantity.toString(), formatPrice(item.total_price));
    return row;
  }) || [];

  autoTable(doc, {
    startY: y, head: headers, body,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: primary, textColor: [255, 255, 255], fontSize: 8, font: fontName, fontStyle: "bold", cellPadding: 2.5 },
    bodyStyles: { fontSize: 8, textColor: [50, 50, 50], font: fontName, cellPadding: 2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: hasImages
      ? { 0: { cellWidth: 10, halign: "center" }, 1: { cellWidth: 12 }, 3: { halign: "right", cellWidth: 28 }, 4: { halign: "center", cellWidth: 16 }, 5: { halign: "right", cellWidth: 30, fontStyle: "bold" } }
      : { 0: { cellWidth: 10, halign: "center" }, 2: { halign: "right", cellWidth: 28 }, 3: { halign: "center", cellWidth: 16 }, 4: { halign: "right", cellWidth: 30, fontStyle: "bold" } },
    ...(hasImages ? {
      didDrawCell: (data: any) => {
        if (data.section === "body" && data.column.index === 1 && productImages[data.row.index]) {
          try {
            doc.addImage(productImages[data.row.index]!, "JPEG", data.cell.x + 1, data.cell.y + 1, 8, 8);
          } catch {}
        }
      },
      rowPageBreak: "avoid" as const,
    } : {}),
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Totals
  const tX = pageWidth - margin - 75;
  doc.setFontSize(9);
  setFont("normal");
  doc.setTextColor(80, 80, 80);
  doc.text(t("সাবটোটাল:", "Subtotal:", s.langMode), tX, y);
  doc.text(formatPrice(order.subtotal || 0), pageWidth - margin, y, { align: "right" });
  y += 5;
  doc.text(t("ডেলিভারি:", "Shipping:", s.langMode), tX, y);
  doc.text(order.shipping_cost ? formatPrice(order.shipping_cost) : t("ফ্রি", "Free", s.langMode), pageWidth - margin, y, { align: "right" });
  y += 5;

  if (order.discount_amount && order.discount_amount > 0) {
    doc.setTextColor(...primary);
    doc.text(t("ডিসকাউন্ট:", "Discount:", s.langMode), tX, y);
    doc.text(`-${formatPrice(order.discount_amount)}`, pageWidth - margin, y, { align: "right" });
    y += 5;
  }

  doc.setDrawColor(200, 200, 200);
  doc.line(tX, y, pageWidth - margin, y);
  y += 5;
  doc.setFontSize(11);
  setFont("bold");
  doc.setTextColor(...primary);
  doc.text(t("সর্বমোট:", "TOTAL:", s.langMode), tX, y);
  doc.text(formatPrice(order.total_amount || 0), pageWidth - margin, y, { align: "right" });

  // Payment method
  if (s.showPaymentMethod) {
    y += 10;
    doc.setFontSize(8);
    setFont("normal");
    doc.setTextColor(100, 100, 100);
    const pm: Record<string, { bn: string; en: string }> = {
      cod: { bn: "ক্যাশ অন ডেলিভারি", en: "Cash on Delivery" },
      bkash: { bn: "বিকাশ", en: "bKash" },
      nagad: { bn: "নগদ", en: "Nagad" },
    };
    doc.text(`${t("পেমেন্ট", "Payment", s.langMode)}: ${pm[order.payment_method || ""]?.[isBn ? "bn" : "en"] || order.payment_method || ""}`, margin, y);
  }

  // QR Code
  if (s.showQr && s.companyWebsite) {
    const qrUrl = s.companyWebsite.startsWith("http") ? s.companyWebsite : `https://${s.companyWebsite}`;
    const qrData = await generateQRCode(qrUrl, 120);
    if (qrData) {
      doc.addImage(qrData, "PNG", margin, pageHeight - 35, 20, 20);
    }
  }

  // Footer
  const footerY = pageHeight - 20;
  const footerCenterX = s.showQr ? pageWidth / 2 + 10 : pageWidth / 2;
  doc.setFontSize(9);
  setFont("bold");
  doc.setTextColor(...primary);
  doc.text(t("ধন্যবাদ!", "Thank you!", s.langMode), footerCenterX, footerY, { align: "center" });
  doc.setFontSize(7);
  setFont("normal");
  doc.setTextColor(150, 150, 150);
  doc.text(`${s.companyWebsite} | ${s.companyPhone}`, footerCenterX, footerY + 5, { align: "center" });

  // Copy type
  doc.setFontSize(6);
  doc.text(s.copyType === "admin" ? "Office Copy" : "Customer Copy", pageWidth - margin, footerY + 10, { align: "right" });
}

// ============================================================
// TEMPLATE: MODERN (Enhanced original)
// ============================================================
async function renderModern(doc: jsPDF, order: Order, s: ReturnType<typeof resolveSettings>) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const isBn = s.langMode !== "en";
  const fontName = getFontName(isBn);
  const setFont = (style: "normal" | "bold" = "normal") => setBanglaFont(doc, isBn, style);
  const primary = hexToRgb(s.primaryColor);
  const primaryLight: [number, number, number] = [
    Math.min(255, primary[0] + 200), Math.min(255, primary[1] + 200), Math.min(255, primary[2] + 200),
  ];
  const textDark: [number, number, number] = [26, 32, 44];
  const textMuted: [number, number, number] = [113, 128, 150];
  const border: [number, number, number] = [226, 232, 240];
  const bgLight: [number, number, number] = [247, 250, 252];
  let y = 0;

  // Top accent bar
  doc.setFillColor(...primary);
  doc.rect(0, 0, pageWidth, 4, "F");
  y = 12;

  // Logo
  let logoRendered = false;
  if (s.companyLogo) {
    try {
      const logoBase64 = await loadImageAsBase64(s.companyLogo);
      if (logoBase64) {
        const lx = s.logoPosition === "center" ? pageWidth / 2 - 7 : s.logoPosition === "right" ? pageWidth - margin - 14 : margin;
        doc.addImage(logoBase64, "PNG", lx, y - 4, 14, 14);
        logoRendered = s.logoPosition === "left";
      }
    } catch {}
  }

  const textStartX = logoRendered ? margin + 17 : margin;
  doc.setFontSize(22); setFont("bold"); doc.setTextColor(...primary);
  doc.text(s.companyName, textStartX, y + 6);

  doc.setFontSize(28); doc.setTextColor(45, 55, 72); setFont("bold");
  doc.text(t("ইনভয়েস", "INVOICE", s.langMode), pageWidth - margin, y + 6, { align: "right" });
  y += 12;

  doc.setFontSize(8); setFont("normal"); doc.setTextColor(...textMuted);
  [s.companyAddress, `${t("ফোন", "Phone", s.langMode)}: ${s.companyPhone}`, `${t("ইমেইল", "Email", s.langMode)}: ${s.companyEmail}`, `${t("ওয়েবসাইট", "Web", s.langMode)}: ${s.companyWebsite}`]
    .forEach((line) => { doc.text(line, margin, y); y += 3.5; });

  // Copy badge
  const isAdmin = s.copyType === "admin";
  const copyLabel = isAdmin ? t("অফিস কপি", "OFFICE COPY", s.langMode) : t("কাস্টমার কপি", "CUSTOMER COPY", s.langMode);
  const badgeColor: [number, number, number] = isAdmin ? [237, 137, 54] : [56, 161, 105];
  const bw = 40;
  doc.setFillColor(...badgeColor);
  doc.roundedRect(pageWidth - margin - bw, y - 12, bw, 7, 1.5, 1.5, "F");
  doc.setFontSize(8); setFont("bold"); doc.setTextColor(255, 255, 255);
  doc.text(copyLabel, pageWidth - margin - bw / 2, y - 7.2, { align: "center" });

  y += 4;
  doc.setDrawColor(...primary); doc.setLineWidth(0.6); doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Info box
  doc.setFillColor(...primaryLight);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, "F");
  const infoY = y + 5;
  const col1 = margin + 5; const col2 = margin + contentWidth * 0.35; const col3 = margin + contentWidth * 0.65;

  doc.setFontSize(7); doc.setTextColor(...textMuted); setFont("normal");
  doc.text(t("অর্ডার নম্বর", "ORDER NO.", s.langMode), col1, infoY);
  doc.setFontSize(10); setFont("bold"); doc.setTextColor(...textDark);
  doc.text(order.order_number, col1, infoY + 5);
  doc.setFontSize(7); doc.setTextColor(...textMuted); setFont("normal");
  doc.text(t("তারিখ", "DATE", s.langMode), col1, infoY + 11);
  doc.setFontSize(9); setFont("bold"); doc.setTextColor(...textDark);
  doc.text(formatDate(order.created_at, isBn), col1, infoY + 15);

  // Status
  const statusLabels: Record<string, { bn: string; en: string }> = {
    pending: { bn: "পেন্ডিং", en: "Pending" }, processing: { bn: "প্রসেসিং", en: "Processing" },
    shipped: { bn: "শিপড", en: "Shipped" }, delivered: { bn: "ডেলিভারড", en: "Delivered" },
    cancelled: { bn: "বাতিল", en: "Cancelled" },
  };
  doc.setFontSize(7); doc.setTextColor(...textMuted); setFont("normal");
  doc.text(t("অর্ডার স্ট্যাটাস", "ORDER STATUS", s.langMode), col2, infoY);
  const sColor: [number, number, number] = order.status === "delivered" ? [56, 161, 105] : order.status === "cancelled" ? [229, 62, 62] : [237, 137, 54];
  doc.setFontSize(9); setFont("bold"); doc.setTextColor(...sColor);
  doc.text(statusLabels[order.status || ""]?.[isBn ? "bn" : "en"] || order.status || "", col2, infoY + 5);

  // Payment status
  const payLabels: Record<string, { bn: string; en: string }> = {
    pending: { bn: "পেন্ডিং", en: "Pending" }, paid: { bn: "পেইড", en: "Paid" },
    failed: { bn: "ব্যর্থ", en: "Failed" },
  };
  doc.setFontSize(7); doc.setTextColor(...textMuted); setFont("normal");
  doc.text(t("পেমেন্ট স্ট্যাটাস", "PAYMENT STATUS", s.langMode), col2, infoY + 11);
  const pColor: [number, number, number] = order.payment_status === "paid" ? [56, 161, 105] : [237, 137, 54];
  doc.setFontSize(9); setFont("bold"); doc.setTextColor(...pColor);
  doc.text(payLabels[order.payment_status || ""]?.[isBn ? "bn" : "en"] || order.payment_status || "", col2, infoY + 15);

  // Payment method
  if (s.showPaymentMethod) {
    const pmLabels: Record<string, { bn: string; en: string }> = {
      cod: { bn: "ক্যাশ অন ডেলিভারি", en: "Cash on Delivery" }, bkash: { bn: "বিকাশ", en: "bKash" }, nagad: { bn: "নগদ", en: "Nagad" },
    };
    doc.setFontSize(7); doc.setTextColor(...textMuted); setFont("normal");
    doc.text(t("পেমেন্ট পদ্ধতি", "PAYMENT METHOD", s.langMode), col3, infoY);
    doc.setFontSize(9); setFont("bold"); doc.setTextColor(...textDark);
    doc.text(pmLabels[order.payment_method || ""]?.[isBn ? "bn" : "en"] || order.payment_method || "", col3, infoY + 5);
    if (order.payment_trx_id) {
      doc.setFontSize(7); doc.setTextColor(...textMuted); setFont("normal");
      doc.text(t("ট্রানজেকশন আইডি", "TXN ID", s.langMode), col3, infoY + 11);
      doc.setFontSize(8); setFont("bold"); doc.setTextColor(...textDark);
      doc.text(order.payment_trx_id, col3, infoY + 15);
    }
  }

  y += 28;

  // Billing / Shipping
  const bw2 = contentWidth / 2 - 3;
  doc.setFillColor(...bgLight); doc.roundedRect(margin, y, bw2, 30, 2, 2, "F");
  doc.setFontSize(8); setFont("bold"); doc.setTextColor(...primary);
  doc.text(t("বিলিং তথ্য", "BILL TO", s.langMode), margin + 5, y + 6);
  doc.setFontSize(10); setFont("bold"); doc.setTextColor(...textDark);
  doc.text(order.shipping_name || "", margin + 5, y + 12);
  doc.setFontSize(8); setFont("normal"); doc.setTextColor(...textMuted);
  doc.text(order.shipping_mobile || "", margin + 5, y + 17);
  if (order.customer_email) doc.text(order.customer_email, margin + 5, y + 21);

  const shipX = margin + bw2 + 6;
  doc.setFillColor(...bgLight); doc.roundedRect(shipX, y, bw2, 30, 2, 2, "F");
  doc.setFontSize(8); setFont("bold"); doc.setTextColor(...primary);
  doc.text(t("ডেলিভারি ঠিকানা", "SHIP TO", s.langMode), shipX + 5, y + 6);
  const addrParts = [order.shipping_address, order.shipping_upazila, order.shipping_district, order.shipping_division].filter(Boolean).join(", ");
  doc.setFontSize(8.5); setFont("normal"); doc.setTextColor(...textDark);
  const addrLines = doc.splitTextToSize(addrParts, bw2 - 10);
  let ay = y + 12;
  addrLines.forEach((line: string) => { if (ay < y + 28) { doc.text(line, shipX + 5, ay); ay += 4; } });
  y += 36;

  // Admin notes
  if (isAdmin && (order.customer_note || order.admin_note)) {
    doc.setFillColor(255, 251, 235); doc.roundedRect(margin, y, contentWidth, 16, 2, 2, "F");
    doc.setFontSize(7); setFont("bold"); doc.setTextColor(237, 137, 54);
    doc.text(t("নোট (শুধুমাত্র অফিস)", "NOTES (OFFICE ONLY)", s.langMode), margin + 5, y + 5);
    doc.setFontSize(8); setFont("normal"); doc.setTextColor(...textDark);
    if (order.customer_note) doc.text(`${t("কাস্টমার", "Customer", s.langMode)}: ${order.customer_note}`, margin + 5, y + 10);
    if (order.admin_note) doc.text(`${t("এডমিন", "Admin", s.langMode)}: ${order.admin_note}`, margin + 5, y + 14);
    y += 20;
  }

  // Items table
  doc.setFontSize(9); setFont("bold"); doc.setTextColor(...primary);
  doc.text(t("পণ্যের বিবরণ", "ORDER ITEMS", s.langMode), margin, y + 4);
  y += 7;

  // Items table - with product images if enabled
  const hasImages = s.showProductImage && order.items?.some(item => item.product_image);
  let productImages: (string | null)[] = [];
  if (hasImages && order.items) {
    productImages = await Promise.all(order.items.map(item => loadProductImage(item.product_image || "")));
  }

  const tableHeaders = hasImages
    ? [["#", "", t("পণ্যের নাম", "Product", s.langMode), t("একক দাম", "Unit Price", s.langMode), t("ছাড়", "Disc%", s.langMode), t("পরিমাণ", "Qty", s.langMode), t("মোট", "Total", s.langMode)]]
    : [["#", t("পণ্যের নাম", "Product", s.langMode), t("একক দাম", "Unit Price", s.langMode), t("ছাড়", "Disc%", s.langMode), t("পরিমাণ", "Qty", s.langMode), t("মোট", "Total", s.langMode)]];

  const tableData = order.items?.map((item, idx) => {
    const row = [(idx + 1).toString()];
    if (hasImages) row.push(""); // placeholder for image
    row.push(item.product_name, formatPrice(item.unit_price),
      item.discount_percentage > 0 ? `${item.discount_percentage}%` : "-", item.quantity.toString(), formatPrice(item.total_price));
    return row;
  }) || [];

  autoTable(doc, {
    startY: y, head: tableHeaders, body: tableData,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8, cellPadding: 3, font: fontName },
    bodyStyles: { fontSize: 8, textColor: textDark, cellPadding: 2.5, lineColor: border, lineWidth: 0.1, font: fontName },
    alternateRowStyles: { fillColor: [250, 253, 251] },
    columnStyles: hasImages
      ? {
          0: { cellWidth: 10, halign: "center" }, 1: { cellWidth: 12 }, 2: { cellWidth: "auto" },
          3: { cellWidth: 28, halign: "right" }, 4: { cellWidth: 16, halign: "center" },
          5: { cellWidth: 16, halign: "center" }, 6: { cellWidth: 32, halign: "right", fontStyle: "bold" },
        }
      : {
          0: { cellWidth: 10, halign: "center" }, 1: { cellWidth: "auto" },
          2: { cellWidth: 28, halign: "right" }, 3: { cellWidth: 16, halign: "center" },
          4: { cellWidth: 16, halign: "center" }, 5: { cellWidth: 32, halign: "right", fontStyle: "bold" },
        },
    ...(hasImages ? {
      didDrawCell: (data: any) => {
        if (data.section === "body" && data.column.index === 1 && productImages[data.row.index]) {
          try {
            doc.addImage(productImages[data.row.index]!, "JPEG", data.cell.x + 1, data.cell.y + 1, 8, 8);
          } catch {}
        }
      },
      rowPageBreak: "avoid" as const,
    } : {}),
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // Totals
  const tw = 80; const tX = pageWidth - margin - tw;
  doc.setFillColor(...bgLight); doc.roundedRect(tX - 5, y - 2, tw + 5, order.discount_amount && order.discount_amount > 0 ? 38 : 30, 2, 2, "F");
  const valX = pageWidth - margin - 2;
  let tY = y + 4;
  doc.setFontSize(8.5); setFont("normal"); doc.setTextColor(...textMuted);
  doc.text(t("সাবটোটাল:", "Subtotal:", s.langMode), tX, tY);
  doc.setTextColor(...textDark); doc.text(formatPrice(order.subtotal || 0), valX, tY, { align: "right" });
  tY += 6;
  doc.setTextColor(...textMuted); doc.text(t("ডেলিভারি চার্জ:", "Shipping:", s.langMode), tX, tY);
  doc.setTextColor(...textDark); doc.text(order.shipping_cost ? formatPrice(order.shipping_cost) : t("ফ্রি", "Free", s.langMode), valX, tY, { align: "right" });
  if (order.discount_amount && order.discount_amount > 0) {
    tY += 6;
    doc.setTextColor(56, 161, 105); doc.text(t("ডিসকাউন্ট:", "Discount:", s.langMode), tX, tY);
    doc.text(`-${formatPrice(order.discount_amount)}`, valX, tY, { align: "right" });
  }
  tY += 3;
  doc.setDrawColor(...primary); doc.setLineWidth(0.4); doc.line(tX, tY, valX, tY);
  tY += 6;
  doc.setFillColor(...primary); doc.roundedRect(tX - 5, tY - 4, tw + 5, 10, 1.5, 1.5, "F");
  doc.setFontSize(10); setFont("bold"); doc.setTextColor(255, 255, 255);
  doc.text(t("সর্বমোট:", "TOTAL:", s.langMode), tX, tY + 2);
  doc.text(formatPrice(order.total_amount || 0), valX, tY + 2, { align: "right" });
  y = tY + 14;

  // Tracking
  if (order.courier_name || order.tracking_number) {
    doc.setFillColor(...primaryLight); doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "F");
    doc.setFontSize(8); setFont("bold"); doc.setTextColor(...primary);
    doc.text(t("শিপমেন্ট ট্র্যাকিং", "SHIPMENT TRACKING", s.langMode), margin + 5, y + 5);
    doc.setFontSize(8); setFont("normal"); doc.setTextColor(...textDark);
    if (order.courier_name) doc.text(`${t("কুরিয়ার:", "Courier:", s.langMode)} ${order.courier_name}`, margin + 5, y + 10);
    if (order.tracking_number) doc.text(`${t("ট্র্যাকিং নম্বর:", "Tracking:", s.langMode)} ${order.tracking_number}`, margin + contentWidth * 0.4, y + 10);
    y += 22;
  }

  // QR Code
  if (s.showQr && s.companyWebsite) {
    const qrUrl = s.companyWebsite.startsWith("http") ? s.companyWebsite : `https://${s.companyWebsite}`;
    const qrData = await generateQRCode(qrUrl, 120);
    if (qrData) {
      doc.addImage(qrData, "PNG", margin, pageHeight - 40, 22, 22);
    }
  }

  // Footer
  const fY = pageHeight - 28;
  const fCenterX = s.showQr ? pageWidth / 2 + 12 : pageWidth / 2;
  doc.setFillColor(...primary); doc.rect(0, pageHeight - 4, pageWidth, 4, "F");
  doc.setDrawColor(...primary); doc.setLineWidth(0.4); doc.line(margin, fY, pageWidth - margin, fY);
  doc.setFontSize(10); setFont("bold"); doc.setTextColor(...primary);
  doc.text(t("আপনার অর্ডারের জন্য ধন্যবাদ!", "Thank you for your order!", s.langMode), fCenterX, fY + 6, { align: "center" });

  // Custom footer text
  if (s.footerTextBn || s.footerText) {
    doc.setFontSize(7.5); setFont("normal"); doc.setTextColor(...textMuted);
    const fText = isBn ? (s.footerTextBn || s.footerText) : (s.footerText || s.footerTextBn);
    if (fText) doc.text(fText, fCenterX, fY + 11, { align: "center" });
  } else {
    doc.setFontSize(7.5); setFont("normal"); doc.setTextColor(...textMuted);
    doc.text(t("কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন।", "For questions or support, please contact us.", s.langMode), fCenterX, fY + 11, { align: "center" });
  }

  doc.setFontSize(7); doc.setTextColor(56, 161, 105);
  let contactLine = `${s.companyWebsite} | ${s.companyPhone} | ${s.companyEmail}`;
  if (s.socialFacebook) contactLine += ` | FB: ${s.socialFacebook}`;
  doc.text(contactLine, fCenterX, fY + 16, { align: "center" });

  doc.setFontSize(6); doc.setTextColor(...border);
  doc.text(isAdmin ? "Office Copy" : "Customer Copy", pageWidth - margin, fY + 20, { align: "right" });
}

// ============================================================
// TEMPLATE: POS Receipt (80mm = ~226pt width)
// ============================================================
async function renderPOS(doc: jsPDF, order: Order, s: ReturnType<typeof resolveSettings>) {
  // POS receipt is narrow, so we set custom dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 5;
  const contentWidth = pageWidth - margin * 2;
  const isBn = s.langMode !== "en";
  const setFont = (style: "normal" | "bold" = "normal") => setBanglaFont(doc, isBn, style);
  let y = 8;

  // Center header
  doc.setFontSize(14); setFont("bold"); doc.setTextColor(0, 0, 0);
  doc.text(s.companyName, pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.setFontSize(7); setFont("normal"); doc.setTextColor(80, 80, 80);
  doc.text(s.companyAddress, pageWidth / 2, y, { align: "center" });
  y += 3.5;
  doc.text(`${t("ফোন", "Tel", s.langMode)}: ${s.companyPhone}`, pageWidth / 2, y, { align: "center" });
  y += 5;

  // Dashed line
  doc.setDrawColor(0); doc.setLineDashPattern([1, 1], 0); doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineDashPattern([], 0);
  y += 4;

  doc.setFontSize(8); setFont("normal"); doc.setTextColor(0, 0, 0);
  doc.text(`${t("অর্ডার", "Order", s.langMode)}: ${order.order_number}`, margin, y);
  y += 4;
  doc.text(`${t("তারিখ", "Date", s.langMode)}: ${formatDate(order.created_at, isBn)}`, margin, y);
  y += 4;
  doc.text(`${t("গ্রাহক", "Customer", s.langMode)}: ${order.shipping_name || ""}`, margin, y);
  y += 4;
  doc.text(`${t("ফোন", "Phone", s.langMode)}: ${order.shipping_mobile || ""}`, margin, y);
  y += 4;

  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineDashPattern([], 0);
  y += 4;

  // Items
  doc.setFontSize(7); setFont("bold");
  doc.text(t("পণ্য", "Item", s.langMode), margin, y);
  doc.text(t("মোট", "Total", s.langMode), pageWidth - margin, y, { align: "right" });
  y += 4;
  doc.setDrawColor(0); doc.setLineWidth(0.2); doc.line(margin, y - 1, pageWidth - margin, y - 1);

  setFont("normal");
  order.items?.forEach((item) => {
    doc.text(item.product_name.substring(0, 30), margin, y + 3);
    y += 3.5;
    doc.text(`  ${item.quantity} x ${formatPrice(item.unit_price)}`, margin, y + 3);
    doc.text(formatPrice(item.total_price), pageWidth - margin, y + 3, { align: "right" });
    y += 5;
  });

  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineDashPattern([], 0);
  y += 4;

  // Totals
  doc.setFontSize(8); setFont("normal");
  doc.text(t("সাবটোটাল", "Subtotal", s.langMode), margin, y);
  doc.text(formatPrice(order.subtotal || 0), pageWidth - margin, y, { align: "right" });
  y += 4;
  doc.text(t("ডেলিভারি", "Shipping", s.langMode), margin, y);
  doc.text(order.shipping_cost ? formatPrice(order.shipping_cost) : t("ফ্রি", "Free", s.langMode), pageWidth - margin, y, { align: "right" });
  y += 4;

  if (order.discount_amount && order.discount_amount > 0) {
    doc.text(t("ডিসকাউন্ট", "Discount", s.langMode), margin, y);
    doc.text(`-${formatPrice(order.discount_amount)}`, pageWidth - margin, y, { align: "right" });
    y += 4;
  }

  doc.setLineWidth(0.5); doc.line(margin, y, pageWidth - margin, y);
  y += 5;
  doc.setFontSize(10); setFont("bold");
  doc.text(t("মোট", "TOTAL", s.langMode), margin, y);
  doc.text(formatPrice(order.total_amount || 0), pageWidth - margin, y, { align: "right" });
  y += 6;

  if (s.showPaymentMethod) {
    doc.setFontSize(7); setFont("normal");
    const pm: Record<string, string> = { cod: isBn ? "ক্যাশ" : "Cash", bkash: "bKash", nagad: isBn ? "নগদ" : "Nagad" };
    doc.text(`${t("পেমেন্ট", "Payment", s.langMode)}: ${pm[order.payment_method || ""] || order.payment_method || ""}`, margin, y);
    y += 5;
  }

  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineDashPattern([], 0);
  y += 5;

  // QR Code for POS
  if (s.showQr && s.companyWebsite) {
    const qrUrl = s.companyWebsite.startsWith("http") ? s.companyWebsite : `https://${s.companyWebsite}`;
    const qrData = await generateQRCode(qrUrl, 80);
    if (qrData) {
      doc.addImage(qrData, "PNG", pageWidth / 2 - 8, y, 16, 16);
      y += 18;
    }
  }

  doc.setFontSize(8); setFont("bold"); doc.setTextColor(0, 0, 0);
  doc.text(t("ধন্যবাদ!", "Thank you!", s.langMode), pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.setFontSize(6); setFont("normal"); doc.setTextColor(100, 100, 100);
  doc.text(s.companyWebsite, pageWidth / 2, y, { align: "center" });
}

// ============================================================
// TEMPLATE: DETAILED (with product images support)
// ============================================================
async function renderDetailed(doc: jsPDF, order: Order, s: ReturnType<typeof resolveSettings>) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const isBn = s.langMode !== "en";
  const fontName = getFontName(isBn);
  const setFont = (style: "normal" | "bold" = "normal") => setBanglaFont(doc, isBn, style);
  const primary = hexToRgb(s.primaryColor);
  let y = 0;

  // Full-width header band
  doc.setFillColor(...primary);
  doc.rect(0, 0, pageWidth, 32, "F");

  // Logo in header
  if (s.companyLogo) {
    try {
      const logoBase64 = await loadImageAsBase64(s.companyLogo);
      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", margin + 2, 5, 18, 18);
      }
    } catch {}
  }

  doc.setFontSize(20); setFont("bold"); doc.setTextColor(255, 255, 255);
  doc.text(s.companyName, s.companyLogo ? margin + 24 : margin + 2, 16);
  doc.setFontSize(8); setFont("normal");
  doc.text(`${s.companyAddress} | ${s.companyPhone}`, s.companyLogo ? margin + 24 : margin + 2, 22);

  // Invoice title
  doc.setFontSize(24); setFont("bold");
  doc.text(t("ইনভয়েস", "INVOICE", s.langMode), pageWidth - margin, 18, { align: "right" });

  y = 38;

  // Order details grid
  const gridData = [
    [t("অর্ডার নম্বর", "Order Number", s.langMode), order.order_number],
    [t("তারিখ", "Date", s.langMode), formatDate(order.created_at, isBn)],
    [t("স্ট্যাটাস", "Status", s.langMode), order.status || ""],
    [t("পেমেন্ট স্ট্যাটাস", "Payment Status", s.langMode), order.payment_status || ""],
  ];

  doc.setFontSize(8);
  gridData.forEach(([label, value], i) => {
    const gx = i < 2 ? margin : margin + contentWidth / 2;
    const gy = i % 2 === 0 ? y : y + 8;
    setFont("normal"); doc.setTextColor(120, 120, 120);
    doc.text(label, gx, gy);
    setFont("bold"); doc.setTextColor(30, 30, 30);
    doc.text(value, gx + 45, gy);
  });
  y += 20;

  // Customer & Shipping side by side
  doc.setFillColor(245, 247, 250); doc.roundedRect(margin, y, contentWidth / 2 - 3, 35, 2, 2, "F");
  doc.setFillColor(245, 247, 250); doc.roundedRect(margin + contentWidth / 2 + 3, y, contentWidth / 2 - 3, 35, 2, 2, "F");

  doc.setFontSize(9); setFont("bold"); doc.setTextColor(...primary);
  doc.text(t("গ্রাহক তথ্য", "CUSTOMER INFO", s.langMode), margin + 5, y + 6);
  doc.setFontSize(8); setFont("normal"); doc.setTextColor(50, 50, 50);
  doc.text(order.shipping_name || "", margin + 5, y + 12);
  doc.text(order.shipping_mobile || "", margin + 5, y + 17);
  if (order.customer_email) doc.text(order.customer_email, margin + 5, y + 22);

  const sx = margin + contentWidth / 2 + 8;
  doc.setFontSize(9); setFont("bold"); doc.setTextColor(...primary);
  doc.text(t("ডেলিভারি ঠিকানা", "DELIVERY ADDRESS", s.langMode), sx, y + 6);
  doc.setFontSize(8); setFont("normal"); doc.setTextColor(50, 50, 50);
  const addr = [order.shipping_address, order.shipping_upazila, order.shipping_district, order.shipping_division].filter(Boolean).join(", ");
  const aLines = doc.splitTextToSize(addr, contentWidth / 2 - 15);
  let aY2 = y + 12;
  aLines.forEach((l: string) => { if (aY2 < y + 33) { doc.text(l, sx, aY2); aY2 += 4.5; } });
  y += 40;

  // Items table with more detail - with product images if enabled
  const hasImages = s.showProductImage && order.items?.some(item => item.product_image);
  let productImages: (string | null)[] = [];
  if (hasImages && order.items) {
    productImages = await Promise.all(order.items.map(item => loadProductImage(item.product_image || "")));
  }

  const tableHeaders = hasImages
    ? [["#", "", t("পণ্যের নাম", "Product", s.langMode), t("একক দাম", "Unit Price", s.langMode), t("ছাড়%", "Disc%", s.langMode), t("পরিমাণ", "Qty", s.langMode), t("মোট", "Total", s.langMode)]]
    : [["#", t("পণ্যের নাম", "Product", s.langMode), t("একক দাম", "Unit Price", s.langMode), t("ছাড়%", "Disc%", s.langMode), t("পরিমাণ", "Qty", s.langMode), t("মোট", "Total", s.langMode)]];

  const tableData = order.items?.map((item, idx) => {
    const row = [(idx + 1).toString()];
    if (hasImages) row.push("");
    row.push(item.product_name, formatPrice(item.unit_price),
      item.discount_percentage > 0 ? `${item.discount_percentage}%` : "-",
      item.quantity.toString(), formatPrice(item.total_price));
    return row;
  }) || [];

  autoTable(doc, {
    startY: y, head: tableHeaders, body: tableData,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8, cellPadding: 3, font: fontName },
    bodyStyles: { fontSize: 8, textColor: [40, 40, 40], cellPadding: 2.5, font: fontName },
    alternateRowStyles: { fillColor: [250, 252, 255] },
    columnStyles: hasImages
      ? {
          0: { cellWidth: 10, halign: "center" }, 1: { cellWidth: 12 }, 2: { cellWidth: "auto" },
          3: { cellWidth: 28, halign: "right" }, 4: { cellWidth: 16, halign: "center" },
          5: { cellWidth: 16, halign: "center" }, 6: { cellWidth: 32, halign: "right", fontStyle: "bold" },
        }
      : {
          0: { cellWidth: 10, halign: "center" }, 1: { cellWidth: "auto" },
          2: { cellWidth: 28, halign: "right" }, 3: { cellWidth: 16, halign: "center" },
          4: { cellWidth: 16, halign: "center" }, 5: { cellWidth: 32, halign: "right", fontStyle: "bold" },
        },
    ...(hasImages ? {
      didDrawCell: (data: any) => {
        if (data.section === "body" && data.column.index === 1 && productImages[data.row.index]) {
          try {
            doc.addImage(productImages[data.row.index]!, "JPEG", data.cell.x + 1, data.cell.y + 1, 8, 8);
          } catch {}
        }
      },
      rowPageBreak: "avoid" as const,
    } : {}),
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // Detailed totals box
  const totW = 90;
  const totX = pageWidth - margin - totW;
  doc.setFillColor(245, 247, 250); doc.roundedRect(totX, y, totW, order.discount_amount && order.discount_amount > 0 ? 45 : 36, 2, 2, "F");
  let dY = y + 6;
  doc.setFontSize(8.5); setFont("normal"); doc.setTextColor(100, 100, 100);
  doc.text(t("সাবটোটাল", "Subtotal", s.langMode), totX + 5, dY);
  doc.setTextColor(30, 30, 30); doc.text(formatPrice(order.subtotal || 0), totX + totW - 5, dY, { align: "right" });
  dY += 6;
  doc.setTextColor(100, 100, 100); doc.text(t("ডেলিভারি চার্জ", "Delivery Charge", s.langMode), totX + 5, dY);
  doc.setTextColor(30, 30, 30); doc.text(order.shipping_cost ? formatPrice(order.shipping_cost) : t("ফ্রি", "Free", s.langMode), totX + totW - 5, dY, { align: "right" });
  dY += 6;
  if (order.discount_amount && order.discount_amount > 0) {
    doc.setTextColor(...primary); doc.text(t("ডিসকাউন্ট", "Discount", s.langMode), totX + 5, dY);
    doc.text(`-${formatPrice(order.discount_amount)}`, totX + totW - 5, dY, { align: "right" });
    dY += 6;
  }
  doc.setDrawColor(...primary); doc.setLineWidth(0.5); doc.line(totX + 3, dY, totX + totW - 3, dY);
  dY += 6;
  doc.setFillColor(...primary); doc.roundedRect(totX + 2, dY - 4, totW - 4, 10, 1.5, 1.5, "F");
  doc.setFontSize(11); setFont("bold"); doc.setTextColor(255, 255, 255);
  doc.text(t("সর্বমোট", "TOTAL", s.langMode), totX + 8, dY + 2);
  doc.text(formatPrice(order.total_amount || 0), totX + totW - 8, dY + 2, { align: "right" });

  // Tracking info
  if (order.courier_name || order.tracking_number) {
    const tY2 = dY + 16;
    doc.setFillColor(240, 248, 244); doc.roundedRect(margin, tY2, contentWidth, 14, 2, 2, "F");
    doc.setFontSize(8); setFont("bold"); doc.setTextColor(...primary);
    doc.text(t("শিপমেন্ট ট্র্যাকিং", "SHIPMENT TRACKING", s.langMode), margin + 5, tY2 + 5);
    doc.setFontSize(7.5); setFont("normal"); doc.setTextColor(50, 50, 50);
    if (order.courier_name) doc.text(`${t("কুরিয়ার", "Courier", s.langMode)}: ${order.courier_name}`, margin + 5, tY2 + 10);
    if (order.tracking_number) doc.text(`${t("ট্র্যাকিং", "Tracking", s.langMode)}: ${order.tracking_number}`, margin + contentWidth * 0.45, tY2 + 10);
  }

  // QR Code
  if (s.showQr && s.companyWebsite) {
    const qrUrl = s.companyWebsite.startsWith("http") ? s.companyWebsite : `https://${s.companyWebsite}`;
    const qrData = await generateQRCode(qrUrl, 120);
    if (qrData) {
      doc.addImage(qrData, "PNG", margin, pageHeight - 36, 22, 22);
    }
  }

  // Footer
  const fY = pageHeight - 22;
  const fCenterX = s.showQr ? pageWidth / 2 + 12 : pageWidth / 2;
  doc.setFillColor(...primary); doc.rect(0, pageHeight - 4, pageWidth, 4, "F");
  doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3); doc.line(margin, fY, pageWidth - margin, fY);
  doc.setFontSize(10); setFont("bold"); doc.setTextColor(...primary);
  doc.text(t("আপনার অর্ডারের জন্য ধন্যবাদ!", "Thank you for your order!", s.langMode), fCenterX, fY + 6, { align: "center" });
  doc.setFontSize(7); setFont("normal"); doc.setTextColor(130, 130, 130);
  let fLine = `${s.companyWebsite} | ${s.companyPhone} | ${s.companyEmail}`;
  if (s.socialFacebook) fLine += ` | FB: ${s.socialFacebook}`;
  doc.text(fLine, fCenterX, fY + 11, { align: "center" });
  doc.setFontSize(6); doc.setTextColor(200, 200, 200);
  doc.text(s.copyType === "admin" ? "Office Copy" : "Customer Copy", pageWidth - margin, fY + 15, { align: "right" });
}

// ============================================================
// MAIN EXPORT
// ============================================================
export const generateInvoicePDF = async (order: Order, options: Partial<InvoiceOptions> = {}) => {
  const opts: InvoiceOptions = { language: "bn", copyType: "customer", ...options };
  const s = resolveSettings(opts);
  const isPOS = s.template === "pos" || s.paperSize === "pos80";

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: isPOS ? [80, 200] : "a4",
  });

  // Register Nikosh font for Bengali
  await registerBanglaFont(doc);

  switch (s.template) {
    case "minimal":
      await renderMinimal(doc, order, s);
      break;
    case "pos":
      await renderPOS(doc, order, s);
      break;
    case "detailed":
      await renderDetailed(doc, order, s);
      break;
    case "modern":
    default:
      await renderModern(doc, order, s);
      break;
  }

  const suffix = s.copyType === "admin" ? "Admin" : "Customer";
  doc.save(`Invoice-${order.order_number}-${suffix}.pdf`);
};

export default generateInvoicePDF;
