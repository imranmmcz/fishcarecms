/**
 * Invoice Download Button Component
 * কাস্টমার ও এডমিন কপি সহ ইনভয়েস ডাউনলোড বাটন
 */

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Order } from "@/lib/api-client";
import { generateInvoicePDF } from "@/lib/generateInvoicePDF";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InvoiceDownloadButtonProps {
  order: Order;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
  showAdminOption?: boolean;
}

export const InvoiceDownloadButton = ({
  order,
  variant = "outline",
  size = "sm",
  className = "",
  showText = true,
  showAdminOption = false,
}: InvoiceDownloadButtonProps) => {
  const { language } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);

  const translations = {
    invoice: language === "bn" ? "ইনভয়েস" : "Invoice",
    generating: language === "bn" ? "তৈরি হচ্ছে..." : "Generating...",
    success: language === "bn" ? "ইনভয়েস ডাউনলোড হয়েছে" : "Invoice downloaded",
    error: language === "bn" ? "ইনভয়েস তৈরি করতে সমস্যা হয়েছে" : "Failed to generate invoice",
    customerCopy: language === "bn" ? "কাস্টমার কপি" : "Customer Copy",
    adminCopy: language === "bn" ? "অফিস কপি" : "Office Copy",
  };

  const handleDownload = async (copyType: "customer" | "admin") => {
    setIsGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      generateInvoicePDF(order, { language, copyType });
      toast.success(translations.success);
    } catch (error) {
      console.error("Failed to generate invoice:", error);
      toast.error(translations.error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!showAdminOption) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleDownload("customer")}
        disabled={isGenerating}
        className={className}
      >
        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        {showText && <span className="ml-1">{isGenerating ? translations.generating : translations.invoice}</span>}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isGenerating} className={className}>
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
          {showText && <span className="ml-1">{isGenerating ? translations.generating : translations.invoice}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleDownload("customer")}>
          <FileDown className="h-4 w-4 mr-2" />
          {translations.customerCopy}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload("admin")}>
          <Printer className="h-4 w-4 mr-2" />
          {translations.adminCopy}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default InvoiceDownloadButton;
