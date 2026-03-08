/**
 * Admin Order Management Page - Supabase Implementation
 */

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { bn } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Package, Eye, Loader2, ShoppingBag, Calendar, CalendarIcon, MapPin, Phone, Clock,
  Truck, CheckCircle, XCircle, AlertCircle, TrendingUp,
  Search, RefreshCw, AlertTriangle, Users, X, Bell, MessageSquare, Mail, Send,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ShipmentTrackingForm } from "@/components/ShipmentTrackingForm";
import { ShipmentTrackingDisplay } from "@/components/ShipmentTrackingDisplay";
import { InvoiceDownloadButton } from "@/components/InvoiceDownloadButton";
import { SteadfastOrderButton } from "@/components/admin/SteadfastOrderButton";
import { useSteadfast } from "@/hooks/useSteadfast";
import { sendOrderStatusEmail } from "@/lib/emailService";

// Helper to map Supabase order to invoice Order format
const mapOrderForInvoice = (order: Order) => ({
  ...order,
  shipping_name: order.customer_name,
  shipping_mobile: order.customer_phone,
  shipping_division: order.division,
  shipping_district: order.district,
  shipping_upazila: order.upazila,
  shipping_address: order.shipping_address,
  payment_trx_id: order.transaction_id,
  customer_note: order.notes,
  items: order.items?.map(item => ({
    ...item,
    discount_percentage: item.discount_percentage || 0,
  })) || [],
});

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: { bn: string; en: string } }> = {
  pending: { color: "bg-yellow-500", icon: <Clock className="h-4 w-4" />, label: { bn: "পেন্ডিং", en: "Pending" } },
  processing: { color: "bg-blue-500", icon: <Package className="h-4 w-4" />, label: { bn: "প্রসেসিং", en: "Processing" } },
  shipped: { color: "bg-purple-500", icon: <Truck className="h-4 w-4" />, label: { bn: "শিপড", en: "Shipped" } },
  delivered: { color: "bg-green-500", icon: <CheckCircle className="h-4 w-4" />, label: { bn: "ডেলিভারড", en: "Delivered" } },
  cancelled: { color: "bg-red-500", icon: <XCircle className="h-4 w-4" />, label: { bn: "বাতিল", en: "Cancelled" } },
  refunded: { color: "bg-gray-500", icon: <AlertCircle className="h-4 w-4" />, label: { bn: "রিফান্ড", en: "Refunded" } },
};

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  discount_percentage: number | null;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  shipping_address: string;
  division: string | null;
  district: string | null;
  upazila: string | null;
  payment_method: string;
  payment_status: string;
  transaction_id: string | null;
  sender_number: string | null;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  items?: OrderItem[];
}

interface OrderStats {
  today: { count: number; total_amount: number };
  this_month: { count: number; total_amount: number };
  total: { count: number; total_amount: number };
  by_status: Record<string, number>;
}

