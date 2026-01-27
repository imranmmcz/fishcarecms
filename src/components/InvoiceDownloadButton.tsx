/**
 * Invoice Download Button Component
 * অর্ডার ইনভয়েস ডাউনলোড বাটন
 */

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Order } from "@/lib/api-client";
import { generateInvoicePDF } from "@/lib/generateInvoicePDF";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface InvoiceDownloadButtonProps {
  order: Order;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}

export const InvoiceDownloadButton = ({
  order,
  variant = "outline",
  size = "sm",
  className = "",
  showText = true,
}: InvoiceDownloadButtonProps) => {
  const { language } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);

  const translations = {
    download: language === "bn" ? "ইনভয়েস" : "Invoice",
    downloading: language === "bn" ? "তৈরি হচ্ছে..." : "Generating...",
    success: language === "bn" ? "ইনভয়েস ডাউনলোড হয়েছে" : "Invoice downloaded",
    error: language === "bn" ? "ইনভয়েস তৈরি করতে সমস্যা হয়েছে" : "Failed to generate invoice",
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      // Small delay for UX
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      generateInvoicePDF(order, { language });
      toast.success(translations.success);
    } catch (error) {
      console.error("Failed to generate invoice:", error);
      toast.error(translations.error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isGenerating}
      className={className}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      {showText && (
        <span className="ml-1">
          {isGenerating ? translations.downloading : translations.download}
        </span>
      )}
    </Button>
  );
};

export default InvoiceDownloadButton;
