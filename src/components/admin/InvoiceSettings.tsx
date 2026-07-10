/**
 * Invoice Settings Component - Full Template & Print Settings Manager
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { appStorage } from "@/lib/appStorage";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { FileText, Save, Loader2, Upload, X, Eye, Palette, Settings2, Layout, Languages, Image } from "lucide-react";
import { generateInvoicePDF } from "@/lib/generateInvoicePDF";
import type { Order } from "@/lib/api-client";

// All settings keys
const ALL_SETTING_KEYS = [
  "invoice_company_name", "invoice_company_address", "invoice_company_phone",
  "invoice_company_email", "invoice_company_website", "invoice_company_logo",
  "invoice_template", "invoice_language_mode", "invoice_paper_size",
  "invoice_logo_position", "invoice_show_qr", "invoice_show_payment_method",
  "invoice_show_product_image", "invoice_show_tax", "invoice_footer_text",
  "invoice_footer_text_bn", "invoice_primary_color", "invoice_social_facebook",
  "invoice_social_youtube",
] as const;

type SettingKey = typeof ALL_SETTING_KEYS[number];

const defaultSettings: Record<SettingKey, string> = {
  invoice_company_name: "FishCare Pro",
  invoice_company_address: "ঢাকা, বাংলাদেশ",
  invoice_company_phone: "+880 1XXX-XXXXXX",
  invoice_company_email: "support@fishcare.com.bd",
  invoice_company_website: "www.fishcare.com.bd",
  invoice_company_logo: "",
  invoice_template: "premium",
  invoice_language_mode: "bn",
  invoice_paper_size: "a4",
  invoice_logo_position: "left",
  invoice_show_qr: "false",
  invoice_show_payment_method: "true",
  invoice_show_product_image: "false",
  invoice_show_tax: "false",
  invoice_footer_text: "",
  invoice_footer_text_bn: "",
  invoice_primary_color: "#167850",
  invoice_social_facebook: "",
  invoice_social_youtube: "",
};

const InvoiceSettings = () => {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState<Record<SettingKey, string>>({ ...defaultSettings });

  const isBn = language === "bn";

  const tt = (bn: string, en: string) => isBn ? bn : en;

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .in("setting_key", [...ALL_SETTING_KEYS]);
      if (error) throw error;
      if (data && data.length > 0) {
        const ns = { ...defaultSettings };
        data.forEach((s) => { if (s.setting_value) ns[s.setting_key as SettingKey] = s.setting_value; });
        setSettings(ns);
      }
    } catch (err) {
      console.error("Error fetching:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const key of ALL_SETTING_KEYS) {
        const { data: existing } = await supabase.from("system_settings").select("id").eq("setting_key", key).maybeSingle();
        if (existing) {
          await supabase.from("system_settings").update({ setting_value: settings[key] }).eq("setting_key", key);
        } else {
          await supabase.from("system_settings").insert({ setting_key: key, setting_value: settings[key], description: `Invoice: ${key}` });
        }
      }
      toast.success(tt("সেটিংস সেভ হয়েছে", "Settings saved"));
    } catch (err) {
      console.error("Error saving:", err);
      toast.error(tt("সেভ করতে সমস্যা", "Failed to save"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(tt("ফাইল সাইজ ২MB এর বেশি", "File size must be less than 2MB"));
      return;
    }
    setIsUploading(true);
    try {
      const fileName = `invoice-logo-${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await appStorage.from("product-images").upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data } = appStorage.from("product-images").getPublicUrl(fileName);
      setSettings((p) => ({ ...p, invoice_company_logo: data.publicUrl }));
      toast.success(tt("লোগো আপলোড হয়েছে", "Logo uploaded"));
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(tt("আপলোড ব্যর্থ", "Upload failed"));
    } finally {
      setIsUploading(false);
    }
  };

  const handlePreview = (template?: string, langMode?: string) => {
    const sampleOrder: Order = {
      id: 0, order_number: "ORD-20250222-0001", user_id: 0,
      status: "delivered", payment_status: "paid", payment_method: "bkash",
      payment_trx_id: "TXN12345678", subtotal: 2500, shipping_cost: 100,
      discount_amount: 200, total_amount: 2400,
      shipping_name: "মোহাম্মদ আলী / Mohammad Ali", shipping_mobile: "01712345678",
      shipping_division: "ঢাকা", shipping_district: "গাজীপুর", shipping_upazila: "কালীগঞ্জ",
      shipping_address: "বাড়ি ১২, রোড ৫, কালীগঞ্জ বাজার",
      customer_note: null, admin_note: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      shipped_at: null, delivered_at: null,
      courier_name: "Sundarban Courier", tracking_number: "SC-98765",
      tracking_url: null, estimated_delivery: new Date(Date.now() + 3 * 86400000).toISOString(),
      items: [
        { id: 0, order_id: 0, product_id: 0, product_name: "মাছের ওষুধ - অক্সিটেট্রাসাইক্লিন", product_image: null, quantity: 2, unit_price: 500, discount_percentage: 10, total_price: 900 },
        { id: 0, order_id: 0, product_id: 0, product_name: "ফিশ ফিড প্রিমিয়াম ৫কেজি", product_image: null, quantity: 3, unit_price: 400, discount_percentage: 0, total_price: 1200 },
        { id: 0, order_id: 0, product_id: 0, product_name: "পানির পিএইচ টেস্টার", product_image: null, quantity: 1, unit_price: 400, discount_percentage: 0, total_price: 400 },
      ],
    };

    generateInvoicePDF(sampleOrder, {
      language: (langMode || settings.invoice_language_mode) as "bn" | "en",
      copyType: "customer",
      printSettings: {
        template: (template || settings.invoice_template) as any,
        languageMode: (langMode || settings.invoice_language_mode) as any,
        paperSize: settings.invoice_paper_size as any,
        logoPosition: settings.invoice_logo_position as any,
        showQr: settings.invoice_show_qr === "true",
        showPaymentMethod: settings.invoice_show_payment_method === "true",
        showProductImage: settings.invoice_show_product_image === "true",
        showTax: settings.invoice_show_tax === "true",
        footerText: settings.invoice_footer_text,
        footerTextBn: settings.invoice_footer_text_bn,
        primaryColor: settings.invoice_primary_color,
        socialFacebook: settings.invoice_social_facebook,
        socialYoutube: settings.invoice_social_youtube,
        companyName: settings.invoice_company_name,
        companyAddress: settings.invoice_company_address,
        companyPhone: settings.invoice_company_phone,
        companyEmail: settings.invoice_company_email,
        companyWebsite: settings.invoice_company_website,
        companyLogo: settings.invoice_company_logo,
      },
    });
  };

  const updateSetting = (key: SettingKey, value: string) => setSettings((p) => ({ ...p, [key]: value }));

  if (isLoading) {
    return (
      <Card><CardContent className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent></Card>
    );
  }

  const templates = [
    { id: "premium", name: tt("প্রিমিয়াম", "Premium"), desc: tt("আকর্ষণীয় ডায়াগোনাল হেডার ও স্বাক্ষর সহ", "Stunning diagonal header with signature") },
    { id: "minimal", name: tt("মিনিমাল", "Minimal"), desc: tt("সাদামাটা ও পরিচ্ছন্ন ডিজাইন", "Clean and simple design") },
    { id: "modern", name: tt("মডার্ন বিজনেস", "Modern Business"), desc: tt("রঙিন ও প্রফেশনাল ডিজাইন", "Colorful professional layout") },
    { id: "pos", name: tt("POS রিসিট", "POS Receipt"), desc: tt("৮০mm থার্মাল প্রিন্টার", "80mm thermal printer layout") },
    { id: "detailed", name: tt("ডিটেইলড", "Detailed"), desc: tt("সম্পূর্ণ বিস্তারিত ইনভয়েস", "Full detailed invoice") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {tt("ইনভয়েস প্রিন্ট সেটিংস", "Invoice Print Settings")}
        </h2>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {isSaving ? tt("সেভ হচ্ছে...", "Saving...") : tt("সেভ করুন", "Save")}
        </Button>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="templates" className="flex items-center gap-1.5">
            <Layout className="h-3.5 w-3.5" />{tt("টেমপ্লেট", "Templates")}
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-1.5">
            <Settings2 className="h-3.5 w-3.5" />{tt("কোম্পানি তথ্য", "Company Info")}
          </TabsTrigger>
          <TabsTrigger value="print" className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />{tt("প্রিন্ট অপশন", "Print Options")}
          </TabsTrigger>
          <TabsTrigger value="customize" className="flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5" />{tt("কাস্টমাইজ", "Customize")}
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{tt("ইনভয়েস টেমপ্লেট নির্বাচন", "Select Invoice Template")}</CardTitle>
              <CardDescription>{tt("আপনার পছন্দের ইনভয়েস ডিজাইন নির্বাচন করুন", "Choose your preferred invoice design")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => updateSetting("invoice_template", tpl.id)}
                    className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                      settings.invoice_template === tpl.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{tpl.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{tpl.desc}</p>
                      </div>
                      <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                        settings.invoice_template === tpl.id ? "border-primary" : "border-muted-foreground/40"
                      }`}>
                        {settings.invoice_template === tpl.id && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                    </div>
                    <Button
                      variant="ghost" size="sm" className="mt-3 text-xs"
                      onClick={(e) => { e.stopPropagation(); handlePreview(tpl.id); }}
                    >
                      <Eye className="h-3 w-3 mr-1" />{tt("প্রিভিউ", "Preview")}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Info Tab */}
        <TabsContent value="company" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{tt("কোম্পানি তথ্য", "Company Information")}</CardTitle>
              <CardDescription>{tt("ইনভয়েসে প্রদর্শিত তথ্য", "Information displayed on invoices")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo */}
              <div className="space-y-2">
                <Label>{tt("কোম্পানি লোগো", "Company Logo")}</Label>
                <div className="flex items-center gap-4">
                  {settings.invoice_company_logo ? (
                    <div className="relative">
                      <img src={settings.invoice_company_logo} alt="Logo" className="h-16 w-auto max-w-[200px] rounded border border-border object-contain bg-background p-1" />
                      <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => updateSetting("invoice_company_logo", "")}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-16 w-32 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground text-xs">
                      <Image className="h-5 w-5 mr-1 opacity-50" />{tt("লোগো নেই", "No Logo")}
                    </div>
                  )}
                  <div>
                    <Label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition">
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {tt("আপলোড", "Upload")}
                    </Label>
                    <input id="logo-upload" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoUpload} disabled={isUploading} />
                    <p className="text-xs text-muted-foreground mt-1">{tt("PNG/JPG, সর্বোচ্চ ২MB", "PNG/JPG, max 2MB")}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{tt("কোম্পানির নাম", "Company Name")}</Label>
                <Input value={settings.invoice_company_name} onChange={(e) => updateSetting("invoice_company_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{tt("ঠিকানা", "Address")}</Label>
                <Textarea value={settings.invoice_company_address} onChange={(e) => updateSetting("invoice_company_address", e.target.value)} rows={2} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{tt("ফোন", "Phone")}</Label>
                  <Input value={settings.invoice_company_phone} onChange={(e) => updateSetting("invoice_company_phone", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{tt("ইমেইল", "Email")}</Label>
                  <Input type="email" value={settings.invoice_company_email} onChange={(e) => updateSetting("invoice_company_email", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{tt("ওয়েবসাইট", "Website")}</Label>
                <Input value={settings.invoice_company_website} onChange={(e) => updateSetting("invoice_company_website", e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Print Options Tab */}
        <TabsContent value="print" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-primary" />
                {tt("প্রিন্ট সেটিংস", "Print Settings")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language Mode */}
              <div className="space-y-2">
                <Label>{tt("ভাষা মোড", "Language Mode")}</Label>
                <Select value={settings.invoice_language_mode} onValueChange={(v) => updateSetting("invoice_language_mode", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bn">{tt("বাংলা", "Bengali")}</SelectItem>
                    <SelectItem value="en">{tt("ইংরেজি", "English")}</SelectItem>
                    <SelectItem value="dual">{tt("বাংলা + ইংরেজি", "Bengali + English")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Paper Size */}
              <div className="space-y-2">
                <Label>{tt("কাগজের সাইজ", "Paper Size")}</Label>
                <Select value={settings.invoice_paper_size} onValueChange={(v) => updateSetting("invoice_paper_size", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a4">A4</SelectItem>
                    <SelectItem value="pos80">{tt("POS রিসিট (৮০mm)", "POS Receipt (80mm)")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Logo Position */}
              <div className="space-y-2">
                <Label>{tt("লোগোর অবস্থান", "Logo Position")}</Label>
                <Select value={settings.invoice_logo_position} onValueChange={(v) => updateSetting("invoice_logo_position", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">{tt("বাম", "Left")}</SelectItem>
                    <SelectItem value="center">{tt("মাঝখানে", "Center")}</SelectItem>
                    <SelectItem value="right">{tt("ডান", "Right")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Toggle options */}
              <div className="space-y-4 border-t border-border pt-4">
                {[
                  { key: "invoice_show_payment_method" as SettingKey, label: tt("পেমেন্ট মেথড দেখান", "Show Payment Method") },
                  { key: "invoice_show_product_image" as SettingKey, label: tt("পণ্যের ছবি দেখান", "Show Product Image") },
                  { key: "invoice_show_tax" as SettingKey, label: tt("ট্যাক্স / ভ্যাট দেখান", "Show Tax / VAT") },
                  { key: "invoice_show_qr" as SettingKey, label: tt("QR কোড দেখান", "Show QR Code") },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-sm">{label}</Label>
                    <Switch checked={settings[key] === "true"} onCheckedChange={(c) => updateSetting(key, c ? "true" : "false")} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customize Tab */}
        <TabsContent value="customize" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{tt("কাস্টমাইজেশন", "Customization")}</CardTitle>
              <CardDescription>{tt("ইনভয়েসের রঙ, ফুটার ও সোশ্যাল লিংক", "Colors, footer text & social links")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary Color */}
              <div className="space-y-2">
                <Label>{tt("প্রাইমারি রঙ", "Primary Color")}</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color" value={settings.invoice_primary_color}
                    onChange={(e) => updateSetting("invoice_primary_color", e.target.value)}
                    className="h-10 w-14 rounded border border-border cursor-pointer"
                  />
                  <Input value={settings.invoice_primary_color} onChange={(e) => updateSetting("invoice_primary_color", e.target.value)} className="w-32" placeholder="#167850" />
                </div>
              </div>

              {/* Footer Text */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{tt("ফুটার টেক্সট (ইংরেজি)", "Footer Text (English)")}</Label>
                  <Textarea value={settings.invoice_footer_text} onChange={(e) => updateSetting("invoice_footer_text", e.target.value)} rows={2} placeholder="Thank you for shopping with us!" />
                </div>
                <div className="space-y-2">
                  <Label>{tt("ফুটার টেক্সট (বাংলা)", "Footer Text (Bengali)")}</Label>
                  <Textarea value={settings.invoice_footer_text_bn} onChange={(e) => updateSetting("invoice_footer_text_bn", e.target.value)} rows={2} placeholder="আমাদের সাথে কেনাকাটার জন্য ধন্যবাদ!" />
                </div>
              </div>

              {/* Social Links */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Facebook</Label>
                  <Input value={settings.invoice_social_facebook} onChange={(e) => updateSetting("invoice_social_facebook", e.target.value)} placeholder="facebook.com/yourpage" />
                </div>
                <div className="space-y-2">
                  <Label>YouTube</Label>
                  <Input value={settings.invoice_social_youtube} onChange={(e) => updateSetting("invoice_social_youtube", e.target.value)} placeholder="youtube.com/@yourchannel" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>{tt("প্রিভিউ ও ডাউনলোড", "Preview & Download")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => handlePreview()}>
              <Eye className="h-4 w-4 mr-2" />{tt("প্রিভিউ (বর্তমান সেটিং)", "Preview (Current Settings)")}
            </Button>
            <Button variant="outline" onClick={() => handlePreview(undefined, "bn")}>
              <FileText className="h-4 w-4 mr-2" />{tt("বাংলা কপি", "Bengali Copy")}
            </Button>
            <Button variant="outline" onClick={() => handlePreview(undefined, "en")}>
              <FileText className="h-4 w-4 mr-2" />{tt("ইংরেজি কপি", "English Copy")}
            </Button>
            <Button variant="outline" onClick={() => handlePreview(undefined, "dual")}>
              <Languages className="h-4 w-4 mr-2" />{tt("ডুয়াল কপি", "Dual Copy")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceSettings;
