/**
 * Invoice Settings Component
 * ইনভয়েসের কোম্পানি তথ্য কাস্টমাইজ করার কম্পোনেন্ট
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { FileText, Save, Loader2, Upload, X, Eye } from "lucide-react";
import { generateInvoicePDF } from "@/lib/generateInvoicePDF";
import type { Order } from "@/lib/api-client";

const INVOICE_SETTING_KEYS = [
  "invoice_company_name",
  "invoice_company_address",
  "invoice_company_phone",
  "invoice_company_email",
  "invoice_company_website",
  "invoice_company_logo",
] as const;

type InvoiceSettingKey = typeof INVOICE_SETTING_KEYS[number];

const InvoiceSettings = () => {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState<Record<InvoiceSettingKey, string>>({
    invoice_company_name: "FishCare Pro",
    invoice_company_address: "ঢাকা, বাংলাদেশ",
    invoice_company_phone: "+880 1XXX-XXXXXX",
    invoice_company_email: "support@fishcare.com.bd",
    invoice_company_website: "www.fishcare.com.bd",
    invoice_company_logo: "",
  });

  const t = {
    title: language === "bn" ? "ইনভয়েস সেটিংস" : "Invoice Settings",
    description: language === "bn"
      ? "ইনভয়েসে প্রদর্শিত কোম্পানির তথ্য কাস্টমাইজ করুন"
      : "Customize company information displayed on invoices",
    companyName: language === "bn" ? "কোম্পানির নাম" : "Company Name",
    companyAddress: language === "bn" ? "কোম্পানির ঠিকানা" : "Company Address",
    companyPhone: language === "bn" ? "ফোন নম্বর" : "Phone Number",
    companyEmail: language === "bn" ? "ইমেইল" : "Email",
    companyWebsite: language === "bn" ? "ওয়েবসাইট" : "Website",
    companyLogo: language === "bn" ? "কোম্পানির লোগো" : "Company Logo",
    uploadLogo: language === "bn" ? "লোগো আপলোড" : "Upload Logo",
    removeLogo: language === "bn" ? "লোগো সরান" : "Remove Logo",
    save: language === "bn" ? "সেভ করুন" : "Save",
    saving: language === "bn" ? "সেভ হচ্ছে..." : "Saving...",
    saved: language === "bn" ? "সেটিংস সেভ হয়েছে" : "Settings saved",
    error: language === "bn" ? "সেভ করতে সমস্যা হয়েছে" : "Failed to save",
    preview: language === "bn" ? "প্রিভিউ ইনভয়েস" : "Preview Invoice",
    logoHint: language === "bn"
      ? "PNG বা JPG ফরম্যাটে লোগো আপলোড করুন (সর্বোচ্চ ২MB)"
      : "Upload logo in PNG or JPG format (max 2MB)",
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .in("setting_key", [...INVOICE_SETTING_KEYS]);

      if (error) throw error;

      if (data && data.length > 0) {
        const newSettings = { ...settings };
        data.forEach((s) => {
          if (s.setting_value) {
            newSettings[s.setting_key as InvoiceSettingKey] = s.setting_value;
          }
        });
        setSettings(newSettings);
      }
    } catch (err) {
      console.error("Error fetching invoice settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const key of INVOICE_SETTING_KEYS) {
        const { data: existing } = await supabase
          .from("system_settings")
          .select("id")
          .eq("setting_key", key)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("system_settings")
            .update({ setting_value: settings[key] })
            .eq("setting_key", key);
        } else {
          await supabase
            .from("system_settings")
            .insert({
              setting_key: key,
              setting_value: settings[key],
              description: `Invoice setting: ${key}`,
            });
        }
      }
      toast.success(t.saved);
    } catch (err) {
      console.error("Error saving invoice settings:", err);
      toast.error(t.error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(language === "bn" ? "ফাইল সাইজ ২MB এর বেশি হতে পারবে না" : "File size must be less than 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `invoice-logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      setSettings((prev) => ({ ...prev, invoice_company_logo: urlData.publicUrl }));
      toast.success(language === "bn" ? "লোগো আপলোড হয়েছে" : "Logo uploaded");
    } catch (err) {
      console.error("Error uploading logo:", err);
      toast.error(language === "bn" ? "লোগো আপলোড করতে সমস্যা হয়েছে" : "Failed to upload logo");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePreview = () => {
    const sampleOrder: Order = {
      id: 0,
      order_number: "ORD-20250222-0001",
      user_id: 0,
      status: "delivered",
      payment_status: "paid",
      payment_method: "bkash",
      payment_trx_id: "TXN12345678",
      payment_sender_number: "01712345678",
      subtotal: 2500,
      shipping_cost: 100,
      discount_amount: 200,
      total_amount: 2400,
      shipping_name: "মোহাম্মদ আলী",
      shipping_mobile: "01712345678",
      shipping_division: "ঢাকা",
      shipping_district: "গাজীপুর",
      shipping_upazila: "কালীগঞ্জ",
      shipping_address: "বাড়ি ১২, রোড ৫, কালীগঞ্জ বাজার",
      customer_note: null,
      admin_note: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      shipped_at: null,
      delivered_at: null,
      courier_name: "Sundarban Courier",
      tracking_number: "SC-98765",
      tracking_url: null,
      estimated_delivery: new Date(Date.now() + 3 * 86400000).toISOString(),
      items: [
        { id: 0, order_id: 0, product_id: 0, product_name: "মাছের ওষুধ - অক্সিটেট্রাসাইক্লিন", product_image: null, quantity: 2, unit_price: 500, discount_percentage: 10, total_price: 900 },
        { id: 0, order_id: 0, product_id: 0, product_name: "ফিশ ফিড প্রিমিয়াম ৫কেজি", product_image: null, quantity: 3, unit_price: 400, discount_percentage: 0, total_price: 1200 },
        { id: 0, order_id: 0, product_id: 0, product_name: "পানির পিএইচ টেস্টার", product_image: null, quantity: 1, unit_price: 400, discount_percentage: 0, total_price: 400 },
      ],
    };

    generateInvoicePDF(sampleOrder, {
      language,
      copyType: "customer",
      companyName: settings.invoice_company_name,
      companyAddress: settings.invoice_company_address,
      companyPhone: settings.invoice_company_phone,
      companyEmail: settings.invoice_company_email,
      companyWebsite: settings.invoice_company_website,
      companyLogo: settings.invoice_company_logo,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo */}
          <div className="space-y-2">
            <Label>{t.companyLogo}</Label>
            <div className="flex items-center gap-4">
              {settings.invoice_company_logo ? (
                <div className="relative">
                  <img
                    src={settings.invoice_company_logo}
                    alt="Company Logo"
                    className="h-16 w-auto max-w-[200px] rounded border border-border object-contain bg-background p-1"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => setSettings((prev) => ({ ...prev, invoice_company_logo: "" }))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="h-16 w-32 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground text-xs">
                  {language === "bn" ? "লোগো নেই" : "No Logo"}
                </div>
              )}
              <div>
                <Label
                  htmlFor="logo-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {t.uploadLogo}
                </Label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground mt-1">{t.logoHint}</p>
              </div>
            </div>
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company-name">{t.companyName}</Label>
            <Input
              id="company-name"
              value={settings.invoice_company_name}
              onChange={(e) => setSettings((prev) => ({ ...prev, invoice_company_name: e.target.value }))}
              placeholder="FishCare Pro"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="company-address">{t.companyAddress}</Label>
            <Textarea
              id="company-address"
              value={settings.invoice_company_address}
              onChange={(e) => setSettings((prev) => ({ ...prev, invoice_company_address: e.target.value }))}
              placeholder="ঢাকা, বাংলাদেশ"
              rows={2}
            />
          </div>

          {/* Phone & Email */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company-phone">{t.companyPhone}</Label>
              <Input
                id="company-phone"
                value={settings.invoice_company_phone}
                onChange={(e) => setSettings((prev) => ({ ...prev, invoice_company_phone: e.target.value }))}
                placeholder="+880 1XXX-XXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-email">{t.companyEmail}</Label>
              <Input
                id="company-email"
                type="email"
                value={settings.invoice_company_email}
                onChange={(e) => setSettings((prev) => ({ ...prev, invoice_company_email: e.target.value }))}
                placeholder="support@fishcare.com.bd"
              />
            </div>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="company-website">{t.companyWebsite}</Label>
            <Input
              id="company-website"
              value={settings.invoice_company_website}
              onChange={(e) => setSettings((prev) => ({ ...prev, invoice_company_website: e.target.value }))}
              placeholder="www.fishcare.com.bd"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {isSaving ? t.saving : t.save}
            </Button>
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="h-4 w-4 mr-2" />
              {t.preview}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceSettings;
