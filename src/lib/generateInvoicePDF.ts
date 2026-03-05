/**
 * Invoice PDF Generator - Professional Design
 * কাস্টমার কপি এবং এডমিন কপি সহ সুন্দর ইনভয়েস
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Order } from "@/lib/api-client";
import { registerBanglaFont, setBanglaFont, getFontName } from "@/lib/pdfBanglaFont";

interface InvoiceOptions {
  language: "bn" | "en";
  copyType?: "customer" | "admin";
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyLogo?: string;
}

const defaultOptions: InvoiceOptions = {
  language: "bn",
  copyType: "customer",
  companyName: "FishCare Pro",
  companyAddress: "ঢাকা, বাংলাদেশ",
  companyPhone: "+880 1XXX-XXXXXX",
  companyEmail: "support@fishcare.com.bd",
  companyWebsite: "www.fishcare.com.bd",
};

// Color palette
const COLORS = {
  primary: [22, 120, 80] as [number, number, number],
  primaryLight: [235, 248, 242] as [number, number, number],
  secondary: [45, 55, 72] as [number, number, number],
  accent: [56, 161, 105] as [number, number, number],
  textDark: [26, 32, 44] as [number, number, number],
  textMuted: [113, 128, 150] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  danger: [229, 62, 62] as [number, number, number],
  warning: [237, 137, 54] as [number, number, number],
  success: [56, 161, 105] as [number, number, number],
  bgLight: [247, 250, 252] as [number, number, number],
};

const formatPrice = (amount: number) => {
  return `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT`;
};

const formatDate = (dateStr: string, isBn: boolean) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(isBn ? "bn-BD" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const drawRoundedRect = (doc: jsPDF, x: number, y: number, w: number, h: number, r: number, fillColor: [number, number, number]) => {
  doc.setFillColor(...fillColor);
  doc.roundedRect(x, y, w, h, r, r, "F");
};

const drawLine = (doc: jsPDF, x1: number, y1: number, x2: number, y2: number, color: [number, number, number] = COLORS.border, width = 0.3) => {
  doc.setDrawColor(...color);
  doc.setLineWidth(width);
  doc.line(x1, y1, x2, y2);
};

// Helper to load image as base64
const loadImageAsBase64 = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

export const generateInvoicePDF = async (order: Order, options: Partial<InvoiceOptions> = {}) => {
  const opts = { ...defaultOptions, ...options };
  const isBn = opts.language === "bn";
  const isAdmin = opts.copyType === "admin";

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // Register Nikosh font for Bengali
  await registerBanglaFont(doc);

  // Helper to set font
  const setFont = (style: "normal" | "bold" = "normal") => setBanglaFont(doc, isBn, style);

  // ==================== TOP ACCENT BAR ====================
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 4, "F");

  y = 12;

  // ==================== HEADER SECTION ====================
  let logoRendered = false;
  if (opts.companyLogo) {
    try {
      const logoBase64 = await loadImageAsBase64(opts.companyLogo);
      if (logoBase64) {
        const logoHeight = 14;
        const logoWidth = 14;
        doc.addImage(logoBase64, "PNG", margin, y - 4, logoWidth, logoHeight);
        logoRendered = true;
      }
    } catch {
      // Logo loading failed
    }
  }

  const textStartX = logoRendered ? margin + 17 : margin;

  // Company name
  doc.setFontSize(22);
  setFont("bold");
  doc.setTextColor(...COLORS.primary);
  doc.text(opts.companyName || "FishCare Pro", textStartX, y + 6);

  // Invoice label (right)
  doc.setFontSize(28);
  doc.setTextColor(...COLORS.secondary);
  setFont("bold");
  doc.text(isBn ? "ইনভয়েস" : "INVOICE", pageWidth - margin, y + 6, { align: "right" });

  y += 12;

  // Company contact info
  doc.setFontSize(8);
  setFont("normal");
  doc.setTextColor(...COLORS.textMuted);
  const contactLines = [
    opts.companyAddress || "",
    `${isBn ? "ফোন" : "Phone"}: ${opts.companyPhone}`,
    `${isBn ? "ইমেইল" : "Email"}: ${opts.companyEmail}`,
    `${isBn ? "ওয়েবসাইট" : "Web"}: ${opts.companyWebsite}`,
  ];
  contactLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 3.5;
  });

  // Copy type badge (right side)
  const copyLabel = isAdmin
    ? (isBn ? "অফিস কপি" : "OFFICE COPY")
    : (isBn ? "কাস্টমার কপি" : "CUSTOMER COPY");
  const badgeColor = isAdmin ? COLORS.warning : COLORS.accent;
  const badgeWidth = 38;
  const badgeX = pageWidth - margin - badgeWidth;
  const badgeY = y - 12;
  drawRoundedRect(doc, badgeX, badgeY, badgeWidth, 7, 1.5, badgeColor);
  doc.setFontSize(8);
  setFont("bold");
  doc.setTextColor(...COLORS.white);
  doc.text(copyLabel, badgeX + badgeWidth / 2, badgeY + 4.8, { align: "center" });

  y += 4;

  // Divider
  drawLine(doc, margin, y, pageWidth - margin, y, COLORS.primary, 0.6);
  y += 6;

  // ==================== INVOICE INFO ROW ====================
  drawRoundedRect(doc, margin, y, contentWidth, 22, 2, COLORS.primaryLight);

  const infoY = y + 5;
  const col1 = margin + 5;
  const col2 = margin + contentWidth * 0.35;
  const col3 = margin + contentWidth * 0.65;

  // Column 1: Order info
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  setFont("normal");
  doc.text(isBn ? "অর্ডার নম্বর" : "ORDER NO.", col1, infoY);
  doc.setFontSize(10);
  setFont("bold");
  doc.setTextColor(...COLORS.textDark);
  doc.text(order.order_number, col1, infoY + 5);

  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  setFont("normal");
  doc.text(isBn ? "তারিখ" : "DATE", col1, infoY + 11);
  doc.setFontSize(9);
  setFont("bold");
  doc.setTextColor(...COLORS.textDark);
  doc.text(formatDate(order.created_at, isBn), col1, infoY + 15);

  // Column 2: Status
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  setFont("normal");
  doc.text(isBn ? "অর্ডার স্ট্যাটাস" : "ORDER STATUS", col2, infoY);

  const statusLabels: Record<string, { bn: string; en: string }> = {
    pending: { bn: "পেন্ডিং", en: "Pending" },
    processing: { bn: "প্রসেসিং", en: "Processing" },
    shipped: { bn: "শিপড", en: "Shipped" },
    delivered: { bn: "ডেলিভারড", en: "Delivered" },
    cancelled: { bn: "বাতিল", en: "Cancelled" },
    refunded: { bn: "রিফান্ড", en: "Refunded" },
  };
  const statusText = statusLabels[order.status]?.[opts.language] || order.status;
  const statusColor = order.status === "delivered" ? COLORS.success :
    order.status === "cancelled" ? COLORS.danger :
      order.status === "shipped" ? COLORS.accent : COLORS.warning;
  doc.setFontSize(9);
  setFont("bold");
  doc.setTextColor(...statusColor);
  doc.text(statusText, col2, infoY + 5);

  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  setFont("normal");
  doc.text(isBn ? "পেমেন্ট স্ট্যাটাস" : "PAYMENT STATUS", col2, infoY + 11);
  const paymentLabels: Record<string, { bn: string; en: string }> = {
    pending: { bn: "পেন্ডিং", en: "Pending" },
    paid: { bn: "পেইড", en: "Paid" },
    failed: { bn: "ব্যর্থ", en: "Failed" },
    refunded: { bn: "রিফান্ড", en: "Refunded" },
    verification_pending: { bn: "ভেরিফাই পেন্ডিং", en: "Verification Pending" },
  };
  const payStatusText = paymentLabels[order.payment_status]?.[opts.language] || order.payment_status;
  const payColor = order.payment_status === "paid" ? COLORS.success : COLORS.warning;
  doc.setFontSize(9);
  setFont("bold");
  doc.setTextColor(...payColor);
  doc.text(payStatusText, col2, infoY + 15);

  // Column 3: Payment method
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  setFont("normal");
  doc.text(isBn ? "পেমেন্ট পদ্ধতি" : "PAYMENT METHOD", col3, infoY);
  const paymentMethods: Record<string, { bn: string; en: string }> = {
    cod: { bn: "ক্যাশ অন ডেলিভারি", en: "Cash on Delivery" },
    bkash: { bn: "বিকাশ", en: "bKash" },
    nagad: { bn: "নগদ", en: "Nagad" },
  };
  doc.setFontSize(9);
  setFont("bold");
  doc.setTextColor(...COLORS.textDark);
  doc.text(paymentMethods[order.payment_method]?.[opts.language] || order.payment_method, col3, infoY + 5);

  if (order.payment_trx_id) {
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textMuted);
    setFont("normal");
    doc.text(isBn ? "ট্রানজেকশন আইডি" : "TXN ID", col3, infoY + 11);
    doc.setFontSize(8);
    setFont("bold");
    doc.setTextColor(...COLORS.textDark);
    doc.text(order.payment_trx_id, col3, infoY + 15);
  }

  y += 28;

  // ==================== BILLING / SHIPPING INFO ====================
  const billingBoxWidth = contentWidth / 2 - 3;

  // Bill To
  drawRoundedRect(doc, margin, y, billingBoxWidth, 30, 2, COLORS.bgLight);
  doc.setFontSize(8);
  setFont("bold");
  doc.setTextColor(...COLORS.primary);
  doc.text(isBn ? "বিলিং তথ্য" : "BILL TO", margin + 5, y + 6);

  doc.setFontSize(10);
  setFont("bold");
  doc.setTextColor(...COLORS.textDark);
  doc.text(order.shipping_name, margin + 5, y + 12);

  doc.setFontSize(8);
  setFont("normal");
  doc.setTextColor(...COLORS.textMuted);
  doc.text(order.shipping_mobile, margin + 5, y + 17);

  if (order.customer_email) {
    doc.text(order.customer_email, margin + 5, y + 21);
  }

  // Shipping To
  const shipX = margin + billingBoxWidth + 6;
  drawRoundedRect(doc, shipX, y, billingBoxWidth, 30, 2, COLORS.bgLight);
  doc.setFontSize(8);
  setFont("bold");
  doc.setTextColor(...COLORS.primary);
  doc.text(isBn ? "ডেলিভারি ঠিকানা" : "SHIP TO", shipX + 5, y + 6);

  const addressParts = [order.shipping_address, order.shipping_upazila, order.shipping_district, order.shipping_division]
    .filter(Boolean);
  
  let addrY = y + 12;
  doc.setFontSize(8.5);
  setFont("normal");
  doc.setTextColor(...COLORS.textDark);
  
  const fullAddr = addressParts.join(", ");
  const addrLines = doc.splitTextToSize(fullAddr, billingBoxWidth - 10);
  addrLines.forEach((line: string) => {
    if (addrY < y + 28) {
      doc.text(line, shipX + 5, addrY);
      addrY += 4;
    }
  });

  y += 36;

  // ==================== ADMIN-ONLY NOTES ====================
  if (isAdmin && (order.customer_note || order.admin_note)) {
    drawRoundedRect(doc, margin, y, contentWidth, 16, 2, [255, 251, 235]);
    doc.setFontSize(7);
    setFont("bold");
    doc.setTextColor(...COLORS.warning);
    doc.text(isBn ? "নোট (শুধুমাত্র অফিস)" : "NOTES (OFFICE ONLY)", margin + 5, y + 5);
    
    doc.setFontSize(8);
    setFont("normal");
    doc.setTextColor(...COLORS.textDark);
    if (order.customer_note) {
      doc.text(`${isBn ? "কাস্টমার" : "Customer"}: ${order.customer_note}`, margin + 5, y + 10);
    }
    if (order.admin_note) {
      doc.text(`${isBn ? "এডমিন" : "Admin"}: ${order.admin_note}`, margin + 5, y + 14);
    }
    y += 20;
  }

  // ==================== ITEMS TABLE ====================
  doc.setFontSize(9);
  setFont("bold");
  doc.setTextColor(...COLORS.primary);
  doc.text(isBn ? "পণ্যের বিবরণ" : "ORDER ITEMS", margin, y + 4);
  y += 7;

  const tableHeaders = [
    [
      "#",
      isBn ? "পণ্যের নাম" : "Product",
      isBn ? "একক দাম" : "Unit Price",
      isBn ? "ছাড়" : "Disc%",
      isBn ? "পরিমাণ" : "Qty",
      isBn ? "মোট" : "Total",
    ],
  ];

  const tableData = order.items?.map((item, idx) => {
    return [
      (idx + 1).toString(),
      item.product_name,
      formatPrice(item.unit_price),
      item.discount_percentage > 0 ? `${item.discount_percentage}%` : "-",
      item.quantity.toString(),
      formatPrice(item.total_price),
    ];
  }) || [];

  const fontName = getFontName(isBn);

  autoTable(doc, {
    startY: y,
    head: tableHeaders,
    body: tableData,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 3,
      font: fontName,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: COLORS.textDark,
      cellPadding: 2.5,
      lineColor: COLORS.border,
      lineWidth: 0.1,
      font: fontName,
    },
    alternateRowStyles: {
      fillColor: [250, 253, 251],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 28, halign: "right" },
      3: { cellWidth: 16, halign: "center" },
      4: { cellWidth: 16, halign: "center" },
      5: { cellWidth: 32, halign: "right", fontStyle: "bold" },
    },
    tableLineColor: COLORS.border,
    tableLineWidth: 0.1,
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ==================== TOTALS SECTION ====================
  const totalsWidth = 80;
  const totalsX = pageWidth - margin - totalsWidth;

  drawRoundedRect(doc, totalsX - 5, y - 2, totalsWidth + 5, order.discount_amount > 0 ? 38 : 30, 2, COLORS.bgLight);

  const labelX = totalsX;
  const valueX = pageWidth - margin - 2;
  let tY = y + 4;

  doc.setFontSize(8.5);
  setFont("normal");
  doc.setTextColor(...COLORS.textMuted);
  doc.text(isBn ? "সাবটোটাল:" : "Subtotal:", labelX, tY);
  doc.setTextColor(...COLORS.textDark);
  doc.text(formatPrice(order.subtotal), valueX, tY, { align: "right" });

  tY += 6;
  doc.setTextColor(...COLORS.textMuted);
  doc.text(isBn ? "ডেলিভারি চার্জ:" : "Shipping:", labelX, tY);
  doc.setTextColor(...COLORS.textDark);
  doc.text(order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : (isBn ? "ফ্রি" : "Free"), valueX, tY, { align: "right" });

  if (order.discount_amount > 0) {
    tY += 6;
    doc.setTextColor(...COLORS.success);
    doc.text(isBn ? "ডিসকাউন্ট:" : "Discount:", labelX, tY);
    doc.text(`-${formatPrice(order.discount_amount)}`, valueX, tY, { align: "right" });
  }

  tY += 3;
  drawLine(doc, labelX, tY, valueX, tY, COLORS.primary, 0.4);
  tY += 6;

  // Grand total with highlight
  drawRoundedRect(doc, totalsX - 5, tY - 4, totalsWidth + 5, 10, 1.5, COLORS.primary);
  doc.setFontSize(10);
  setFont("bold");
  doc.setTextColor(...COLORS.white);
  doc.text(isBn ? "সর্বমোট:" : "TOTAL:", labelX, tY + 2);
  doc.text(formatPrice(order.total_amount), valueX, tY + 2, { align: "right" });

  y = tY + 14;

  // ==================== TRACKING INFO ====================
  if (order.courier_name || order.tracking_number) {
    drawRoundedRect(doc, margin, y, contentWidth, 18, 2, COLORS.primaryLight);
    doc.setFontSize(8);
    setFont("bold");
    doc.setTextColor(...COLORS.primary);
    doc.text(isBn ? "শিপমেন্ট ট্র্যাকিং" : "SHIPMENT TRACKING", margin + 5, y + 5);

    let trackY = y + 10;
    doc.setFontSize(8);
    setFont("normal");
    doc.setTextColor(...COLORS.textDark);
    if (order.courier_name) {
      doc.text(`${isBn ? "কুরিয়ার:" : "Courier:"} ${order.courier_name}`, margin + 5, trackY);
    }
    if (order.tracking_number) {
      doc.text(`${isBn ? "ট্র্যাকিং নম্বর:" : "Tracking:"} ${order.tracking_number}`, margin + contentWidth * 0.4, trackY);
    }
    if (order.estimated_delivery) {
      doc.text(`${isBn ? "আনুমানিক ডেলিভারি:" : "Est. Delivery:"} ${formatDate(order.estimated_delivery, isBn)}`, margin + 5, trackY + 4.5);
    }
    y += 22;
  }

  // ==================== FOOTER ====================
  const footerStartY = pageHeight - 28;

  // Footer accent bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, pageHeight - 4, pageWidth, 4, "F");

  // Footer divider
  drawLine(doc, margin, footerStartY, pageWidth - margin, footerStartY, COLORS.primary, 0.4);

  // Thank you message
  doc.setFontSize(10);
  setFont("bold");
  doc.setTextColor(...COLORS.primary);
  doc.text(
    isBn ? "আপনার অর্ডারের জন্য ধন্যবাদ!" : "Thank you for your order!",
    pageWidth / 2,
    footerStartY + 6,
    { align: "center" }
  );

  // Support line
  doc.setFontSize(7.5);
  setFont("normal");
  doc.setTextColor(...COLORS.textMuted);
  doc.text(
    isBn
      ? "কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন।"
      : "For questions or support, please contact us.",
    pageWidth / 2,
    footerStartY + 11,
    { align: "center" }
  );

  // Website & contact
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.accent);
  doc.text(
    `${opts.companyWebsite} | ${opts.companyPhone} | ${opts.companyEmail}`,
    pageWidth / 2,
    footerStartY + 16,
    { align: "center" }
  );

  // Copy type watermark at bottom-right
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.border);
  doc.text(
    isAdmin ? "Office Copy" : "Customer Copy",
    pageWidth - margin,
    footerStartY + 20,
    { align: "right" }
  );

  // Save
  const suffix = isAdmin ? "Admin" : "Customer";
  doc.save(`Invoice-${order.order_number}-${suffix}.pdf`);
};

export default generateInvoicePDF;
