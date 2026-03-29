import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, MessageSquare, Send, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface SmsSettingsData {
  id: string;
  is_enabled: boolean;
  provider: string;
  api_key: string;
  api_url: string;
  sender_id: string;
  order_confirmation_enabled: boolean;
  order_status_update_enabled: boolean;
  due_reminder_enabled: boolean;
}

interface SmsLog {
  id: string;
  recipient_phone: string;
  message: string;
  status: string;
  message_type: string;
  order_number: string | null;
  created_at: string;
  error_message: string | null;
}

const providers = [
  { value: "bulksmsbd", label: "BulkSMSBD" },
  { value: "smsq", label: "SMSQ" },
  { value: "elitbuzz", label: "ElitBuzz" },
  { value: "greenweb", label: "GreenWeb SMS" },
  { value: "custom", label: "কাস্টম API" },
];

export const SmsSettings = () => {
  const [settings, setSettings] = useState<SmsSettingsData | null>(null);
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("sms_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error);
      toast.error("SMS সেটিংস লোড করতে সমস্যা হয়েছে");
    } else if (data) {
      setSettings(data as SmsSettingsData);
    }
    setIsLoading(false);
  };

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("sms_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setLogs(data as SmsLog[]);
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("sms_settings")
      .update({
        is_enabled: settings.is_enabled,
        provider: settings.provider,
        api_key: settings.api_key,
        api_url: settings.api_url,
        sender_id: settings.sender_id,
        order_confirmation_enabled: settings.order_confirmation_enabled,
        order_status_update_enabled: settings.order_status_update_enabled,
        due_reminder_enabled: settings.due_reminder_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settings.id);

    if (error) {
      toast.error("সেটিংস সেভ করতে সমস্যা হয়েছে");
    } else {
      toast.success("SMS সেটিংস সফলভাবে সেভ হয়েছে");
    }
    setIsSaving(false);
  };

  const handleSendTest = async () => {
    if (!testPhone) {
      toast.error("ফোন নম্বর দিন");
      return;
    }
    setIsSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-sms", {
        body: {
          phone: testPhone,
          message: "এটি একটি টেস্ট SMS। আপনার SMS সেটিংস সঠিকভাবে কনফিগার হয়েছে। - FishCare",
          message_type: "test",
        },
      });
      if (error) throw error;
      toast.success("টেস্ট SMS পাঠানো হয়েছে");
      fetchLogs();
    } catch (err: any) {
      toast.error("SMS পাঠাতে সমস্যা: " + (err.message || "Unknown error"));
    }
    setIsSendingTest(false);
  };

  const updateField = (field: keyof SmsSettingsData, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return <p className="text-muted-foreground">SMS সেটিংস পাওয়া যায়নি।</p>;
  }

  return (
    <div className="space-y-6">
      {/* Main Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            SMS সেটিংস
          </CardTitle>
          <CardDescription>
            SMS গেটওয়ে কনফিগার করুন। অর্ডার কনফার্মেশন, স্ট্যাটাস আপডেট ও বাকি রিমাইন্ডার SMS পাঠাতে ব্যবহৃত হবে।
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">SMS সার্ভিস সক্রিয়</Label>
              <p className="text-sm text-muted-foreground">SMS নোটিফিকেশন চালু/বন্ধ করুন</p>
            </div>
            <Switch
              checked={settings.is_enabled}
              onCheckedChange={(v) => updateField("is_enabled", v)}
            />
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>SMS প্রোভাইডার</Label>
              <Select value={settings.provider} onValueChange={(v) => updateField("provider", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sender ID</Label>
              <Input
                value={settings.sender_id}
                onChange={(e) => updateField("sender_id", e.target.value)}
                placeholder="8809612XXXXXX"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={settings.api_key}
                onChange={(e) => updateField("api_key", e.target.value)}
                placeholder="আপনার API Key দিন"
              />
            </div>
            <div className="space-y-2">
              <Label>API URL</Label>
              <Input
                value={settings.api_url}
                onChange={(e) => updateField("api_url", e.target.value)}
                placeholder="https://bulksmsbd.net/api/smsapi"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground">অটোমেটিক SMS নোটিফিকেশন</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>অর্ডার কনফার্মেশন SMS</Label>
                  <p className="text-xs text-muted-foreground">নতুন অর্ডার হলে কাস্টমারকে SMS</p>
                </div>
                <Switch
                  checked={settings.order_confirmation_enabled}
                  onCheckedChange={(v) => updateField("order_confirmation_enabled", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>অর্ডার স্ট্যাটাস আপডেট SMS</Label>
                  <p className="text-xs text-muted-foreground">অর্ডার স্ট্যাটাস পরিবর্তন হলে SMS</p>
                </div>
                <Switch
                  checked={settings.order_status_update_enabled}
                  onCheckedChange={(v) => updateField("order_status_update_enabled", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>বাকি রিমাইন্ডার SMS</Label>
                  <p className="text-xs text-muted-foreground">বাকি থাকলে রিমাইন্ডার SMS পাঠান</p>
                </div>
                <Switch
                  checked={settings.due_reminder_enabled}
                  onCheckedChange={(v) => updateField("due_reminder_enabled", v)}
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            সেটিংস সেভ করুন
          </Button>
        </CardContent>
      </Card>

      {/* Test SMS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            টেস্ট SMS পাঠান
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="max-w-xs"
            />
            <Button onClick={handleSendTest} disabled={isSendingTest || !settings.is_enabled}>
              {isSendingTest ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              পাঠান
            </Button>
          </div>
          {!settings.is_enabled && (
            <p className="text-xs text-muted-foreground mt-2">SMS সার্ভিস সক্রিয় করুন টেস্ট করতে</p>
          )}
        </CardContent>
      </Card>

      {/* SMS Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>SMS লগ</span>
            <Button variant="ghost" size="sm" onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">কোনো SMS লগ নেই</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">তারিখ</TableHead>
                    <TableHead className="text-xs">ফোন</TableHead>
                    <TableHead className="hidden sm:table-cell text-xs">ধরন</TableHead>
                    <TableHead className="text-xs">স্ট্যাটাস</TableHead>
                    <TableHead className="hidden sm:table-cell text-xs">মেসেজ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(log.created_at), "dd/MM/yy HH:mm")}
                      </TableCell>
                      <TableCell className="text-sm">{log.recipient_phone}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary" className="text-xs">{log.message_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.status === "sent" ? "default" : log.status === "failed" ? "destructive" : "secondary"} className="text-xs">
                          {log.status === "sent" ? "সফল" : log.status === "failed" ? "ব্যর্থ" : "অপেক্ষমাণ"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs max-w-[200px] truncate">{log.message}</TableCell>
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

export default SmsSettings;
