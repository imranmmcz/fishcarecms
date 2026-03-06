import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateManager } from "@/components/notifications/TemplateManager";
import { QuickNotificationSender } from "@/components/notifications/QuickNotificationSender";
import { NotificationLogsViewer } from "@/components/notifications/NotificationLogsViewer";
import { Bell, Send, FileText, ClipboardList } from "lucide-react";

export default function AdminNotificationTemplates() {
  const { language } = useLanguage();
  const t = (bn: string, en: string) => language === "bn" ? bn : en;
  const [activeTab, setActiveTab] = useState("templates");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            {t("নোটিফিকেশন টেমপ্লেট সিস্টেম", "Notification Template System")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("ইমেইল, SMS, WhatsApp এবং ইন-অ্যাপ নোটিফিকেশন পরিচালনা করুন", "Manage Email, SMS, WhatsApp and In-App notifications")}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("টেমপ্লেট", "Templates")}
            </TabsTrigger>
            <TabsTrigger value="quick-send" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              {t("দ্রুত পাঠান", "Quick Send")}
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              {t("লগ", "Logs")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <TemplateManager />
          </TabsContent>
          <TabsContent value="quick-send">
            <QuickNotificationSender />
          </TabsContent>
          <TabsContent value="logs">
            <NotificationLogsViewer />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
