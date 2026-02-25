import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Printer, Save, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface POSPrintConfig {
  pos_print_enabled: string;
  pos_print_paper_size: string;
  pos_print_shop_name: string;
  pos_print_shop_address: string;
  pos_print_shop_phone: string;
  pos_print_shop_email: string;
  pos_print_shop_logo: string;
  pos_print_header_text: string;
  pos_print_footer_text: string;
  pos_print_show_logo: string;
  pos_print_show_shop_info: string;
  pos_print_show_customer_info: string;
  pos_print_show_item_discount: string;
  pos_print_show_barcode: string;
  pos_print_auto_print: string;
  pos_print_copies: string;
  pos_print_font_size: string;
}

const defaults: POSPrintConfig = {
  pos_print_enabled: "true",
  pos_print_paper_size: "58mm",
  pos_print_shop_name: "",
  pos_print_shop_address: "",
  pos_print_shop_phone: "",
  pos_print_shop_email: "",
  pos_print_shop_logo: "",
  pos_print_header_text: "",
  pos_print_footer_text: "ধন্যবাদ! আবার আসবেন।",
  pos_print_show_logo: "true",
  pos_print_show_shop_info: "true",
  pos_print_show_customer_info: "true",
  pos_print_show_item_discount: "true",
  pos_print_show_barcode: "false",
  pos_print_auto_print: "false",
  pos_print_copies: "1",
  pos_print_font_size: "12",
};

