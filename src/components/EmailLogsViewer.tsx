/**
 * Email Logs Viewer Component
 * Shows email sending history for admin
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mail,
  Loader2,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

interface EmailLog {
  id: string;
  order_number: string | null;
  recipient_email: string;
  subject: string;
  template_type: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

const EmailLogsViewer = () => {
  const { language } = useLanguage();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [templateFilter, setTemplateFilter] = useState<string>("all");

  const translations = {
    title: language === "bn" ? "ইমেইল লগ" : "Email Logs",
    search: language === "bn" ? "খুঁজুন..." : "Search...",
    refresh: language === "bn" ? "রিফ্রেশ" : "Refresh",
    orderNumber: language === "bn" ? "অর্ডার নম্বর" : "Order Number",
    recipient: language === "bn" ? "প্রাপক" : "Recipient",
    subject: language === "bn" ? "বিষয়" : "Subject",
    template: language === "bn" ? "টেমপ্লেট" : "Template",
    status: language === "bn" ? "স্ট্যাটাস" : "Status",
    sentAt: language === "bn" ? "পাঠানো হয়েছে" : "Sent At",
    createdAt: language === "bn" ? "তৈরি হয়েছে" : "Created At",
    error: language === "bn" ? "ত্রুটি" : "Error",
    noLogs: language === "bn" ? "কোন ইমেইল লগ পাওয়া যায়নি" : "No email logs found",
    allStatus: language === "bn" ? "সব স্ট্যাটাস" : "All Status",
    allTemplates: language === "bn" ? "সব টেমপ্লেট" : "All Templates",
    sent: language === "bn" ? "পাঠানো" : "Sent",
    pending: language === "bn" ? "পেন্ডিং" : "Pending",
    failed: language === "bn" ? "ব্যর্থ" : "Failed",
    orderConfirmation: language === "bn" ? "অর্ডার কনফার্মেশন" : "Order Confirmation",
    statusUpdate: language === "bn" ? "স্ট্যাটাস আপডেট" : "Status Update",
    shippingNotification: language === "bn" ? "শিপিং নোটিফিকেশন" : "Shipping Notification",
    na: language === "bn" ? "প্রযোজ্য নয়" : "N/A",
  };

  const templateLabels: Record<string, string> = {
    order_confirmation: translations.orderConfirmation,
    order_status_update: translations.statusUpdate,
    shipping_notification: translations.shippingNotification,
  };

  const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
    sent: { color: "bg-green-500", icon: CheckCircle2, label: translations.sent },
    pending: { color: "bg-yellow-500", icon: Clock, label: translations.pending },
    failed: { color: "bg-red-500", icon: XCircle, label: translations.failed },
  };

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // Use raw fetch for REST API to bypass type issues
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      let url = `${supabaseUrl}/rest/v1/email_logs?select=*&order=created_at.desc&limit=100`;
      
      const response = await fetch(url, {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${accessToken || supabaseKey}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data || []);
      } else {
        console.error("Failed to fetch email logs");
        setLogs([]);
      }
    } catch (error) {
      console.error("Error fetching email logs:", error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchTerm === "" ||
      log.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    const matchesTemplate = templateFilter === "all" || log.template_type === templateFilter;

    return matchesSearch && matchesStatus && matchesTemplate;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return translations.na;
    return new Date(dateString).toLocaleString(language === "bn" ? "bn-BD" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {translations.title}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            {translations.refresh}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={translations.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={translations.allStatus} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{translations.allStatus}</SelectItem>
              <SelectItem value="sent">{translations.sent}</SelectItem>
              <SelectItem value="pending">{translations.pending}</SelectItem>
              <SelectItem value="failed">{translations.failed}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={templateFilter} onValueChange={setTemplateFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={translations.allTemplates} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{translations.allTemplates}</SelectItem>
              <SelectItem value="order_confirmation">{translations.orderConfirmation}</SelectItem>
              <SelectItem value="order_status_update">{translations.statusUpdate}</SelectItem>
              <SelectItem value="shipping_notification">{translations.shippingNotification}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{translations.noLogs}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translations.orderNumber}</TableHead>
                  <TableHead>{translations.recipient}</TableHead>
                  <TableHead>{translations.template}</TableHead>
                  <TableHead>{translations.status}</TableHead>
                  <TableHead>{translations.sentAt}</TableHead>
                  <TableHead>{translations.error}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {log.order_number || translations.na}
                    </TableCell>
                    <TableCell>{log.recipient_email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {templateLabels[log.template_type] || log.template_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={log.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(log.sent_at || log.created_at)}
                    </TableCell>
                    <TableCell>
                      {log.error_message ? (
                        <div className="flex items-center gap-1 text-destructive text-sm">
                          <AlertCircle className="h-4 w-4" />
                          <span className="max-w-[200px] truncate" title={log.error_message}>
                            {log.error_message}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailLogsViewer;
