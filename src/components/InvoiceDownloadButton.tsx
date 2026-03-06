/**
 * Invoice Download Button - Multi-template, Bengali/English/Dual support
 */

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Order } from "@/lib/api-client";
import { generateInvoicePDF } from "@/lib/generateInvoicePDF";
import { useInvoicePrintSettings } from "@/hooks/useInvoicePrintSettings";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, Printer, Languages } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
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
  order, variant = "outline", size = "sm", className = "", showText = true, showAdminOption = false,
}: InvoiceDownloadButtonProps) => {
  const { language } = useLanguage();
  const { settings: printSettings } = useInvoicePrintSettings();
  const [isGenerating, setIsGenerating] = useState(false);

  const isBn = language === "bn";
  const tt = (bn: string, en: string) => isBn ? bn : en;

  const handleDownload = async (copyType: "customer" | "admin", langOverride?: "bn" | "en" | "dual") => {
    setIsGenerating(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      const langMode = langOverride || printSettings.languageMode;
      generateInvoicePDF(order, {
        language: langMode === "dual" ? "bn" : langMode as "bn" | "en",
        copyType,
        printSettings: { ...printSettings, languageMode: langMode as any },
      });
      toast.success(tt("ইনভয়েস ডাউনলোড হয়েছে", "Invoice downloaded"));
    } catch (error) {
      console.error("Invoice error:", error);
      toast.error(tt("ইনভয়েস তৈরি ব্যর্থ", "Failed to generate invoice"));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isGenerating} className={className}>
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
          {showText && <span className="ml-1">{isGenerating ? tt("তৈরি হচ্ছে...", "Generating...") : tt("ইনভয়েস", "Invoice")}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleDownload("customer")}>
          <FileDown className="h-4 w-4 mr-2" />{tt("ডাউনলোড PDF", "Download PDF")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleDownload("customer", "bn")}>
          <FileDown className="h-4 w-4 mr-2" />{tt("বাংলা কপি", "Bengali Copy")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload("customer", "en")}>
          <FileDown className="h-4 w-4 mr-2" />{tt("ইংরেজি কপি", "English Copy")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload("customer", "dual")}>
          <Languages className="h-4 w-4 mr-2" />{tt("ডুয়াল ভাষা", "Dual Language")}
        </DropdownMenuItem>
        {showAdminOption && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDownload("admin")}>
              <Printer className="h-4 w-4 mr-2" />{tt("অফিস কপি", "Office Copy")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default InvoiceDownloadButton;
