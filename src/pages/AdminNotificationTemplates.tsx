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
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            {t("নোটিফিকেশন টেমপ্লেট", "Notification Templates")}
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            {t("ইমেইল, SMS, WhatsApp এবং ইন-অ্যাপ নোটিফিকেশন পরিচালনা করুন", "Manage notifications")}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t("টেমপ্লেট", "Templates")}</span>
              <span className="sm:hidden">{t("টেমপ্লেট", "Tmpl")}</span>
            </TabsTrigger>
            <TabsTrigger value="quick-send" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t("দ্রুত পাঠান", "Quick Send")}</span>
              <span className="sm:hidden">{t("পাঠান", "Send")}</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <ClipboardList className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
