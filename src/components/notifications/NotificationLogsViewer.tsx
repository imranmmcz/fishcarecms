import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList, Mail, Phone, MessageSquare, Bell, Search } from "lucide-react";
import { format } from "date-fns";

const CHANNEL_ICONS: Record<string, any> = { email: Mail, sms: Phone, whatsapp: MessageSquare, in_app: Bell };
const STATUS_COLORS: Record<string, string> = {
  sent: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  queued: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function NotificationLogsViewer() {
  const { language } = useLanguage();
  const t = (bn: string, en: string) => language === "bn" ? bn : en;

  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const { data, isLoading } = useQuery({
    queryKey: ["notification-logs", channelFilter, statusFilter, dateFrom, dateTo, page],
    queryFn: async () => {
      let query = supabase
        .from("notification_logs")
        .select("*, notification_templates(name, name_bn)", { count: "exact" })
        .order("sent_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (channelFilter !== "all") query = query.eq("channel", channelFilter);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (dateFrom) query = query.gte("sent_at", dateFrom);
      if (dateTo) query = query.lte("sent_at", dateTo + "T23:59:59");

      const { data, error, count } = await query;
      if (error) throw error;
      return { logs: data || [], total: count || 0 };
    },
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          {t("নোটিফিকেশন লগ", "Notification Logs")}
          <Badge variant="secondary" className="ml-2">{total}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={channelFilter} onValueChange={v => { setChannelFilter(v); setPage(0); }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t("চ্যানেল", "Channel")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("সব", "All")}</SelectItem>
              <SelectItem value="in_app">{t("ইন-অ্যাপ", "In-App")}</SelectItem>
              <SelectItem value="email">{t("ইমেইল", "Email")}</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t("স্ট্যাটাস", "Status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("সব", "All")}</SelectItem>
              <SelectItem value="sent">{t("পাঠানো", "Sent")}</SelectItem>
              <SelectItem value="queued">{t("কিউতে", "Queued")}</SelectItem>
              <SelectItem value="failed">{t("ব্যর্থ", "Failed")}</SelectItem>
            </SelectContent>
          </Select>

          <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0); }}
            className="w-40" placeholder={t("থেকে", "From")} />
          <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0); }}
            className="w-40" placeholder={t("পর্যন্ত", "To")} />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">{t("লোড হচ্ছে...", "Loading...")}</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("তারিখ", "Date")}</TableHead>
                  <TableHead>{t("চ্যানেল", "Channel")}</TableHead>
                  <TableHead>{t("টেমপ্লেট", "Template")}</TableHead>
                  <TableHead>{t("মেসেজ", "Message")}</TableHead>
                  <TableHead>{t("স্ট্যাটাস", "Status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => {
                  const Icon = CHANNEL_ICONS[log.channel];
                  const tmplName = log.notification_templates
                    ? (language === "bn" && log.notification_templates.name_bn ? log.notification_templates.name_bn : log.notification_templates.name)
                    : "-";
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(log.sent_at), "yyyy-MM-dd HH:mm")}
                      </TableCell>
                      <TableCell>
                        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                      </TableCell>
                      <TableCell className="text-sm">{tmplName}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{log.message}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[log.status] || ""}`}>
                          {log.status === "sent" ? t("পাঠানো", "Sent")
                            : log.status === "queued" ? t("কিউতে", "Queued")
                            : t("ব্যর্থ", "Failed")}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t("কোনো লগ নেই", "No logs found")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              {t(`মোট ${total}টি`, `Total ${total}`)}
            </p>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={page === 0}
                onClick={() => setPage(p => p - 1)}>
                {t("আগের", "Prev")}
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}>
                {t("পরের", "Next")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
