/**
 * Purchase Order Invoice PDF Generator
 * ক্রয় অর্ডার ইনভয়েস PDF জেনারেট করার ইউটিলিটি
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { registerBanglaFont, setBanglaFont } from "@/lib/pdfBanglaFont";

export interface PurchaseOrderItem {
  product_name?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

export interface PurchaseOrderData {
  order_number: string;
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  status: string;
  order_date: string;
  expected_date?: string | null;
  received_date?: string | null;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  notes?: string | null;
  items: PurchaseOrderItem[];
}

interface InvoiceOptions {
  language: "bn" | "en";
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
}

const defaultOptions: InvoiceOptions = {
  language: "bn",
  companyName: "FishCare Pro",
  companyAddress: "ঢাকা, বাংলাদেশ",
  companyPhone: "+880 1XXX-XXXXXX",
  companyEmail: "support@fishcare.com.bd",
};

export const generatePurchaseOrderPDF = async (order: PurchaseOrderData, options: Partial<InvoiceOptions> = {}) => {
  const opts = { ...defaultOptions, ...options };
  const isBn = opts.language === "bn";

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = margin;

  // Register Nikosh font
  await registerBanglaFont(doc);
  const setFont = (style: "normal" | "bold" = "normal") => setBanglaFont(doc, isBn, style);
  const fontName = isBn ? "Nikosh" : "helvetica";

  const formatPrice = (amount: number) => {
    return `৳${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString(isBn ? "bn-BD" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // ========== HEADER ==========
  doc.setFontSize(24);
  setFont("bold");
  doc.setTextColor(124, 58, 237);
  doc.text(opts.companyName || "FishCare Pro", margin, yPos);
  
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(isBn ? "ক্রয় অর্ডার" : "PURCHASE ORDER", pageWidth - margin, yPos, { align: "right" });
  
  yPos += 8;
  
  doc.setFontSize(9);
  setFont("normal");
  doc.setTextColor(100, 100, 100);
  doc.text(opts.companyAddress || "", margin, yPos);
  yPos += 4;
  doc.text(`${opts.companyPhone} | ${opts.companyEmail}`, margin, yPos);
  
  yPos += 12;

  // ========== PO INFO BOX ==========
  doc.setFillColor(248, 245, 255);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 32, 2, 2, "F");
  
  const infoY = yPos + 6;
  const col1 = margin + 5;
  const col2x = pageWidth / 2 + 10;
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  setFont("normal");
  doc.text(isBn ? "অর্ডার নম্বর:" : "PO Number:", col1, infoY);
  doc.text(isBn ? "অর্ডার তারিখ:" : "Order Date:", col1, infoY + 8);
  doc.text(isBn ? "স্ট্যাটাস:" : "Status:", col2x, infoY);
  doc.text(isBn ? "প্রত্যাশিত তারিখ:" : "Expected Date:", col2x, infoY + 8);
  
  if (order.received_date) {
    doc.text(isBn ? "প্রাপ্তির তারিখ:" : "Received Date:", col1, infoY + 16);
  }
  
  setFont("bold");
  doc.setTextColor(0, 0, 0);
  doc.text(order.order_number, col1 + 35, infoY);
  doc.text(formatDate(order.order_date), col1 + 35, infoY + 8);
  
  const statusLabels: Record<string, { bn: string; en: string }> = {
    pending: { bn: "পেন্ডিং", en: "Pending" },
    ordered: { bn: "অর্ডার করা হয়েছে", en: "Ordered" },
    received: { bn: "প্রাপ্ত", en: "Received" },
    cancelled: { bn: "বাতিল", en: "Cancelled" },
  };
  
  const statusColors: Record<string, [number, number, number]> = {
    pending: [245, 158, 11],
    ordered: [59, 130, 246],
    received: [34, 197, 94],
    cancelled: [239, 68, 68],
  };
  
  const statusColor = statusColors[order.status] || [100, 100, 100];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(statusLabels[order.status]?.[opts.language] || order.status, col2x + 25, infoY);
  
  doc.setTextColor(0, 0, 0);
  doc.text(formatDate(order.expected_date), col2x + 38, infoY + 8);
  
  if (order.received_date) {
    doc.setTextColor(34, 197, 94);
    doc.text(formatDate(order.received_date), col1 + 40, infoY + 16);
  }
  
  yPos += 38;

  // ========== SUPPLIER INFO ==========
  doc.setFontSize(11);
  setFont("bold");
  doc.setTextColor(124, 58, 237);
  doc.text(isBn ? "সাপ্লায়ার:" : "Supplier:", margin, yPos);
  
  yPos += 6;
  doc.setFontSize(10);
  setFont("bold");
  doc.setTextColor(0, 0, 0);
  doc.text(order.company_name || "-", margin, yPos);
  
  if (order.company_address) {
    yPos += 5;
    setFont("normal");
    doc.setTextColor(80, 80, 80);
    doc.text(order.company_address, margin, yPos);
  }
  
  if (order.company_phone) {
    yPos += 4;
    doc.text(order.company_phone, margin, yPos);
  }
  
  yPos += 10;

  // ========== ITEMS TABLE ==========
  const tableHeaders = [
    [
      isBn ? "পণ্য" : "Product",
      isBn ? "পরিমাণ" : "Qty",
      isBn ? "একক মূল্য" : "Unit Cost",
      isBn ? "মোট মূল্য" : "Total Cost",
    ],
  ];

  const tableData = order.items?.map((item) => {
    return [
      item.product_name || "-",
      item.quantity.toString(),
      formatPrice(item.unit_cost),
      formatPrice(item.total_cost),
    ];
  }) || [];

  autoTable(doc, {
    startY: yPos,
    head: tableHeaders,
    body: tableData,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [124, 58, 237],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
      font: fontName,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [50, 50, 50],
      font: fontName,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 25, halign: "center" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 40, halign: "right" },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // ========== TOTALS ==========
  const totalsX = pageWidth - margin - 80;
  const totalsValueX = pageWidth - margin;
  
  doc.setFontSize(10);
  setFont("normal");
  doc.setTextColor(80, 80, 80);
  doc.text(isBn ? "সাবটোটাল:" : "Subtotal:", totalsX, yPos);
  doc.text(formatPrice(order.subtotal), totalsValueX, yPos, { align: "right" });
  
  yPos += 6;
  doc.text(isBn ? "ট্যাক্স:" : "Tax:", totalsX, yPos);
  doc.text(order.tax_amount > 0 ? formatPrice(order.tax_amount) : "৳0.00", totalsValueX, yPos, { align: "right" });
  
  yPos += 6;
  doc.text(isBn ? "শিপিং:" : "Shipping:", totalsX, yPos);
  doc.text(order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : "৳0.00", totalsValueX, yPos, { align: "right" });
  
  yPos += 3;
  doc.setDrawColor(200, 200, 200);
  doc.line(totalsX - 5, yPos, totalsValueX, yPos);
  
  yPos += 8;
  doc.setFontSize(12);
  setFont("bold");
  doc.setTextColor(0, 0, 0);
  doc.text(isBn ? "সর্বমোট:" : "Grand Total:", totalsX, yPos);
  doc.setTextColor(124, 58, 237);
  doc.text(formatPrice(order.total_amount), totalsValueX, yPos, { align: "right" });

  // ========== NOTES ==========
  if (order.notes) {
    yPos += 15;
    doc.setFontSize(10);
    setFont("bold");
    doc.setTextColor(124, 58, 237);
    doc.text(isBn ? "নোট:" : "Notes:", margin, yPos);
    
    yPos += 5;
    setFont("normal");
    doc.setTextColor(80, 80, 80);
    const noteLines = doc.splitTextToSize(order.notes, pageWidth - margin * 2);
    doc.text(noteLines, margin, yPos);
  }

  // ========== FOOTER ==========
  const footerY = doc.internal.pageSize.getHeight() - 20;
  
  doc.setDrawColor(124, 58, 237);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  doc.setFontSize(9);
  setFont("normal");
  doc.setTextColor(100, 100, 100);
  doc.text(
    isBn ? "এটি একটি স্বয়ংক্রিয়ভাবে তৈরি ক্রয় অর্ডার ডকুমেন্ট।" : "This is an auto-generated purchase order document.",
    pageWidth / 2,
    footerY,
    { align: "center" }
  );
  doc.text(
    isBn ? `তারিখ: ${new Date().toLocaleDateString("bn-BD")}` : `Generated: ${new Date().toLocaleDateString("en-US")}`,
    pageWidth / 2,
    footerY + 5,
    { align: "center" }
  );

  doc.save(`PurchaseOrder-${order.order_number}.pdf`);
};

export default generatePurchaseOrderPDF;
