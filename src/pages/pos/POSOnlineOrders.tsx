import { useState, useEffect, useCallback } from "react";
import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Globe, Search, Eye, Loader2, ShoppingCart, Clock, Truck, CheckCircle2, XCircle, Package, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; icon: any; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "পেন্ডিং", icon: Clock, variant: "secondary" },
  processing: { label: "প্রসেসিং", icon: Loader2, variant: "outline" },
  shipped: { label: "শিপড", icon: Truck, variant: "outline" },
  delivered: { label: "ডেলিভার্ড", icon: CheckCircle2, variant: "default" },
  cancelled: { label: "বাতিল", icon: XCircle, variant: "destructive" },
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

export default function POSOnlineOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // View modal
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching online orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel("pos-online-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  const fetchOrderItems = async (orderId: string) => {
    setLoadingItems(true);
    const { data } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at");
    setOrderItems(data || []);
    setLoadingItems(false);
  };

  const handleView = async (order: any) => {
    setSelectedOrder(order);
    setViewOpen(true);
    await fetchOrderItems(order.id);
  };

  const getDateRange = (filter: string): { start: Date; end: Date } | null => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (filter) {
      case "today":
        return { start: today, end: now };
      case "yesterday": {
        const y = new Date(today); y.setDate(y.getDate() - 1);
        return { start: y, end: today };
      }
      case "last7":
        return { start: new Date(today.getTime() - 7 * 86400000), end: now };
      case "last30":
        return { start: new Date(today.getTime() - 30 * 86400000), end: now };
      case "thisMonth":
        return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
      case "lastMonth": {
        const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const e = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: s, end: e };
      }
      default: return null;
    }
  };

  const filtered = orders.filter(o => {
    const matchesSearch =
      (o.order_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_phone || "").includes(search);
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || o.payment_status === paymentFilter;
    const dateRange = getDateRange(dateFilter);
    const matchesDate = !dateRange || (() => {
      const d = new Date(o.created_at);
      return d >= dateRange.start && d <= dateRange.end;
    })();
    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  // Stats
  const totalOrders = filtered.length;
  const totalAmount = filtered.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const paidOrders = filtered.filter(o => o.payment_status === "paid").length;
  const pendingOrders = filtered.filter(o => o.status === "pending").length;

  return (
    <POSLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Globe className="h-6 w-6 text-emerald-500" /> অনলাইন অর্ডার
          </h1>
          <p className="text-muted-foreground text-sm">ওয়েবসাইটের মাধ্যমে প্রাপ্ত সকল অর্ডার</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "মোট অর্ডার", value: totalOrders, icon: ShoppingCart },
            { label: "মোট টাকা", value: `৳${totalAmount.toLocaleString("en-IN")}`, icon: Package },
            { label: "পেইড", value: paidOrders, icon: CheckCircle2 },
            { label: "পেন্ডিং", value: pendingOrders, icon: Clock },
          ].map((stat, i) => (
            <Card key={i} className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <stat.icon className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-lg font-bold text-foreground mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="অর্ডার নং, কাস্টমার নাম বা ফোন..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] sm:w-[150px]">
              <SelectValue placeholder="স্ট্যাটাস" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল স্ট্যাটাস</SelectItem>
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-[120px] sm:w-[150px]">
              <SelectValue placeholder="পেমেন্ট" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল পেমেন্ট</SelectItem>
              <SelectItem value="paid">পেইড</SelectItem>
              <SelectItem value="pending">পেন্ডিং</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[140px] sm:w-[160px]">
              <CalendarDays className="h-4 w-4 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="তারিখ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল তারিখ</SelectItem>
              <SelectItem value="today">আজ</SelectItem>
              <SelectItem value="yesterday">গতকাল</SelectItem>
              <SelectItem value="last7">গত ৭ দিন</SelectItem>
              <SelectItem value="last30">গত ৩০ দিন</SelectItem>
              <SelectItem value="thisMonth">এই মাস</SelectItem>
              <SelectItem value="lastMonth">গত মাস</SelectItem>
            </SelectContent>
          </Select>
          </div>
        </div>

        {/* Orders Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">কোনো অনলাইন অর্ডার পাওয়া যায়নি</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>অর্ডার নং</TableHead>
                    <TableHead>কাস্টমার</TableHead>
                    <TableHead>ফোন</TableHead>
                    <TableHead className="text-right">মোট টাকা</TableHead>
                    <TableHead>পেমেন্ট</TableHead>
                    <TableHead>স্ট্যাটাস</TableHead>
                    <TableHead>তারিখ</TableHead>
                    <TableHead className="text-center">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(order => {
                    const sCfg = statusConfig[order.status] || statusConfig.pending;
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs font-medium">{order.order_number}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell className="text-xs">{order.customer_phone}</TableCell>
                        <TableCell className="text-right font-bold">৳{Number(order.total_amount).toLocaleString("en-IN")}</TableCell>
                        <TableCell>
                          <Badge variant={order.payment_status === "paid" ? "default" : "secondary"} className="text-xs">
                            {order.payment_status === "paid" ? "পেইড" : "পেন্ডিং"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sCfg.variant} className="text-xs">
                            {sCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), "dd/MM/yy hh:mm a")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(order)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Order Detail Modal */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" /> অর্ডার বিস্তারিত
            </DialogTitle>
            <DialogDescription>{selectedOrder?.order_number}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">কাস্টমার:</span> <span className="font-medium">{selectedOrder.customer_name}</span></div>
                <div><span className="text-muted-foreground">ফোন:</span> <span className="font-medium">{selectedOrder.customer_phone}</span></div>
                <div><span className="text-muted-foreground">ইমেইল:</span> <span className="font-medium">{selectedOrder.customer_email || "-"}</span></div>
                <div><span className="text-muted-foreground">পেমেন্ট:</span> <Badge variant="outline">{selectedOrder.payment_method}</Badge></div>
                <div className="col-span-2"><span className="text-muted-foreground">ঠিকানা:</span> <span className="font-medium">{selectedOrder.shipping_address}</span></div>
                {selectedOrder.division && (
                  <div><span className="text-muted-foreground">বিভাগ:</span> <span className="font-medium">{selectedOrder.division}</span></div>
                )}
                {selectedOrder.district && (
                  <div><span className="text-muted-foreground">জেলা:</span> <span className="font-medium">{selectedOrder.district}</span></div>
                )}
              </div>

              <Separator />

              {loadingItems ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>পণ্য</TableHead>
                      <TableHead className="text-center">পরিমাণ</TableHead>
                      <TableHead className="text-right">দাম</TableHead>
                      <TableHead className="text-right">মোট</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2">
                            {item.product_image && (
                              <img src={item.product_image} alt="" className="h-8 w-8 rounded object-cover" />
                            )}
                            {item.product_name}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">৳{item.unit_price}</TableCell>
                        <TableCell className="text-right font-medium">৳{item.total_price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>সাবটোটাল</span><span>৳{selectedOrder.subtotal}</span></div>
                <div className="flex justify-between"><span>ডেলিভারি চার্জ</span><span>৳{selectedOrder.shipping_cost}</span></div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-destructive"><span>ডিসকাউন্ট</span><span>-৳{selectedOrder.discount_amount}</span></div>
                )}
                <div className="flex justify-between font-bold text-base"><span>সর্বমোট</span><span>৳{selectedOrder.total_amount}</span></div>
              </div>

              {selectedOrder.notes && (
                <>
                  <Separator />
                  <div className="text-sm"><span className="text-muted-foreground">নোট:</span> {selectedOrder.notes}</div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </POSLayout>
  );
}
