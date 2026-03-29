import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Loader2, Save, MessageCircle, Phone, Wifi, WifiOff, Send, Settings2, ScrollText,
} from "lucide-react";

interface WhatsAppSettingsData {
  id?: string;
  is_enabled: boolean;
  access_token: string;
  phone_number_id: string;
  business_account_id: string;
  api_version: string;
  order_confirmation_enabled: boolean;
  shipping_notification_enabled: boolean;
  delivery_update_enabled: boolean;
  order_confirmation_template: string;
  shipping_template: string;
  delivery_template: string;
  template_language: string;
}

interface WhatsAppLog {
  id: string;
  order_number: string | null;
  recipient_phone: string;
  message_type: string;
  template_name: string | null;
  whatsapp_message_id: string | null;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

const defaultSettings: WhatsAppSettingsData = {
  is_enabled: false,
  access_token: "",
  phone_number_id: "",
  business_account_id: "",
  api_version: "v21.0",
  order_confirmation_enabled: true,
  shipping_notification_enabled: true,
  delivery_update_enabled: true,
  order_confirmation_template: "order_confirmation",
  shipping_template: "shipping_notification",
  delivery_template: "delivery_update",
  template_language: "bn",
};

export const WhatsAppSettings = () => {
  const [settings, setSettings] = useState<WhatsAppSettingsData>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "disconnected">("unknown");
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("whatsapp_settings" as any)
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings(data as any);
      }
    } catch (error) {
      console.error("Error fetching WhatsApp settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from("whatsapp_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setLogs((data || []) as any);
    } catch (error) {
      console.error("Error fetching WhatsApp logs:", error);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { id, ...settingsData } = settings;

      if (id) {
        const { error } = await supabase
          .from("whatsapp_settings" as any)
          .update(settingsData as any)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("whatsapp_settings" as any)
          .insert(settingsData as any)
          .select()
          .single();
        if (error) throw error;
        if (data) setSettings(data as any);
      }

      toast.success("WhatsApp সেটিংস সংরক্ষণ হয়েছে!");
    } catch (error) {
      console.error("Error saving WhatsApp settings:", error);
      toast.error("সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে");
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setConnectionStatus("unknown");
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: { action: "test_connection" },
      });

      if (error) throw error;

      if (data?.success) {
        setConnectionStatus("connected");
        setConnectionInfo(data.data);
        toast.success("WhatsApp API সংযোগ সফল!");
      } else {
        setConnectionStatus("disconnected");
        toast.error(data?.error || data?.message || "সংযোগ ব্যর্থ");
      }
    } catch (error) {
      setConnectionStatus("disconnected");
      toast.error("সংযোগ পরীক্ষা করতে সমস্যা হয়েছে");
    } finally {
      setIsTesting(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testPhone) return;
    setIsSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: {
          action: "send_text",
          phone: testPhone,
          text_message: `✅ FishCare BD WhatsApp টেস্ট মেসেজ সফলভাবে পাঠানো হয়েছে! (${new Date().toLocaleString("bn-BD")})`,
          message_type: "test",
        },
      });

      if (error) throw error;
      if (data?.success) {
        toast.success("টেস্ট মেসেজ পাঠানো হয়েছে!");
        fetchLogs();
      } else {
        toast.error(data?.error || "মেসেজ পাঠাতে ব্যর্থ");
      }
    } catch (error) {
      toast.error("মেসেজ পাঠাতে সমস্যা হয়েছে");
    } finally {
      setIsSendingTest(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            WhatsApp Business API সেটিংস
          </CardTitle>
          <CardDescription>
            Meta WhatsApp Business API কনফিগারেশন — গ্রাহকদের WhatsApp-এ স্বয়ংক্রিয় নোটিফিকেশন পাঠাতে
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>WhatsApp নোটিফিকেশন সক্রিয় করুন</Label>
              <p className="text-xs text-muted-foreground">
                সক্রিয় করলে ডেলিভারি আপডেটে গ্রাহকদের WhatsApp মেসেজ পাঠানো হবে
              </p>
            </div>
            <Switch
              checked={settings.is_enabled}
              onCheckedChange={(v) => setSettings((s) => ({ ...s, is_enabled: v }))}
            />
          </div>

          <Separator />

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Access Token</Label>
              <Input
                type="password"
                value={settings.access_token}
                onChange={(e) => setSettings((s) => ({ ...s, access_token: e.target.value }))}
                placeholder="আপনার Permanent Access Token দিন"
              />
            </div>
            <div className="grid gap-2">
              <Label>Phone Number ID</Label>
              <Input
                value={settings.phone_number_id}
                onChange={(e) => setSettings((s) => ({ ...s, phone_number_id: e.target.value }))}
                placeholder="WhatsApp Phone Number ID"
              />
            </div>
            <div className="grid gap-2">
              <Label>Business Account ID (ঐচ্ছিক)</Label>
              <Input
                value={settings.business_account_id}
                onChange={(e) => setSettings((s) => ({ ...s, business_account_id: e.target.value }))}
                placeholder="WhatsApp Business Account ID"
              />
            </div>
            <div className="grid gap-2">
              <Label>API Version</Label>
              <Select
                value={settings.api_version}
                onValueChange={(v) => setSettings((s) => ({ ...s, api_version: v }))}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="v21.0">v21.0</SelectItem>
                  <SelectItem value="v20.0">v20.0</SelectItem>
                  <SelectItem value="v19.0">v19.0</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
            <h4 className="font-medium text-sm">📌 কিভাবে API credentials পাবেন?</h4>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>
                <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  developers.facebook.com
                </a>{" "}
                এ যান → My Apps → App তৈরি করুন (Business টাইপ)
              </li>
              <li>WhatsApp প্রোডাক্ট যুক্ত করুন</li>
              <li>API Setup থেকে Phone Number ID কপি করুন</li>
              <li>System Users থেকে Permanent Access Token তৈরি করুন</li>
            </ol>
          </div>

          <Separator />

          {/* Connection Test */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              {connectionStatus === "connected" ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : connectionStatus === "disconnected" ? (
                <WifiOff className="h-5 w-5 text-destructive" />
              ) : (
                <Phone className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium text-sm">সংযোগ পরীক্ষা</p>
                {connectionInfo && (
                  <p className="text-xs text-muted-foreground">
                    {connectionInfo.verified_name} • {connectionInfo.phone_number}
                  </p>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={testConnection} disabled={isTesting || !settings.is_enabled}>
              {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : "টেস্ট"}
            </Button>
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            সংরক্ষণ করুন
          </Button>
        </CardContent>
      </Card>

      {/* Notification Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            নোটিফিকেশন সেটিংস
          </CardTitle>
          <CardDescription>
            কোন কোন ইভেন্টে WhatsApp নোটিফিকেশন পাঠাবে তা কনফিগার করুন
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">অর্ডার নিশ্চিতকরণ</p>
                <p className="text-xs text-muted-foreground">নতুন অর্ডার হলে গ্রাহককে জানানো হবে</p>
              </div>
              <Switch
                checked={settings.order_confirmation_enabled}
                onCheckedChange={(v) => setSettings((s) => ({ ...s, order_confirmation_enabled: v }))}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">শিপিং নোটিফিকেশন</p>
                <p className="text-xs text-muted-foreground">অর্ডার শিপ হলে ট্র্যাকিং তথ্য পাঠানো হবে</p>
              </div>
              <Switch
                checked={settings.shipping_notification_enabled}
                onCheckedChange={(v) => setSettings((s) => ({ ...s, shipping_notification_enabled: v }))}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">ডেলিভারি আপডেট</p>
                <p className="text-xs text-muted-foreground">ডেলিভারি, বাতিল, বা হোল্ড হলে জানানো হবে</p>
              </div>
              <Switch
                checked={settings.delivery_update_enabled}
                onCheckedChange={(v) => setSettings((s) => ({ ...s, delivery_update_enabled: v }))}
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>টেমপ্লেট ভাষা</Label>
              <Select
                value={settings.template_language}
                onValueChange={(v) => setSettings((s) => ({ ...s, template_language: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bn">বাংলা (bn)</SelectItem>
                  <SelectItem value="en">English (en)</SelectItem>
                  <SelectItem value="en_US">English US (en_US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label className="text-xs">অর্ডার নিশ্চিতকরণ টেমপ্লেট নাম</Label>
              <Input
                value={settings.order_confirmation_template}
                onChange={(e) => setSettings((s) => ({ ...s, order_confirmation_template: e.target.value }))}
                placeholder="order_confirmation"
                className="text-sm"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">শিপিং নোটিফিকেশন টেমপ্লেট নাম</Label>
              <Input
                value={settings.shipping_template}
                onChange={(e) => setSettings((s) => ({ ...s, shipping_template: e.target.value }))}
                placeholder="shipping_notification"
                className="text-sm"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">ডেলিভারি আপডেট টেমপ্লেট নাম</Label>
              <Input
                value={settings.delivery_template}
                onChange={(e) => setSettings((s) => ({ ...s, delivery_template: e.target.value }))}
                placeholder="delivery_update"
                className="text-sm"
              />
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              ⚠️ Meta WhatsApp Business API-তে টেমপ্লেট মেসেজ আগে{" "}
              <strong>Meta Business Suite</strong> থেকে অনুমোদন করাতে হয়। 
              টেমপ্লেট ছাড়া শুধু টেক্সট মেসেজ পাঠাতে পারবেন ২৪ ঘণ্টার সার্ভিস উইন্ডোতে।
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Test Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            টেস্ট মেসেজ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="ফোন নম্বর (যেমন: 01712345678)"
              className="flex-1"
            />
            <Button
              onClick={sendTestMessage}
              disabled={isSendingTest || !testPhone || !settings.is_enabled}
              size="sm"
            >
              {isSendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              পাঠান
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            ⚡ টেক্সট মেসেজ পাঠাতে গ্রাহককে আগে আপনার নম্বরে মেসেজ করতে হবে (২৪ ঘণ্টা উইন্ডো)।
          </p>
        </CardContent>
      </Card>

      {/* Message Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            মেসেজ লগ
          </CardTitle>
          <CardDescription>সাম্প্রতিক WhatsApp মেসেজসমূহ</CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              এখনো কোনো মেসেজ পাঠানো হয়নি
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">সময়</TableHead>
                    <TableHead className="text-xs">ফোন</TableHead>
                    <TableHead className="hidden sm:table-cell text-xs">ধরন</TableHead>
                    <TableHead className="hidden sm:table-cell text-xs">অর্ডার</TableHead>
                    <TableHead className="text-xs">স্ট্যাটাস</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">
                        {new Date(log.created_at).toLocaleString("bn-BD")}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{log.recipient_phone}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="text-xs">{log.message_type}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs">{log.order_number || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={log.status === "sent" ? "default" : "destructive"} className="text-xs">
                          {log.status === "sent" ? "✅ সফল" : "❌ ব্যর্থ"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
