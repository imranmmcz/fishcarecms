/**
 * Admin Incomplete Orders Page - Shows orders that are not yet delivered or cancelled
 */
import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import { format } from "date-fns";
import { bn } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Package, Eye, Loader2, Clock, Truck, Search, RefreshCw,
  AlertTriangle, Phone, MapPin, ShoppingBag,
} from "lucide-react";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  shipping_address: string;
  division: string | null;
  district: string | null;
  upazila: string | null;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  transaction_id: string | null;
  sender_number: string | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_percentage: number | null;
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: { bn: string; en: string } }> = {
  pending: { color: "bg-yellow-500", icon: <Clock className="h-4 w-4" />, label: { bn: "পেন্ডিং", en: "Pending" } },
  processing: { color: "bg-blue-500", icon: <Package className="h-4 w-4" />, label: { bn: "প্রসেসিং", en: "Processing" } },
  shipped: { color: "bg-purple-500", icon: <Truck className="h-4 w-4" />, label: { bn: "শিপড", en: "Shipped" } },
};

const paymentMethodLabels: Record<string, { bn: string; en: string }> = {
  cod: { bn: "ক্যাশ অন ডেলিভারি", en: "Cash on Delivery" },
  bkash: { bn: "বিকাশ", en: "bKash" },
  nagad: { bn: "নগদ", en: "Nagad" },
  rocket: { bn: "রকেট", en: "Rocket" },
  bank: { bn: "ব্যাংক ট্রান্সফার", en: "Bank Transfer" },
};

