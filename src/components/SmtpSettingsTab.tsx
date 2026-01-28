import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Save, Loader2, Send, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SmtpSettings {
  id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  smtp_from_email: string;
  smtp_from_name: string;
  smtp_secure: boolean;
  is_enabled: boolean;
}

const SmtpSettingsTab = () => {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [settings, setSettings] = useState<SmtpSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      // Use raw fetch to bypass TypeScript types for new table
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/smtp_settings?limit=1`,
        {
          headers: {
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Authorization": `Bearer ${session?.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch");
      
      const data = await response.json();
      if (data && data.length > 0) {
        setSettings(data[0] as SmtpSettings);
      }
    } catch (error) {
      console.error("Error fetching SMTP settings:", error);
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" ? "SMTP সেটিংস লোড করতে সমস্যা হয়েছে" : "Failed to load SMTP settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key: keyof SmtpSettings, value: string | number | boolean) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/smtp_settings?id=eq.${settings.id}`,
        {
          method: "PATCH",
          headers: {
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Authorization": `Bearer ${session?.session?.access_token}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({
            smtp_host: settings.smtp_host,
            smtp_port: settings.smtp_port,
            smtp_user: settings.smtp_user,
            smtp_password: settings.smtp_password,
            smtp_from_email: settings.smtp_from_email,
            smtp_from_name: settings.smtp_from_name,
            smtp_secure: settings.smtp_secure,
            is_enabled: settings.is_enabled,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to save");

      toast({
        title: language === "bn" ? "সফল" : "Success",
        description: language === "bn" ? "SMTP সেটিংস সেভ হয়েছে" : "SMTP settings saved successfully",
      });
    } catch (error) {
      console.error("Error saving SMTP settings:", error);
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" ? "SMTP সেটিংস সেভ করতে সমস্যা হয়েছে" : "Failed to save SMTP settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" ? "টেস্ট ইমেইল অ্যাড্রেস দিন" : "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-order-email", {
        body: {
          to: testEmail,
          template_type: "order_confirmation",
          order_number: "TEST-001",
          customer_name: "Test Customer",
          order_items: [
            { name: "Test Product", quantity: 1, price: 100 },
          ],
          total_amount: 100,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: language === "bn" ? "সফল" : "Success",
          description: language === "bn" ? "টেস্ট ইমেইল পাঠানো হয়েছে" : "Test email sent successfully",
        });
      } else {
        throw new Error(data?.message || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" ? "টেস্ট ইমেইল পাঠাতে সমস্যা হয়েছে" : "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">
            {language === "bn" ? "SMTP সেটিংস পাওয়া যায়নি" : "SMTP settings not found"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable Card */}
      <Card className={`border-2 ${settings.is_enabled ? "border-primary/50" : "border-muted"}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {language === "bn" ? "ইমেইল নোটিফিকেশন" : "Email Notifications"}
            {settings.is_enabled ? (
              <CheckCircle className="h-5 w-5 text-primary ml-auto" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground ml-auto" />
            )}
          </CardTitle>
          <CardDescription>
            {language === "bn"
              ? "অর্ডার স্ট্যাটাস আপডেট এবং শিপমেন্ট নোটিফিকেশন ইমেইলে পাঠান"
              : "Send order status updates and shipping notifications via email"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email_enabled" className="text-base font-semibold">
                {language === "bn" ? "ইমেইল নোটিফিকেশন সক্রিয়" : "Enable Email Notifications"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {language === "bn" 
                  ? "এটি চালু করলে কাস্টমার অটোমেটিক ইমেইল পাবে" 
                  : "When enabled, customers will receive automatic emails"
                }
              </p>
            </div>
            <Switch
              id="email_enabled"
              checked={settings.is_enabled}
              onCheckedChange={(checked) => handleSettingChange("is_enabled", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* SMTP Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-secondary" />
            {language === "bn" ? "SMTP সার্ভার সেটিংস" : "SMTP Server Settings"}
          </CardTitle>
          <CardDescription>
            {language === "bn"
              ? "আপনার ইমেইল সার্ভারের SMTP কনফিগারেশন দিন। Gmail, Outlook, বা যেকোনো SMTP সার্ভার ব্যবহার করতে পারেন।"
              : "Configure your email server SMTP settings. You can use Gmail, Outlook, or any SMTP server."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{language === "bn" ? "SMTP হোস্ট" : "SMTP Host"}</Label>
              <Input
                value={settings.smtp_host}
                onChange={(e) => handleSettingChange("smtp_host", e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "bn" ? "SMTP পোর্ট" : "SMTP Port"}</Label>
              <Select
                value={settings.smtp_port.toString()}
                onValueChange={(v) => handleSettingChange("smtp_port", parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 (Non-secure)</SelectItem>
                  <SelectItem value="465">465 (SSL)</SelectItem>
                  <SelectItem value="587">587 (TLS)</SelectItem>
                  <SelectItem value="2525">2525 (Alternative)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{language === "bn" ? "ইউজারনেম / ইমেইল" : "Username / Email"}</Label>
              <Input
                value={settings.smtp_user}
                onChange={(e) => handleSettingChange("smtp_user", e.target.value)}
                placeholder="your-email@gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "bn" ? "পাসওয়ার্ড / অ্যাপ পাসওয়ার্ড" : "Password / App Password"}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={settings.smtp_password}
                  onChange={(e) => handleSettingChange("smtp_password", e.target.value)}
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{language === "bn" ? "প্রেরকের ইমেইল" : "From Email"}</Label>
              <Input
                type="email"
                value={settings.smtp_from_email}
                onChange={(e) => handleSettingChange("smtp_from_email", e.target.value)}
                placeholder="noreply@fishcare.com.bd"
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "bn" ? "প্রেরকের নাম" : "From Name"}</Label>
              <Input
                value={settings.smtp_from_name}
                onChange={(e) => handleSettingChange("smtp_from_name", e.target.value)}
                placeholder="FishCare BD"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="smtp_secure" className="font-semibold">
                {language === "bn" ? "সিকিউর কানেকশন (TLS/SSL)" : "Secure Connection (TLS/SSL)"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {language === "bn" ? "এনক্রিপ্টেড কানেকশন ব্যবহার করুন" : "Use encrypted connection"}
              </p>
            </div>
            <Switch
              id="smtp_secure"
              checked={settings.smtp_secure}
              onCheckedChange={(checked) => handleSettingChange("smtp_secure", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Test Email Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-accent" />
            {language === "bn" ? "টেস্ট ইমেইল পাঠান" : "Send Test Email"}
          </CardTitle>
          <CardDescription>
            {language === "bn"
              ? "SMTP সেটিংস সঠিক কিনা পরীক্ষা করতে একটি টেস্ট ইমেইল পাঠান"
              : "Send a test email to verify your SMTP settings are correct"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder={language === "bn" ? "টেস্ট ইমেইল অ্যাড্রেস" : "Test email address"}
              className="flex-1"
            />
            <Button
              onClick={sendTestEmail}
              disabled={isTesting || !settings.is_enabled}
              variant="outline"
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {language === "bn" ? "টেস্ট পাঠান" : "Send Test"}
            </Button>
          </div>
          {!settings.is_enabled && (
            <p className="text-sm text-destructive mt-2">
              {language === "bn" 
                ? "⚠️ প্রথমে ইমেইল নোটিফিকেশন সক্রিয় করুন" 
                : "⚠️ Enable email notifications first"
              }
            </p>
          )}
        </CardContent>
      </Card>

      {/* Provider Tips */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">
            {language === "bn" ? "💡 সাধারণ SMTP সার্ভার সেটিংস" : "💡 Common SMTP Server Settings"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div className="p-3 bg-background rounded-lg">
              <p className="font-semibold text-primary">Gmail</p>
              <p className="text-muted-foreground">Host: smtp.gmail.com</p>
              <p className="text-muted-foreground">Port: 587 (TLS)</p>
              <p className="text-xs text-destructive mt-1">App Password প্রয়োজন</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="font-semibold text-secondary">Outlook/Office 365</p>
              <p className="text-muted-foreground">Host: smtp.office365.com</p>
              <p className="text-muted-foreground">Port: 587 (TLS)</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="font-semibold text-accent">Hostinger</p>
              <p className="text-muted-foreground">Host: smtp.hostinger.com</p>
              <p className="text-muted-foreground">Port: 465 (SSL)</p>
            </div>
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
          {language === "bn" ? "সেটিংস সেভ করুন" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
};

export default SmtpSettingsTab;
