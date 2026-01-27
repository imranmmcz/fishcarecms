/**
 * Invoice PDF Generator
 * অর্ডার ইনভয়েস PDF জেনারেট করার ইউটিলিটি
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Order } from "@/lib/api-client";

interface InvoiceOptions {
  language: "bn" | "en";
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogo?: string;
}

const defaultOptions: InvoiceOptions = {
  language: "bn",
  companyName: "FishCare Pro",
  companyAddress: "ঢাকা, বাংলাদেশ",
  companyPhone: "+880 1XXX-XXXXXX",
  companyEmail: "support@fishcare.com.bd",
};

export const generateInvoicePDF = (order: Order, options: Partial<InvoiceOptions> = {}) => {
  const opts = { ...defaultOptions, ...options };
  const isBn = opts.language === "bn";

  // Create PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = margin;

  // Helper function to format price
  const formatPrice = (amount: number) => {
    return `৳${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper function to format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isBn ? "bn-BD" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // ========== HEADER ==========
  // Company Name
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 139, 34); // Primary green color
  doc.text(opts.companyName || "FishCare Pro", margin, yPos);
  
  // Invoice Title (right aligned)
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text(isBn ? "ইনভয়েস" : "INVOICE", pageWidth - margin, yPos, { align: "right" });
  
  yPos += 8;
  
  // Company Contact Info
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(opts.companyAddress || "", margin, yPos);
  yPos += 4;
  doc.text(`${opts.companyPhone} | ${opts.companyEmail}`, margin, yPos);
  
  yPos += 12;

  // ========== INVOICE INFO BOX ==========
  // Draw info box
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 28, 2, 2, "F");
  
  const infoY = yPos + 6;
  const col1 = margin + 5;
  const col2 = pageWidth / 2 + 10;
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(isBn ? "অর্ডার নম্বর:" : "Order Number:", col1, infoY);
  doc.text(isBn ? "তারিখ:" : "Date:", col1, infoY + 8);
  doc.text(isBn ? "স্ট্যাটাস:" : "Status:", col2, infoY);
  doc.text(isBn ? "পেমেন্ট:" : "Payment:", col2, infoY + 8);
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(order.order_number, col1 + 35, infoY);
  doc.text(formatDate(order.created_at), col1 + 35, infoY + 8);
  
  // Status with color
  const statusLabels: Record<string, { bn: string; en: string }> = {
    pending: { bn: "পেন্ডিং", en: "Pending" },
    processing: { bn: "প্রসেসিং", en: "Processing" },
    shipped: { bn: "শিপড", en: "Shipped" },
    delivered: { bn: "ডেলিভারড", en: "Delivered" },
    cancelled: { bn: "বাতিল", en: "Cancelled" },
    refunded: { bn: "রিফান্ড", en: "Refunded" },
  };
  doc.text(statusLabels[order.status]?.[opts.language] || order.status, col2 + 25, infoY);
  
  // Payment status
  const paymentLabels: Record<string, { bn: string; en: string }> = {
    pending: { bn: "পেন্ডিং", en: "Pending" },
    paid: { bn: "পেইড", en: "Paid" },
    failed: { bn: "ব্যর্থ", en: "Failed" },
    refunded: { bn: "রিফান্ড", en: "Refunded" },
    verification_pending: { bn: "ভেরিফাই পেন্ডিং", en: "Verification Pending" },
  };
  doc.text(paymentLabels[order.payment_status]?.[opts.language] || order.payment_status, col2 + 25, infoY + 8);
  
  yPos += 35;

  // ========== BILLING INFO ==========
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 139, 34);
  doc.text(isBn ? "বিল করা হয়েছে:" : "Bill To:", margin, yPos);
  
  yPos += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(order.shipping_name, margin, yPos);
  
  yPos += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(order.shipping_mobile, margin, yPos);
  
  yPos += 5;
  const address = [order.shipping_address, order.shipping_upazila, order.shipping_district, order.shipping_division]
    .filter(Boolean)
    .join(", ");
  if (address) {
    const addressLines = doc.splitTextToSize(address, pageWidth - margin * 2 - 20);
    doc.text(addressLines, margin, yPos);
    yPos += addressLines.length * 4;
  }
  
  yPos += 8;

  // ========== ITEMS TABLE ==========
  const tableHeaders = [
    [
      isBn ? "পণ্য" : "Product",
      isBn ? "দাম" : "Price",
      isBn ? "পরিমাণ" : "Qty",
      isBn ? "মোট" : "Total",
    ],
  ];

  const tableData = order.items?.map((item) => {
    const unitPrice = item.unit_price * (1 - item.discount_percentage / 100);
    return [
      item.product_name,
      formatPrice(unitPrice),
      item.quantity.toString(),
      formatPrice(item.total_price),
    ];
  }) || [];

  autoTable(doc, {
    startY: yPos,
    head: tableHeaders,
    body: tableData,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [34, 139, 34],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [50, 50, 50],
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 30, halign: "right" },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 35, halign: "right" },
    },
  });

  // Get final Y position after table
  yPos = (doc as any).lastAutoTable.finalY + 8;

  // ========== TOTALS ==========
  const totalsX = pageWidth - margin - 70;
  const totalsValueX = pageWidth - margin;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(isBn ? "সাবটোটাল:" : "Subtotal:", totalsX, yPos);
  doc.text(formatPrice(order.subtotal), totalsValueX, yPos, { align: "right" });
  
  yPos += 6;
  doc.text(isBn ? "ডেলিভারি:" : "Shipping:", totalsX, yPos);
  doc.text(order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : (isBn ? "ফ্রি" : "Free"), totalsValueX, yPos, { align: "right" });
  
  if (order.discount_amount > 0) {
    yPos += 6;
    doc.setTextColor(34, 139, 34);
    doc.text(isBn ? "ডিসকাউন্ট:" : "Discount:", totalsX, yPos);
    doc.text(`-${formatPrice(order.discount_amount)}`, totalsValueX, yPos, { align: "right" });
  }
  
  yPos += 3;
  doc.setDrawColor(200, 200, 200);
  doc.line(totalsX - 5, yPos, totalsValueX, yPos);
  
  yPos += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(isBn ? "মোট:" : "Total:", totalsX, yPos);
  doc.setTextColor(34, 139, 34);
  doc.text(formatPrice(order.total_amount), totalsValueX, yPos, { align: "right" });

  // ========== PAYMENT METHOD ==========
  yPos += 15;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  
  const paymentMethods: Record<string, { bn: string; en: string }> = {
    cod: { bn: "ক্যাশ অন ডেলিভারি", en: "Cash on Delivery" },
    bkash: { bn: "বিকাশ", en: "bKash" },
    nagad: { bn: "নগদ", en: "Nagad" },
  };
  
  doc.text(
    `${isBn ? "পেমেন্ট পদ্ধতি:" : "Payment Method:"} ${paymentMethods[order.payment_method]?.[opts.language] || order.payment_method}`,
    margin,
    yPos
  );

  // Transaction ID for bKash/Nagad
  if (order.payment_trx_id && (order.payment_method === "bkash" || order.payment_method === "nagad")) {
    yPos += 6;
    doc.text(`${isBn ? "ট্রানজেকশন আইডি:" : "Transaction ID:"} ${order.payment_trx_id}`, margin, yPos);
  }

  // ========== TRACKING INFO ==========
  if (order.courier_name || order.tracking_number) {
    yPos += 12;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 139, 34);
    doc.text(isBn ? "শিপমেন্ট তথ্য:" : "Shipment Info:", margin, yPos);
    
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    
    if (order.courier_name) {
      doc.text(`${isBn ? "কুরিয়ার:" : "Courier:"} ${order.courier_name}`, margin, yPos);
      yPos += 5;
    }
    if (order.tracking_number) {
      doc.text(`${isBn ? "ট্র্যাকিং নম্বর:" : "Tracking No:"} ${order.tracking_number}`, margin, yPos);
      yPos += 5;
    }
    if (order.estimated_delivery) {
      doc.text(`${isBn ? "আনুমানিক ডেলিভারি:" : "Est. Delivery:"} ${formatDate(order.estimated_delivery)}`, margin, yPos);
    }
  }

  // ========== FOOTER ==========
  const footerY = doc.internal.pageSize.getHeight() - 20;
  
  doc.setDrawColor(34, 139, 34);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(
    isBn ? "ধন্যবাদ আপনার অর্ডারের জন্য!" : "Thank you for your order!",
    pageWidth / 2,
    footerY,
    { align: "center" }
  );
  doc.text(
    isBn ? "কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন।" : "Contact us for any questions.",
    pageWidth / 2,
    footerY + 5,
    { align: "center" }
  );

  // Save the PDF
  doc.save(`Invoice-${order.order_number}.pdf`);
};

export default generateInvoicePDF;
