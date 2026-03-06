import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Users, Mail, Phone, MessageSquare, Bell, Loader2 } from "lucide-react";

const CHANNELS = [
  { key: "in_app", icon: Bell, bn: "ইন-অ্যাপ", en: "In-App" },
  { key: "email", icon: Mail, bn: "ইমেইল", en: "Email" },
  { key: "sms", icon: Phone, bn: "SMS", en: "SMS" },
  { key: "whatsapp", icon: MessageSquare, bn: "WhatsApp", en: "WhatsApp" },
];

const TARGET_OPTIONS = [
  { value: "all", bn: "সকল ইউজার", en: "All Users" },
  { value: "farmer", bn: "কৃষক", en: "Farmers" },
  { value: "customer", bn: "কাস্টমার", en: "Customers" },
  { value: "blogger", bn: "ব্লগার", en: "Bloggers" },
];

export function QuickNotificationSender() {
  const { language } = useLanguage();
  const t = (bn: string, en: string) => language === "bn" ? bn : en;

  const [templateId, setTemplateId] = useState("");
  const [target, setTarget] = useState("all");
  const [channels, setChannels] = useState<string[]>(["in_app"]);
  const [customMessage, setCustomMessage] = useState("");

  const { data: templates = [] } = useQuery({
    queryKey: ["notification-templates-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_templates")
        .select("*")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const toggleChannel = (ch: string) => {
    setChannels(prev => prev.includes(ch)
      ? prev.filter(c => c !== ch)
      : [...prev, ch]);
  };

  const selectedTemplate = templates.find((t: any) => t.id === templateId);

  const sendMutation = useMutation({
    mutationFn: async () => {
      // Get target users
      let query = supabase.from("profiles").select("user_id, email, full_name, mobile");
      
      if (target !== "all") {
        const { data: roleUsers } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", target as any);
        const userIds = (roleUsers || []).map(r => r.user_id);
        if (userIds.length === 0) throw new Error(t("কোনো ইউজার পাওয়া যায়নি", "No users found"));
        query = query.in("user_id", userIds);
      }

      const { data: users, error } = await query;
      if (error) throw error;
      if (!users || users.length === 0) throw new Error(t("কোনো ইউজার পাওয়া যায়নি", "No users found"));

      const message = customMessage || (language === "bn" && selectedTemplate?.message_bn
        ? selectedTemplate.message_bn : selectedTemplate?.message || "");
      const subject = language === "bn" && selectedTemplate?.subject_bn
        ? selectedTemplate.subject_bn : selectedTemplate?.subject || "";

      // Send in-app notifications
      if (channels.includes("in_app")) {
        const notifications = users.map(u => ({
          user_id: u.user_id,
          title: selectedTemplate?.name || "Notification",
          title_bn: selectedTemplate?.name_bn || "নোটিফিকেশন",
          message: message.split("{user_name}").join(u.full_name || "User"),
          message_bn: (selectedTemplate?.message_bn || message).split("{user_name}").join(u.full_name || "ব্যবহারকারী"),
          type: "system",
        }));

        const { error: notifError } = await supabase
          .from("notifications")
          .insert(notifications);
        if (notifError) throw notifError;
      }

      // Log all notifications
      const logs = users.flatMap(u =>
        channels.map(ch => ({
          user_id: u.user_id,
          template_id: templateId || null,
          channel: ch,
          subject: subject,
          message: message.split("{user_name}").join(u.full_name || "User"),
          status: ch === "in_app" ? "sent" : "queued",
        }))
      );

      const { error: logError } = await supabase
        .from("notification_logs")
        .insert(logs);
      if (logError) throw logError;

      return { count: users.length, channels: channels.length };
    },
    onSuccess: (result) => {
      toast.success(t(
        `${result.count} জন ইউজারকে ${result.channels}টি চ্যানেলে নোটিফিকেশন পাঠানো হয়েছে`,
        `Sent to ${result.count} users across ${result.channels} channels`
      ));
      setCustomMessage("");
    },
    onError: (err: any) => toast.error(err.message || t("পাঠাতে সমস্যা হয়েছে", "Failed to send")),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          {t("দ্রুত নোটিফিকেশন পাঠান", "Quick Notification Sender")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Target */}
        <div>
          <Label className="mb-2 block">{t("টার্গেট ইউজার", "Target Users")}</Label>
          <div className="flex flex-wrap gap-2">
            {TARGET_OPTIONS.map(opt => (
              <Button key={opt.value} type="button" size="sm"
                variant={target === opt.value ? "default" : "outline"}
                onClick={() => setTarget(opt.value)}
                className="gap-1.5"
              >
                <Users className="h-3.5 w-3.5" />
                {t(opt.bn, opt.en)}
              </Button>
            ))}
          </div>
        </div>

        {/* Template */}
        <div>
          <Label className="mb-2 block">{t("টেমপ্লেট নির্বাচন", "Select Template")}</Label>
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger>
              <SelectValue placeholder={t("টেমপ্লেট বাছাই করুন", "Choose a template")} />
            </SelectTrigger>
            <SelectContent>
              {templates.map((tmpl: any) => (
                <SelectItem key={tmpl.id} value={tmpl.id}>
                  {language === "bn" && tmpl.name_bn ? tmpl.name_bn : tmpl.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Channels */}
        <div>
          <Label className="mb-2 block">{t("ডেলিভারি চ্যানেল", "Delivery Channels")}</Label>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map(ch => (
              <Button key={ch.key} type="button" size="sm"
                variant={channels.includes(ch.key) ? "default" : "outline"}
                onClick={() => toggleChannel(ch.key)}
                className="gap-1.5"
              >
                <ch.icon className="h-3.5 w-3.5" />
                {t(ch.bn, ch.en)}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Message Override */}
        <div>
          <Label className="mb-2 block">{t("কাস্টম মেসেজ (ঐচ্ছিক)", "Custom Message (Optional)")}</Label>
          <Textarea
            value={customMessage}
            onChange={e => setCustomMessage(e.target.value)}
            placeholder={t("খালি রাখলে টেমপ্লেটের মেসেজ ব্যবহার হবে", "Leave empty to use template message")}
            rows={3}
          />
        </div>

        {/* Preview */}
        {selectedTemplate && (
          <div className="bg-muted rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">{t("প্রিভিউ", "Preview")}</p>
            <p className="text-sm whitespace-pre-wrap">
              {customMessage || (language === "bn" && selectedTemplate.message_bn
                ? selectedTemplate.message_bn : selectedTemplate.message)}
            </p>
          </div>
        )}

        {/* Send */}
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending || (!templateId && !customMessage) || channels.length === 0}
            className="gap-2"
          >
            {sendMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {t("পাঠানো হচ্ছে...", "Sending...")}</>
            ) : (
              <><Send className="h-4 w-4" /> {t("এখনই পাঠান", "Send Now")}</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