export default function POSPrintSettings() {
  const { toast } = useToast();
  const [config, setConfig] = useState<POSPrintConfig>(defaults);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .like("setting_key", "pos_print_%");

      if (data && data.length > 0) {
        const updated = { ...defaults };
        data.forEach((s) => {
          const key = s.setting_key as keyof POSPrintConfig;
          if (key in updated && s.setting_value) {
            updated[key] = s.setting_value;
          }
        });
        setConfig(updated);
      }
    } catch (err) {
      console.error("Error fetching POS print settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key: keyof POSPrintConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      for (const [key, value] of Object.entries(config)) {
        const { data: existing } = await supabase
          .from("system_settings")
          .select("id")
          .eq("setting_key", key)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("system_settings")
            .update({ setting_value: value })
            .eq("setting_key", key);
        } else {
          await supabase
            .from("system_settings")
            .insert({ setting_key: key, setting_value: value, description: `POS Print: ${key}` });
        }
      }

      toast({ title: "সফল!", description: "POS প্রিন্ট সেটিংস সেভ হয়েছে।" });
    } catch (err) {
      console.error("Error saving POS print settings:", err);
      toast({ title: "ত্রুটি!", description: "সেটিংস সেভ করতে ব্যর্থ হয়েছে।", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Shop Info */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            দোকানের তথ্য (রিসিপ্ট হেডার)
          </CardTitle>
          <CardDescription>
            POS রিসিপ্টে প্রদর্শিত দোকানের তথ্য কনফিগার করুন
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>দোকানের নাম</Label>
              <Input
                value={config.pos_print_shop_name}
                onChange={(e) => handleChange("pos_print_shop_name", e.target.value)}
                placeholder="আপনার দোকানের নাম"
              />
            </div>
            <div className="space-y-2">
              <Label>ফোন নম্বর</Label>
              <Input
                value={config.pos_print_shop_phone}
                onChange={(e) => handleChange("pos_print_shop_phone", e.target.value)}
                placeholder="01XXX-XXXXXX"
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ইমেইল</Label>
              <Input
                value={config.pos_print_shop_email}
                onChange={(e) => handleChange("pos_print_shop_email", e.target.value)}
                placeholder="shop@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>লোগো URL</Label>
              <Input
                value={config.pos_print_shop_logo}
                onChange={(e) => handleChange("pos_print_shop_logo", e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>ঠিকানা</Label>
            <Textarea
              value={config.pos_print_shop_address}
              onChange={(e) => handleChange("pos_print_shop_address", e.target.value)}
              placeholder="দোকানের ঠিকানা"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Print Layout */}
      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-accent" />
            প্রিন্ট লেআউট সেটিংস
          </CardTitle>
          <CardDescription>
            রিসিপ্টের কাগজের আকার, ফন্ট সাইজ এবং অন্যান্য লেআউট সেটিংস
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>কাগজের আকার</Label>
              <Select
                value={config.pos_print_paper_size}
                onValueChange={(v) => handleChange("pos_print_paper_size", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58mm">58mm (2 ইঞ্চি)</SelectItem>
                  <SelectItem value="80mm">80mm (3 ইঞ্চি)</SelectItem>
                  <SelectItem value="A4">A4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ফন্ট সাইজ (px)</Label>
              <Input
                type="number"
                value={config.pos_print_font_size}
                onChange={(e) => handleChange("pos_print_font_size", e.target.value)}
                min="8"
                max="20"
              />
            </div>
            <div className="space-y-2">
              <Label>কপি সংখ্যা</Label>
              <Input
                type="number"
                value={config.pos_print_copies}
                onChange={(e) => handleChange("pos_print_copies", e.target.value)}
                min="1"
                max="5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header/Footer */}
      <Card className="border-secondary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-secondary" />
            হেডার ও ফুটার টেক্সট
          </CardTitle>
          <CardDescription>
            রিসিপ্টের উপরে ও নিচে কাস্টম মেসেজ যোগ করুন
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>হেডার টেক্সট (ঐচ্ছিক)</Label>
            <Input
              value={config.pos_print_header_text}
              onChange={(e) => handleChange("pos_print_header_text", e.target.value)}
              placeholder="যেমন: স্বাগতম! আমাদের দোকানে"
            />
          </div>
          <div className="space-y-2">
            <Label>ফুটার টেক্সট</Label>
            <Input
              value={config.pos_print_footer_text}
              onChange={(e) => handleChange("pos_print_footer_text", e.target.value)}
              placeholder="ধন্যবাদ! আবার আসবেন।"
            />
          </div>
        </CardContent>
      </Card>

      {/* Visibility Toggles */}
      <Card className="border-muted-foreground/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-muted-foreground" />
            রিসিপ্টে কী কী দেখাবে
          </CardTitle>
          <CardDescription>
            রিসিপ্টে কোন কোন তথ্য প্রদর্শন করতে চান তা নির্বাচন করুন
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="show_logo">লোগো দেখান</Label>
            <Switch
              id="show_logo"
              checked={config.pos_print_show_logo === "true"}
              onCheckedChange={(c) => handleChange("pos_print_show_logo", c.toString())}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="show_shop_info">দোকানের তথ্য দেখান</Label>
            <Switch
              id="show_shop_info"
              checked={config.pos_print_show_shop_info === "true"}
              onCheckedChange={(c) => handleChange("pos_print_show_shop_info", c.toString())}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="show_customer">কাস্টমারের তথ্য দেখান</Label>
            <Switch
              id="show_customer"
              checked={config.pos_print_show_customer_info === "true"}
              onCheckedChange={(c) => handleChange("pos_print_show_customer_info", c.toString())}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="show_discount">আইটেম ডিসকাউন্ট দেখান</Label>
            <Switch
              id="show_discount"
              checked={config.pos_print_show_item_discount === "true"}
              onCheckedChange={(c) => handleChange("pos_print_show_item_discount", c.toString())}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="show_barcode">বারকোড দেখান</Label>
            <Switch
              id="show_barcode"
              checked={config.pos_print_show_barcode === "true"}
              onCheckedChange={(c) => handleChange("pos_print_show_barcode", c.toString())}
            />
          </div>
        </CardContent>
      </Card>

      {/* Auto Print */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            অটো প্রিন্ট
          </CardTitle>
          <CardDescription>
            বিক্রি সম্পন্ন হওয়ার পর স্বয়ংক্রিয়ভাবে রিসিপ্ট প্রিন্ট হবে কিনা
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="auto_print">অটো প্রিন্ট সক্রিয়</Label>
            <Switch
              id="auto_print"
              checked={config.pos_print_auto_print === "true"}
              onCheckedChange={(c) => handleChange("pos_print_auto_print", c.toString())}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={isSaving} size="lg">
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          সেটিংস সেভ করুন
        </Button>
      </div>
    </div>
  );
}
