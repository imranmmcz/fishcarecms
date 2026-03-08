import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { registerBanglaFont, setBanglaFont, getDocFontName } from "@/lib/pdfBanglaFont";

interface FormulaIngredient {
  name: string;
  nameBn: string;
  percentage: number;
  protein: number;
  fat: number;
  fiber: number;
  moisture: number;
  ash: number;
  costPerKg: number;
  category: string;
}

interface FormulaAnalysis {
  protein: number;
  fat: number;
  fiber: number;
  moisture: number;
  ash: number;
  costPerKg: number;
}

interface FeedFormulaPDFOptions {
  language: "bn" | "en";
  ingredients: FormulaIngredient[];
  analysis: FormulaAnalysis;
  batchWeight: number;
  totalCost: number;
  presetName?: string;
}

export const generateFeedFormulaPDF = async (options: FeedFormulaPDFOptions) => {
  const { language, ingredients, analysis, batchWeight, totalCost, presetName } = options;
  const isBn = language === "bn";

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = margin;

  // Register Nikosh font
  await registerBanglaFont(doc);
  const setFont = (style: "normal" | "bold" = "normal") => setBanglaFont(doc, isBn, style);
  const fontName = getDocFontName(doc, isBn);

  // ========== HEADER ==========
  doc.setFontSize(22);
  setFont("bold");
  doc.setTextColor(16, 124, 65);
  doc.text("FishCare Pro", margin, yPos);

  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(isBn ? "খাদ্য ফর্মুলা রিপোর্ট" : "Feed Formula Report", pageWidth - margin, yPos, { align: "right" });

  yPos += 8;
  doc.setFontSize(9);
  setFont("normal");
  doc.setTextColor(100, 100, 100);
  const now = new Date();
  doc.text(
    `${isBn ? "তারিখ" : "Date"}: ${now.toLocaleDateString(isBn ? "bn-BD" : "en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    margin, yPos
  );
  if (presetName) {
    doc.text(`${isBn ? "প্রিসেট" : "Preset"}: ${presetName}`, pageWidth - margin, yPos, { align: "right" });
  }

  yPos += 10;

  // ========== NUTRITION SUMMARY BOX ==========
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 30, 2, 2, "F");
  doc.setDrawColor(16, 124, 65);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 30, 2, 2, "S");

  const boxY = yPos + 7;
  doc.setFontSize(11);
  setFont("bold");
  doc.setTextColor(16, 124, 65);
  doc.text(isBn ? "পুষ্টিমান সারাংশ" : "Nutrition Summary", margin + 5, boxY);

  doc.setFontSize(9);
  setFont("normal");
  doc.setTextColor(50, 50, 50);
  const col1 = margin + 5;
  const col2 = margin + 65;
  const col3 = margin + 120;

  doc.text(`${isBn ? "প্রোটিন" : "Protein"}: ${analysis.protein.toFixed(1)}%`, col1, boxY + 8);
  doc.text(`${isBn ? "ফ্যাট" : "Fat"}: ${analysis.fat.toFixed(1)}%`, col2, boxY + 8);
  doc.text(`${isBn ? "ফাইবার" : "Fiber"}: ${analysis.fiber.toFixed(1)}%`, col3, boxY + 8);
  doc.text(`${isBn ? "আর্দ্রতা" : "Moisture"}: ${analysis.moisture.toFixed(1)}%`, col1, boxY + 15);
  doc.text(`${isBn ? "অ্যাশ" : "Ash"}: ${analysis.ash.toFixed(1)}%`, col2, boxY + 15);
  setFont("bold");
  doc.setTextColor(16, 124, 65);
  doc.text(`${isBn ? "খরচ/কেজি" : "Cost/kg"}: ৳${analysis.costPerKg.toFixed(2)}`, col3, boxY + 15);

  yPos += 38;

  // ========== INGREDIENTS TABLE ==========
  doc.setFontSize(12);
  setFont("bold");
  doc.setTextColor(0, 0, 0);
  doc.text(isBn ? "ফর্মুলা উপাদান তালিকা" : "Formula Ingredients", margin, yPos);
  yPos += 4;

  const headers = [
    [
      isBn ? "উপাদান" : "Ingredient",
      "%",
      isBn ? "প্রোটিন%" : "Protein%",
      isBn ? "ফ্যাট%" : "Fat%",
      isBn ? "দাম/কেজি" : "Price/kg",
    ],
  ];

  const categoryLabels: Record<string, string> = {
    protein: isBn ? "প্রোটিন উৎস" : "Protein Sources",
    energy: isBn ? "শক্তি উৎস" : "Energy Sources",
    additive: isBn ? "সংযোজন" : "Additives",
  };

  const grouped: Record<string, FormulaIngredient[]> = {};
  ingredients.forEach((ing) => {
    if (!grouped[ing.category]) grouped[ing.category] = [];
    grouped[ing.category].push(ing);
  });

  const tableData: (string | { content: string; colSpan: number; styles: any })[][] = [];
  Object.entries(grouped).forEach(([cat, items]) => {
    tableData.push([
      { content: categoryLabels[cat] || cat, colSpan: 5, styles: { fillColor: [230, 230, 230], fontStyle: "bold", fontSize: 8 } } as any,
    ]);
    items.forEach((ing) => {
      tableData.push([
        isBn ? ing.nameBn : ing.name,
        `${ing.percentage}%`,
        `${ing.protein}%`,
        `${ing.fat}%`,
        `৳${ing.costPerKg}`,
      ]);
    });
  });

  autoTable(doc, {
    startY: yPos,
    head: headers,
    body: tableData,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [16, 124, 65], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, font: fontName },
    bodyStyles: { fontSize: 9, textColor: [50, 50, 50], font: fontName },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 22, halign: "center" },
      4: { cellWidth: 28, halign: "right" },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ========== BATCH CALCULATION ==========
  doc.setFontSize(12);
  setFont("bold");
  doc.setTextColor(0, 0, 0);
  doc.text(
    `${isBn ? "ব্যাচ হিসাব" : "Batch Calculation"} (${batchWeight} ${isBn ? "কেজি" : "kg"})`,
    margin, yPos
  );
  yPos += 4;

  const batchHeaders = [
    [
      isBn ? "উপাদান" : "Ingredient",
      "%",
      isBn ? "পরিমাণ (কেজি)" : "Amount (kg)",
      isBn ? "খরচ (৳)" : "Cost (৳)",
    ],
  ];

  const batchData = ingredients.map((ing) => [
    isBn ? ing.nameBn : ing.name,
    `${ing.percentage}%`,
    `${((ing.percentage / 100) * batchWeight).toFixed(2)}`,
    `৳${((ing.percentage / 100) * batchWeight * ing.costPerKg).toFixed(0)}`,
  ]);

  batchData.push([
    isBn ? "মোট" : "Total",
    "100%",
    `${batchWeight.toFixed(2)}`,
    `৳${totalCost.toFixed(0)}`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: batchHeaders,
    body: batchData,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [16, 124, 65], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, font: fontName },
    bodyStyles: { fontSize: 9, textColor: [50, 50, 50], font: fontName },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
    },
    didParseCell: (data: any) => {
      if (data.row.index === batchData.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [240, 253, 244];
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ========== TIPS ==========
  if (yPos < 240) {
    doc.setFillColor(255, 251, 235);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 28, 2, 2, "F");
    doc.setFontSize(9);
    setFont("bold");
    doc.setTextColor(120, 80, 0);
    doc.text(isBn ? "গুরুত্বপূর্ণ টিপস:" : "Important Tips:", margin + 5, yPos + 6);
    setFont("normal");
    doc.setFontSize(8);
    const tips = isBn
      ? [
          "• সকল উপাদান ভালোভাবে মিশিয়ে পেলেট মেশিনে দিন",
          "• ফিড শুকনো এবং ঠাণ্ডা জায়গায় সংরক্ষণ করুন",
          "• তৈরি খাবার ৩০ দিনের মধ্যে ব্যবহার করুন",
        ]
      : [
          "• Mix all ingredients well before pelleting",
          "• Store feed in a cool, dry place",
          "• Use prepared feed within 30 days",
        ];
    tips.forEach((tip, i) => {
      doc.text(tip, margin + 5, yPos + 12 + i * 5);
    });
  }

  // ========== FOOTER ==========
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(16, 124, 65);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  doc.setFontSize(8);
  setFont("normal");
  doc.setTextColor(100, 100, 100);
  doc.text("FishCare Pro — fishcare.com.bd", pageWidth / 2, footerY, { align: "center" });
  doc.text(
    isBn ? "এই ফর্মুলা শুধুমাত্র গাইডলাইন হিসেবে ব্যবহার করুন" : "Use this formula as a guideline only",
    pageWidth / 2, footerY + 4, { align: "center" }
  );

  const dateStr = now.toISOString().split("T")[0];
  doc.save(`Feed-Formula-${presetName || "Custom"}-${dateStr}.pdf`);
};
