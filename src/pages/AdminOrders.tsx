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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Package, Eye, Loader2, ShoppingBag, Calendar, MapPin, Phone, Clock,
  Truck, CheckCircle, XCircle, AlertCircle, TrendingUp,
  Search, RefreshCw, AlertTriangle, Users,
} from "lucide-react";
import { ShipmentTrackingForm } from "@/components/ShipmentTrackingForm";
import { ShipmentTrackingDisplay } from "@/components/ShipmentTrackingDisplay";
import { InvoiceDownloadButton } from "@/components/InvoiceDownloadButton";
import { SteadfastOrderButton } from "@/components/admin/SteadfastOrderButton";
import { sendOrderStatusEmail } from "@/lib/emailService";

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

      const { data, error } = await query;
      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      toast.error(language === "bn" ? "অর্ডার লোড করতে সমস্যা হয়েছে" : "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, language]);

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

      if (selectedOrder.customer_email) {
        sendOrderStatusEmail(
          selectedOrder.customer_email,
          selectedOrder.customer_name,
          selectedOrder.order_number,
          newStatus
        ).catch(console.error);
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
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
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
        </div>

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

                  <InvoiceDownloadButton order={selectedOrder as any} variant="default" className="w-full" showAdminOption={true} />
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