const AdminOrders = () => {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [datePreset, setDatePreset] = useState("all");

  const { settings: courierSettings, createOrder: createCourierOrder, getConsignments } = useSteadfast();
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  const translations = {
    orderManagement: language === "bn" ? "অর্ডার ব্যবস্থাপনা" : "Order Management",
    allOrders: language === "bn" ? "সকল অর্ডার" : "All Orders",
    today: language === "bn" ? "আজ" : "Today",
    thisMonth: language === "bn" ? "এই মাসে" : "This Month",
    totalOrders: language === "bn" ? "মোট অর্ডার" : "Total Orders",
    totalSales: language === "bn" ? "মোট বিক্রয়" : "Total Sales",
    lowStock: language === "bn" ? "স্টক কম" : "Low Stock",
    searchOrders: language === "bn" ? "অর্ডার খুঁজুন..." : "Search orders...",
    orderDetails: language === "bn" ? "অর্ডার বিস্তারিত" : "Order Details",
    updateStatus: language === "bn" ? "স্ট্যাটাস আপডেট" : "Update Status",
    statusNote: language === "bn" ? "নোট (ঐচ্ছিক)" : "Note (Optional)",
    update: language === "bn" ? "আপডেট করুন" : "Update",
    customer: language === "bn" ? "কাস্টমার" : "Customer",
    items: language === "bn" ? "পণ্য" : "Items",
    shippingAddress: language === "bn" ? "শিপিং ঠিকানা" : "Shipping Address",
    noOrders: language === "bn" ? "কোন অর্ডার নেই" : "No orders found",
  };

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("orders")
        .select(`*, items:order_items(*)`)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (dateFrom) {
        const fromISO = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate()).toISOString();
        query = query.gte("created_at", fromISO);
      }

      if (dateTo) {
        const toISO = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59).toISOString();
        query = query.lte("created_at", toISO);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      toast.error(language === "bn" ? "অর্ডার লোড করতে সমস্যা হয়েছে" : "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, dateFrom, dateTo, language]);

  const fetchStats = useCallback(async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [todayRes, monthRes, allRes] = await Promise.all([
        supabase.from("orders").select("total_amount").gte("created_at", todayStart),
        supabase.from("orders").select("total_amount").gte("created_at", monthStart),
        supabase.from("orders").select("total_amount, status"),
      ]);

      const todayTotal = todayRes.data?.reduce((s, o) => s + Number(o.total_amount), 0) || 0;
      const monthTotal = monthRes.data?.reduce((s, o) => s + Number(o.total_amount), 0) || 0;
      const total = allRes.data?.reduce((s, o) => s + Number(o.total_amount), 0) || 0;
      const byStatus: Record<string, number> = {};
      allRes.data?.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });

      setStats({
        today: { count: todayRes.data?.length || 0, total_amount: todayTotal },
        this_month: { count: monthRes.data?.length || 0, total_amount: monthTotal },
        total: { count: allRes.data?.length || 0, total_amount: total },
        by_status: byStatus,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders, fetchStats]);

  // Auto-open order from query param
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const orderId = searchParams.get("order");
    if (orderId && orders.length > 0) {
      handleViewDetails(orderId);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, orders]);

  const handleViewDetails = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setNewStatus(order.status);
      setStatusNote("");
      setIsDetailsOpen(true);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      // Send email notification
      if (selectedOrder.customer_email) {
        sendOrderStatusEmail(
          selectedOrder.customer_email,
          selectedOrder.customer_name,
          selectedOrder.order_number,
          newStatus
        ).catch(console.error);
      }

      // Send SMS notification automatically
      if (selectedOrder.customer_phone) {
        const statusLabel = statusConfig[newStatus]?.label?.bn || newStatus;
        const smsMessage = `প্রিয় ${selectedOrder.customer_name}, আপনার অর্ডার ${selectedOrder.order_number} এর স্ট্যাটাস আপডেট হয়েছে: ${statusLabel}। ধন্যবাদ!`;
        
        supabase.functions.invoke("send-sms", {
          body: {
            phone: selectedOrder.customer_phone,
            message: smsMessage,
            message_type: "order_status_update",
            order_number: selectedOrder.order_number,
          },
        }).then(({ data, error: smsError }) => {
          if (smsError) {
            console.error("SMS send error:", smsError);
          } else if (data?.success) {
            console.log("SMS sent successfully for order:", selectedOrder.order_number);
          }
        }).catch(console.error);
      }

      // Auto-send to Steadfast courier when status is shipped
      if (newStatus === "shipped" && courierSettings?.is_enabled) {
        try {
          // Check if already sent to courier
          const existingConsignments = await getConsignments(selectedOrder.id);
          if (existingConsignments.length === 0) {
            const codAmount = selectedOrder.payment_method === "cod" ? selectedOrder.total_amount : 0;
            await createCourierOrder({
              order_id: selectedOrder.id,
              invoice: selectedOrder.order_number,
              recipient_name: selectedOrder.customer_name,
              recipient_phone: selectedOrder.customer_phone,
              recipient_address: [selectedOrder.shipping_address, selectedOrder.upazila, selectedOrder.district, selectedOrder.division].filter(Boolean).join(", "),
              cod_amount: codAmount,
              note: selectedOrder.notes || "",
            });
            toast.success(language === "bn" ? "অটোমেটিক কুরিয়ারে পাঠানো হয়েছে" : "Auto-sent to courier");
          }
        } catch (courierErr) {
          console.error("Auto courier error:", courierErr);
        }
      }

      toast.success(language === "bn" ? "স্ট্যাটাস আপডেট হয়েছে" : "Status updated");
      fetchOrders();
      fetchStats();
      setIsDetailsOpen(false);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error(language === "bn" ? "স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে" : "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVerifyPayment = async (verified: boolean) => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    try {
      const updates: Record<string, string> = {
        payment_status: verified ? "paid" : "failed",
        updated_at: new Date().toISOString(),
      };
      if (verified) {
        updates.status = "processing";
      }

      const { error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", selectedOrder.id);

      if (error) throw error;

      toast.success(language === "bn"
        ? (verified ? "পেমেন্ট ভেরিফাইড হয়েছে" : "পেমেন্ট বাতিল হয়েছে")
        : (verified ? "Payment verified" : "Payment rejected"));
      fetchOrders();
      fetchStats();
      setIsDetailsOpen(false);
    } catch (error) {
      toast.error(language === "bn" ? "সমস্যা হয়েছে" : "Failed");
    } finally {
      setIsUpdating(false);
    }
  };

  // Multi-channel Payment Reminder
  const [reminderChannels, setReminderChannels] = useState<string[]>(["sms", "in_app"]);

  const toggleReminderChannel = (ch: string) => {
    setReminderChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const handleSendPaymentReminder = async () => {
    if (!selectedOrder || reminderChannels.length === 0) return;
    setIsSendingReminder(true);
    const results: string[] = [];
    const errors: string[] = [];

    const reminderMessageBn = `প্রিয় ${selectedOrder.customer_name}, আপনার অর্ডার ${selectedOrder.order_number} এর পেমেন্ট (৳${selectedOrder.total_amount}) এখনও পেন্ডিং রয়েছে। অনুগ্রহ করে দ্রুত পেমেন্ট সম্পন্ন করুন। ধন্যবাদ!`;
    const reminderMessageEn = `Dear ${selectedOrder.customer_name}, payment of ৳${selectedOrder.total_amount} for order ${selectedOrder.order_number} is still pending. Please complete your payment soon. Thank you!`;

    try {
      // SMS
      if (reminderChannels.includes("sms")) {
        try {
          const { error } = await supabase.functions.invoke("send-sms", {
            body: {
              phone: selectedOrder.customer_phone,
              message: reminderMessageBn,
              message_type: "payment_reminder",
              order_number: selectedOrder.order_number,
            },
          });
          if (error) throw error;
          results.push("SMS");
        } catch (e) { errors.push("SMS"); }
      }

      // WhatsApp
      if (reminderChannels.includes("whatsapp")) {
        try {
          const { error } = await supabase.functions.invoke("send-whatsapp", {
            body: {
              action: "send_text",
              phone: selectedOrder.customer_phone,
              text_message: reminderMessageBn,
              order_number: selectedOrder.order_number,
            },
          });
          if (error) throw error;
          results.push("WhatsApp");
        } catch (e) { errors.push("WhatsApp"); }
      }

      // In-App Notification
      if (reminderChannels.includes("in_app") && selectedOrder.user_id) {
        try {
          const { error } = await supabase.from("notifications").insert({
            user_id: selectedOrder.user_id,
            title: `Payment Reminder - ${selectedOrder.order_number}`,
            title_bn: `পেমেন্ট রিমাইন্ডার - ${selectedOrder.order_number}`,
            message: reminderMessageEn,
            message_bn: reminderMessageBn,
            type: "payment_reminder",
            reference_id: selectedOrder.id,
            reference_type: "order",
          });
          if (error) throw error;
          results.push(language === "bn" ? "ইন-অ্যাপ" : "In-App");
        } catch (e) { errors.push(language === "bn" ? "ইন-অ্যাপ" : "In-App"); }
      }

      // Email
      if (reminderChannels.includes("email") && selectedOrder.customer_email) {
        try {
          const { error } = await supabase.functions.invoke("send-order-email", {
            body: {
              to: selectedOrder.customer_email,
              subject: `পেমেন্ট রিমাইন্ডার - অর্ডার ${selectedOrder.order_number}`,
              order_number: selectedOrder.order_number,
              customer_name: selectedOrder.customer_name,
              template_type: "payment_reminder",
              message: reminderMessageBn,
            },
          });
          if (error) throw error;
          results.push(language === "bn" ? "ইমেইল" : "Email");
        } catch (e) { errors.push(language === "bn" ? "ইমেইল" : "Email"); }
      }

      if (results.length > 0) {
        toast.success(language === "bn"
          ? `রিমাইন্ডার পাঠানো হয়েছে: ${results.join(", ")}`
          : `Reminder sent via: ${results.join(", ")}`);
      }
      if (errors.length > 0) {
        toast.error(language === "bn"
          ? `ব্যর্থ হয়েছে: ${errors.join(", ")}`
          : `Failed: ${errors.join(", ")}`);
      }
    } catch (err) {
      console.error("Payment reminder error:", err);
      toast.error(language === "bn" ? "রিমাইন্ডার পাঠাতে সমস্যা হয়েছে" : "Failed to send reminder");
    } finally {
      setIsSendingReminder(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        {config.icon}
        {language === "bn" ? config.label.bn : config.label.en}
      </Badge>
    );
  };

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(query) ||
      order.customer_name.toLowerCase().includes(query) ||
      order.customer_phone.includes(query)
    );
  });

  const lowStockCount = stats?.by_status?.cancelled || 0; // placeholder

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            {translations.orderManagement}
          </h1>
          <Button variant="outline" onClick={() => { fetchOrders(); fetchStats(); }} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {language === "bn" ? "রিফ্রেশ" : "Refresh"}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{translations.today}</p>
                  <p className="text-2xl font-bold">{stats?.today?.count || 0}</p>
                  <p className="text-sm text-primary">{formatPrice(stats?.today?.total_amount || 0)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{translations.thisMonth}</p>
                  <p className="text-2xl font-bold">{stats?.this_month?.count || 0}</p>
                  <p className="text-sm text-primary">{formatPrice(stats?.this_month?.total_amount || 0)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{translations.totalOrders}</p>
                  <p className="text-2xl font-bold">{stats?.total?.count || 0}</p>
                  <p className="text-sm text-primary">{formatPrice(stats?.total?.total_amount || 0)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{language === "bn" ? "অপেক্ষমান" : "Pending"}</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats?.by_status?.pending || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={translations.searchOrders}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{translations.allOrders}</SelectItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {language === "bn" ? config.label.bn : config.label.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={datePreset} onValueChange={(val) => {
            setDatePreset(val);
            const now = new Date();
            if (val === "all") {
              setDateFrom(undefined);
              setDateTo(undefined);
            } else if (val === "today") {
              setDateFrom(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
              setDateTo(now);
            } else if (val === "yesterday") {
              const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
              setDateFrom(y);
              setDateTo(y);
            } else if (val === "7days") {
              setDateFrom(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
              setDateTo(now);
            } else if (val === "30days") {
              setDateFrom(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29));
              setDateTo(now);
            } else if (val === "this_month") {
              setDateFrom(new Date(now.getFullYear(), now.getMonth(), 1));
              setDateTo(now);
            } else if (val === "last_month") {
              setDateFrom(new Date(now.getFullYear(), now.getMonth() - 1, 1));
              setDateTo(new Date(now.getFullYear(), now.getMonth(), 0));
            } else if (val === "custom") {
              // keep current dateFrom/dateTo, user picks via calendars below
            }
          }}>
            <SelectTrigger className="w-full sm:w-48">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder={language === "bn" ? "তারিখ ফিল্টার" : "Date Filter"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "bn" ? "সকল তারিখ" : "All Dates"}</SelectItem>
              <SelectItem value="today">{language === "bn" ? "আজ" : "Today"}</SelectItem>
              <SelectItem value="yesterday">{language === "bn" ? "গতকাল" : "Yesterday"}</SelectItem>
              <SelectItem value="7days">{language === "bn" ? "গত ৭ দিন" : "Last 7 Days"}</SelectItem>
              <SelectItem value="30days">{language === "bn" ? "গত ৩০ দিন" : "Last 30 Days"}</SelectItem>
              <SelectItem value="this_month">{language === "bn" ? "এই মাস" : "This Month"}</SelectItem>
              <SelectItem value="last_month">{language === "bn" ? "গত মাস" : "Last Month"}</SelectItem>
              <SelectItem value="custom">{language === "bn" ? "কাস্টম রেঞ্জ" : "Custom Range"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Date Range Pickers */}
        {datePreset === "custom" && (
          <div className="flex flex-wrap items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "dd MMM yyyy", { locale: language === "bn" ? bn : undefined }) : (language === "bn" ? "শুরুর তারিখ" : "From date")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "dd MMM yyyy", { locale: language === "bn" ? bn : undefined }) : (language === "bn" ? "শেষ তারিখ" : "To date")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
                <X className="h-3.5 w-3.5" /> {language === "bn" ? "রিসেট" : "Reset"}
              </Button>
            )}
          </div>
        )}

        {/* Orders Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">{translations.noOrders}</h3>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "bn" ? "অর্ডার" : "Order"}</TableHead>
                    <TableHead>{translations.customer}</TableHead>
                    <TableHead>{language === "bn" ? "তারিখ" : "Date"}</TableHead>
                    <TableHead>{language === "bn" ? "স্ট্যাটাস" : "Status"}</TableHead>
                    <TableHead>{language === "bn" ? "পেমেন্ট" : "Payment"}</TableHead>
                    <TableHead>{language === "bn" ? "মোট" : "Total"}</TableHead>
                    <TableHead className="text-right">{language === "bn" ? "অ্যাকশন" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.order_number}</p>
                          <p className="text-xs text-muted-foreground">{order.items?.length || 0} {language === "bn" ? "পণ্য" : "items"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <Badge variant={order.payment_status === 'paid' ? 'default' : order.payment_status === 'verification_pending' ? 'outline' : 'secondary'}>
                          {order.payment_status === 'verification_pending'
                            ? (language === "bn" ? "ভেরিফাই পেন্ডিং" : "Verify Pending")
                            : order.payment_status === 'paid'
                              ? (language === "bn" ? "পেইড" : "Paid")
                              : (language === "bn" ? "পেন্ডিং" : "Pending")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">{formatPrice(order.total_amount)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <SteadfastOrderButton
                            order={order}
                            onSuccess={() => fetchOrders()}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(order.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {language === "bn" ? "দেখুন" : "View"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Order Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {translations.orderDetails} - {selectedOrder?.order_number}
              </DialogTitle>
            </DialogHeader>

            {selectedOrder && (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">{language === "bn" ? "বিস্তারিত" : "Details"}</TabsTrigger>
                  <TabsTrigger value="items">{translations.items}</TabsTrigger>
                  <TabsTrigger value="tracking">{language === "bn" ? "ট্র্যাকিং" : "Tracking"}</TabsTrigger>
                  <TabsTrigger value="status">{translations.updateStatus}</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {translations.customer}
                      </h4>
                      <p className="font-medium">{selectedOrder.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedOrder.customer_email}</p>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {selectedOrder.customer_phone}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {translations.shippingAddress}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {[selectedOrder.shipping_address, selectedOrder.upazila, selectedOrder.district, selectedOrder.division]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "bn" ? "স্ট্যাটাস" : "Status"}</p>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "bn" ? "পেমেন্ট" : "Payment"}</p>
                      <Badge variant={selectedOrder.payment_status === 'paid' ? 'default' : selectedOrder.payment_status === 'verification_pending' ? 'outline' : 'secondary'}>
                        {selectedOrder.payment_status === 'verification_pending'
                          ? (language === "bn" ? "ভেরিফাই পেন্ডিং" : "Verify Pending")
                          : selectedOrder.payment_status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "bn" ? "তারিখ" : "Date"}</p>
                      <p className="text-sm">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Payment Details for bKash/Nagad */}
                  {(selectedOrder.payment_method === 'bkash' || selectedOrder.payment_method === 'nagad') && (
                    <>
                      <Separator />
                      <div className={`p-4 rounded-lg border ${
                        selectedOrder.payment_method === 'bkash'
                          ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800'
                          : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                      }`}>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <div className={`h-6 w-6 rounded flex items-center justify-center text-white text-xs font-bold ${
                            selectedOrder.payment_method === 'bkash' ? 'bg-pink-500' : 'bg-orange-500'
                          }`}>
                            {selectedOrder.payment_method === 'bkash' ? 'bK' : 'N'}
                          </div>
                          {selectedOrder.payment_method === 'bkash' ? 'bKash' : 'Nagad'} {language === "bn" ? "পেমেন্ট তথ্য" : "Payment Details"}
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">{language === "bn" ? "ট্রানজেকশন আইডি" : "Transaction ID"}</p>
                            <p className="font-mono font-bold">{selectedOrder.transaction_id || '-'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{language === "bn" ? "প্রেরকের নম্বর" : "Sender Number"}</p>
                            <p className="font-mono font-bold">{selectedOrder.sender_number || '-'}</p>
                          </div>
                        </div>

                        {selectedOrder.payment_status === 'verification_pending' && (
                          <div className="mt-4 flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleVerifyPayment(true)}
                              disabled={isUpdating}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {language === "bn" ? "পেমেন্ট ভেরিফাই করুন" : "Verify Payment"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleVerifyPayment(false)}
                              disabled={isUpdating}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              {language === "bn" ? "বাতিল করুন" : "Reject"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {selectedOrder.notes && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">{language === "bn" ? "কাস্টমার নোট" : "Customer Note"}</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                          {selectedOrder.notes}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Payment Reminder Section */}
                  {selectedOrder.payment_status !== "paid" && (
                    <>
                      <Separator />
                      <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                          <Bell className="h-4 w-4" />
                          {language === "bn" ? "পেমেন্ট রিমাইন্ডার" : "Payment Reminder"}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {language === "bn"
                            ? `পেমেন্ট স্ট্যাটাস: ${selectedOrder.payment_status === "pending" ? "পেন্ডিং" : selectedOrder.payment_status}। চ্যানেল সিলেক্ট করে রিমাইন্ডার পাঠান।`
                            : `Payment status: ${selectedOrder.payment_status}. Select channels and send reminder.`}
                        </p>

                        <div className="flex flex-wrap gap-3 mb-3">
                          {[
                            { key: "sms", label: language === "bn" ? "SMS" : "SMS", icon: Phone },
                            { key: "whatsapp", label: "WhatsApp", icon: MessageSquare },
                            { key: "in_app", label: language === "bn" ? "ইন-অ্যাপ" : "In-App", icon: Bell },
                            { key: "email", label: language === "bn" ? "ইমেইল" : "Email", icon: Mail },
                          ].map(ch => (
                            <label key={ch.key} className="flex items-center gap-1.5 cursor-pointer">
                              <Checkbox
                                checked={reminderChannels.includes(ch.key)}
                                onCheckedChange={() => toggleReminderChannel(ch.key)}
                              />
                              <ch.icon className="h-3.5 w-3.5" />
                              <span className="text-sm">{ch.label}</span>
                            </label>
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSendPaymentReminder}
                          disabled={isSendingReminder || reminderChannels.length === 0}
                          className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-900/40"
                        >
                          {isSendingReminder ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          {language === "bn" ? "রিমাইন্ডার পাঠান" : "Send Reminder"}
                        </Button>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="items" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} className="flex gap-3 p-3 border rounded-lg">
                        <div className="w-16 h-16 rounded bg-muted overflow-hidden flex-shrink-0">
                          {item.product_image ? (
                            <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(item.unit_price)} × {item.quantity}
                            {(item.discount_percentage || 0) > 0 && (
                              <span className="ml-2 text-primary">(-{item.discount_percentage}%)</span>
                            )}
                          </p>
                        </div>
                        <p className="font-bold text-primary">{formatPrice(item.total_price)}</p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{language === "bn" ? "সাবটোটাল" : "Subtotal"}</span>
                      <span>{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{language === "bn" ? "শিপিং" : "Shipping"}</span>
                      <span>{selectedOrder.shipping_cost > 0 ? formatPrice(selectedOrder.shipping_cost) : 'Free'}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>{language === "bn" ? "মোট" : "Total"}</span>
                      <span className="text-primary">{formatPrice(selectedOrder.total_amount)}</span>
                    </div>
                  </div>

                  <InvoiceDownloadButton order={mapOrderForInvoice(selectedOrder) as any} variant="default" className="w-full" showAdminOption={true} />
                </TabsContent>

                <TabsContent value="tracking" className="space-y-4 mt-4">
                  <ShipmentTrackingDisplay order={selectedOrder as any} />
                  <Separator />
                  <ShipmentTrackingForm
                    order={selectedOrder as any}
                    onSuccess={() => {
                      fetchOrders();
                    }}
                  />
                </TabsContent>

                <TabsContent value="status" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="font-medium">{translations.updateStatus}</label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                {config.icon}
                                {language === "bn" ? config.label.bn : config.label.en}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {newStatus === "shipped" && courierSettings?.is_enabled && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Truck className="h-3 w-3" />
                          {language === "bn" ? "শিপড করলে অটোমেটিক Steadfast কুরিয়ারে পাঠানো হবে" : "Will auto-send to Steadfast courier"}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="font-medium">{translations.statusNote}</label>
                      <Textarea
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        placeholder={language === "bn" ? "স্ট্যাটাস পরিবর্তনের কারণ লিখুন..." : "Reason for status change..."}
                        rows={3}
                      />
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleUpdateStatus}
                      disabled={isUpdating || newStatus === selectedOrder.status}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {translations.update}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