export default function AdminIncompleteOrders() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const lang = language;
  const t = (bnText: string, enText: string) => lang === "bn" ? bnText : enText;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("orders")
        .select("*")
        .in("status", ["pending", "processing", "shipped"])
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      toast.error(t("ডাটা লোড করতে সমস্যা হয়েছে", "Failed to load data"));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const fetchOrderItems = async (orderId: string) => {
    setDetailsLoading(true);
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);
      if (error) throw error;
      setOrderItems(data || []);
    } catch {
      toast.error(t("পণ্য লোড করতে সমস্যা", "Failed to load items"));
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    fetchOrderItems(order.id);
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(q) ||
      order.customer_name.toLowerCase().includes(q) ||
      order.customer_phone.includes(q)
    );
  });

  const pendingCount = orders.filter(o => o.status === "pending").length;
  const processingCount = orders.filter(o => o.status === "processing").length;
  const shippedCount = orders.filter(o => o.status === "shipped").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("ইনকমপ্লিট অর্ডার", "Incomplete Orders")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("যেসব অর্ডার এখনো সম্পন্ন হয়নি", "Orders that are not yet completed")}
            </p>
          </div>
          <Button onClick={fetchOrders} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            {t("রিফ্রেশ", "Refresh")}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("পেন্ডিং", "Pending")}</p>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("প্রসেসিং", "Processing")}</p>
                <p className="text-2xl font-bold text-foreground">{processingCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-500/30 bg-purple-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("শিপড", "Shipped")}</p>
                <p className="text-2xl font-bold text-foreground">{shippedCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("অর্ডার নম্বর, নাম বা ফোন...", "Order number, name or phone...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t("স্ট্যাটাস ফিল্টার", "Filter Status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("সকল ইনকমপ্লিট", "All Incomplete")}</SelectItem>
              <SelectItem value="pending">{t("পেন্ডিং", "Pending")}</SelectItem>
              <SelectItem value="processing">{t("প্রসেসিং", "Processing")}</SelectItem>
              <SelectItem value="shipped">{t("শিপড", "Shipped")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <AlertTriangle className="h-10 w-10 mb-3" />
                <p>{t("কোনো ইনকমপ্লিট অর্ডার নেই", "No incomplete orders found")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("অর্ডার নং", "Order No.")}</TableHead>
                      <TableHead>{t("কাস্টমার", "Customer")}</TableHead>
                      <TableHead className="hidden md:table-cell">{t("ফোন", "Phone")}</TableHead>
                      <TableHead>{t("মোট", "Total")}</TableHead>
                      <TableHead>{t("পেমেন্ট", "Payment")}</TableHead>
                      <TableHead>{t("স্ট্যাটাস", "Status")}</TableHead>
                      <TableHead className="hidden md:table-cell">{t("তারিখ", "Date")}</TableHead>
                      <TableHead className="text-right">{t("অ্যাকশন", "Action")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const sc = statusConfig[order.status];
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium text-xs">{order.order_number}</TableCell>
                          <TableCell className="text-sm">{order.customer_name}</TableCell>
                          <TableCell className="hidden md:table-cell text-sm">{order.customer_phone}</TableCell>
                          <TableCell className="font-semibold text-sm">{formatPrice(order.total_amount)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {paymentMethodLabels[order.payment_method]?.[lang] || order.payment_method}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {sc && (
                              <Badge className={cn("text-white text-xs", sc.color)}>
                                {sc.icon}
                                <span className="ml-1">{sc.label[lang]}</span>
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                            {format(new Date(order.created_at), "dd MMM yyyy", { locale: lang === "bn" ? bn : undefined })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => handleViewOrder(order)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {selectedOrder && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    {t("অর্ডার বিবরণ", "Order Details")} - {selectedOrder.order_number}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  {/* Status & Payment */}
                  <div className="flex flex-wrap gap-2">
                    {statusConfig[selectedOrder.status] && (
                      <Badge className={cn("text-white", statusConfig[selectedOrder.status].color)}>
                        {statusConfig[selectedOrder.status].icon}
                        <span className="ml-1">{statusConfig[selectedOrder.status].label[lang]}</span>
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {paymentMethodLabels[selectedOrder.payment_method]?.[lang] || selectedOrder.payment_method}
                    </Badge>
                    <Badge variant={selectedOrder.payment_status === "paid" ? "default" : "secondary"}>
                      {selectedOrder.payment_status === "paid" ? t("পেইড", "Paid") : t("আনপেইড", "Unpaid")}
                    </Badge>
                  </div>

                  <Separator />

                  {/* Customer Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{t("কাস্টমার", "Customer")}</p>
                      <p className="font-medium text-sm">{selectedOrder.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Phone className="h-3 w-3" />{t("ফোন", "Phone")}</p>
                      <p className="text-sm">{selectedOrder.customer_phone}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{t("ঠিকানা", "Address")}</p>
                      <p className="text-sm">{selectedOrder.shipping_address}</p>
                      {(selectedOrder.upazila || selectedOrder.district || selectedOrder.division) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {[selectedOrder.upazila, selectedOrder.district, selectedOrder.division].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                    {selectedOrder.transaction_id && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{t("ট্রানজেকশন আইডি", "Transaction ID")}</p>
                        <p className="text-sm font-mono">{selectedOrder.transaction_id}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{t("অর্ডারের তারিখ", "Order Date")}</p>
                      <p className="text-sm">
                        {format(new Date(selectedOrder.created_at), "dd MMM yyyy, hh:mm a", { locale: lang === "bn" ? bn : undefined })}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold text-sm mb-2">{t("পণ্য তালিকা", "Product List")}</h3>
                    {detailsLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {orderItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                            {item.product_image && (
                              <img src={item.product_image} alt={item.product_name} className="w-10 h-10 rounded object-cover" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.product_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatPrice(item.unit_price)} × {item.quantity}
                                {item.discount_percentage ? ` (-${item.discount_percentage}%)` : ""}
                              </p>
                            </div>
                            <p className="text-sm font-semibold">{formatPrice(item.total_price)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Price Summary */}
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("সাবটোটাল", "Subtotal")}</span>
                      <span>{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("ডেলিভারি চার্জ", "Delivery Charge")}</span>
                      <span>{formatPrice(selectedOrder.shipping_cost)}</span>
                    </div>
                    {selectedOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>{t("ডিসকাউন্ট", "Discount")}</span>
                        <span>-{formatPrice(selectedOrder.discount_amount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-base">
                      <span>{t("মোট", "Total")}</span>
                      <span className="text-primary">{formatPrice(selectedOrder.total_amount)}</span>
                    </div>
                  </div>

                  {selectedOrder.notes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{t("নোট", "Notes")}</p>
                        <p className="text-sm bg-muted/50 p-2 rounded">{selectedOrder.notes}</p>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
