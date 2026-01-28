/**
 * Admin Order Management Page
 */

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { apiClient } from "@/lib/api-client";
import type { Order, OrderStats } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Package,
  Eye,
  Loader2,
  ShoppingBag,
  Calendar,
  MapPin,
  Phone,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Users,
  Search,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { ShipmentTrackingForm } from "@/components/ShipmentTrackingForm";
import { ShipmentTrackingDisplay } from "@/components/ShipmentTrackingDisplay";
import { InvoiceDownloadButton } from "@/components/InvoiceDownloadButton";
import { sendOrderStatusEmail, sendShippingNotificationEmail } from "@/lib/emailService";

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: { bn: string; en: string } }> = {
  pending: { color: "bg-yellow-500", icon: <Clock className="h-4 w-4" />, label: { bn: "পেন্ডিং", en: "Pending" } },
  processing: { color: "bg-blue-500", icon: <Package className="h-4 w-4" />, label: { bn: "প্রসেসিং", en: "Processing" } },
  shipped: { color: "bg-purple-500", icon: <Truck className="h-4 w-4" />, label: { bn: "শিপড", en: "Shipped" } },
  delivered: { color: "bg-green-500", icon: <CheckCircle className="h-4 w-4" />, label: { bn: "ডেলিভারড", en: "Delivered" } },
  cancelled: { color: "bg-red-500", icon: <XCircle className="h-4 w-4" />, label: { bn: "বাতিল", en: "Cancelled" } },
  refunded: { color: "bg-gray-500", icon: <AlertCircle className="h-4 w-4" />, label: { bn: "রিফান্ড", en: "Refunded" } },
};

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
    statusHistory: language === "bn" ? "স্ট্যাটাস হিস্ট্রি" : "Status History",
    noOrders: language === "bn" ? "কোন অর্ডার নেই" : "No orders found",
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        apiClient.getOrders({ status: statusFilter !== 'all' ? statusFilter : undefined, limit: 100 }),
        apiClient.getOrderStats(),
      ]);

      if (ordersRes.data?.orders) {
        setOrders(ordersRes.data.orders);
      }
      if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error(language === "bn" ? "ডাটা লোড করতে সমস্যা হয়েছে" : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleViewDetails = async (orderId: number) => {
    try {
      const response = await apiClient.getOrder(String(orderId));
      if (response.data?.order) {
        setSelectedOrder(response.data.order);
        setNewStatus(response.data.order.status);
        setStatusNote("");
        setIsDetailsOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    setIsUpdating(true);
    try {
      const response = await apiClient.updateOrderStatus(String(selectedOrder.id), newStatus, statusNote);
      if (response.error) {
        toast.error(response.error);
        return;
      }
      
      // Send email notification for status update
      if (selectedOrder.customer_email) {
        sendOrderStatusEmail(
          selectedOrder.customer_email,
          selectedOrder.customer_name || selectedOrder.shipping_name,
          selectedOrder.order_number,
          newStatus
        ).then(result => {
          if (result.success) {
            console.log("Status update email sent successfully");
          } else {
            console.log("Email not sent:", result.message);
          }
        });
      }
      
      toast.success(language === "bn" ? "স্ট্যাটাস আপডেট হয়েছে" : "Status updated");
      fetchData();
      setIsDetailsOpen(false);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error(language === "bn" ? "স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে" : "Failed to update status");
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
      order.shipping_name.toLowerCase().includes(query) ||
      order.shipping_mobile.includes(query)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            {translations.orderManagement}
          </h1>
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
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
                  <p className="text-2xl font-bold">{orders.length}</p>
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
                  <p className="text-sm text-muted-foreground">{translations.lowStock}</p>
                  <p className="text-2xl font-bold text-destructive">{stats?.low_stock_products?.length || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
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
                          <p className="text-xs text-muted-foreground">{order.item_count || '?'} items</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer_name || order.shipping_name}</p>
                          <p className="text-xs text-muted-foreground">{order.shipping_mobile}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="font-semibold">{formatPrice(order.total_amount)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(order.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {language === "bn" ? "দেখুন" : "View"}
                        </Button>
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
                  {/* Customer & Address */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {translations.customer}
                      </h4>
                      <p className="font-medium">{selectedOrder.customer_name || selectedOrder.shipping_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedOrder.customer_email}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {translations.shippingAddress}
                      </h4>
                      <p className="font-medium">{selectedOrder.shipping_name}</p>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {selectedOrder.shipping_mobile}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {[selectedOrder.shipping_address, selectedOrder.shipping_upazila, selectedOrder.shipping_district, selectedOrder.shipping_division]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Order Info */}
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
                            <p className="font-mono font-bold">{selectedOrder.payment_trx_id || '-'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{language === "bn" ? "প্রেরকের নম্বর" : "Sender Number"}</p>
                            <p className="font-mono font-bold">{selectedOrder.payment_sender_number || '-'}</p>
                          </div>
                        </div>
                        
                        {selectedOrder.payment_status === 'verification_pending' && (
                          <div className="mt-4 flex gap-2">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={async () => {
                                setIsUpdating(true);
                                try {
                                  const response = await apiClient.updateOrderStatus(
                                    String(selectedOrder.id), 
                                    'processing', 
                                    `পেমেন্ট ভেরিফাইড - ${selectedOrder.payment_method} TrxID: ${selectedOrder.payment_trx_id}`
                                  );
                                  if (!response.error) {
                                    // Also update payment status to paid
                                    await fetch(`${import.meta.env.VITE_API_URL || 'https://blog.fishcare.com.bd/api'}/orders/${selectedOrder.id}/payment`, {
                                      method: 'PATCH',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                                      },
                                      body: JSON.stringify({ payment_status: 'paid' })
                                    });
                                    toast.success(language === "bn" ? "পেমেন্ট ভেরিফাইড হয়েছে" : "Payment verified");
                                    fetchData();
                                    setIsDetailsOpen(false);
                                  }
                                } catch (error) {
                                  toast.error(language === "bn" ? "সমস্যা হয়েছে" : "Failed to verify");
                                } finally {
                                  setIsUpdating(false);
                                }
                              }}
                              disabled={isUpdating}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {language === "bn" ? "পেমেন্ট ভেরিফাই করুন" : "Verify Payment"}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={async () => {
                                setIsUpdating(true);
                                try {
                                  await fetch(`${import.meta.env.VITE_API_URL || 'https://blog.fishcare.com.bd/api'}/orders/${selectedOrder.id}/payment`, {
                                    method: 'PATCH',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                                    },
                                    body: JSON.stringify({ payment_status: 'failed' })
                                  });
                                  toast.success(language === "bn" ? "পেমেন্ট বাতিল হয়েছে" : "Payment rejected");
                                  fetchData();
                                  setIsDetailsOpen(false);
                                } catch (error) {
                                  toast.error(language === "bn" ? "সমস্যা হয়েছে" : "Failed");
                                } finally {
                                  setIsUpdating(false);
                                }
                              }}
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

                  {selectedOrder.customer_note && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">{language === "bn" ? "কাস্টমার নোট" : "Customer Note"}</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                          {selectedOrder.customer_note}
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
                            {item.discount_percentage > 0 && (
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
                  
                  {/* Invoice Download */}
                  <InvoiceDownloadButton order={selectedOrder} variant="default" className="w-full" />
                </TabsContent>

                {/* Tracking Tab */}
                <TabsContent value="tracking" className="space-y-4 mt-4">
                  {/* Current Tracking Info */}
                  {(selectedOrder.courier_name || selectedOrder.tracking_number) && (
                    <>
                      <ShipmentTrackingDisplay order={selectedOrder} />
                      <Separator />
                    </>
                  )}
                  
                  {/* Tracking Form */}
                  <ShipmentTrackingForm 
                    order={selectedOrder} 
                    onSuccess={() => {
                      handleViewDetails(selectedOrder.id);
                      fetchData();
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

                  {/* Status History */}
                  {selectedOrder.status_history && selectedOrder.status_history.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-3">{translations.statusHistory}</h4>
                        <div className="space-y-3">
                          {selectedOrder.status_history.map((history: any) => (
                            <div key={history.id} className="flex gap-3 text-sm">
                              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                              <div>
                                <p className="font-medium">{history.status}</p>
                                {history.note && <p className="text-muted-foreground">{history.note}</p>}
                                <p className="text-xs text-muted-foreground">
                                  {new Date(history.created_at).toLocaleString()} 
                                  {history.changed_by_name && ` • ${history.changed_by_name}`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
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
