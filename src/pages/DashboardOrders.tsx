/**
 * Dashboard Orders Page - Customer Order History
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { apiClient } from "@/lib/api-client";
import type { Order } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Package,
  Eye,
  Loader2,
  ShoppingBag,
  Calendar,
  MapPin,
  Phone,
  XCircle,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { ShipmentTrackingDisplay } from "@/components/ShipmentTrackingDisplay";
import { InvoiceDownloadButton } from "@/components/InvoiceDownloadButton";

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: { bn: string; en: string } }> = {
  pending: { color: "bg-yellow-500", icon: <Clock className="h-4 w-4" />, label: { bn: "পেন্ডিং", en: "Pending" } },
  processing: { color: "bg-blue-500", icon: <Package className="h-4 w-4" />, label: { bn: "প্রসেসিং", en: "Processing" } },
  shipped: { color: "bg-purple-500", icon: <Truck className="h-4 w-4" />, label: { bn: "শিপড", en: "Shipped" } },
  delivered: { color: "bg-green-500", icon: <CheckCircle className="h-4 w-4" />, label: { bn: "ডেলিভারড", en: "Delivered" } },
  cancelled: { color: "bg-red-500", icon: <XCircle className="h-4 w-4" />, label: { bn: "বাতিল", en: "Cancelled" } },
  refunded: { color: "bg-gray-500", icon: <AlertCircle className="h-4 w-4" />, label: { bn: "রিফান্ড", en: "Refunded" } },
};

const DashboardOrders = () => {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const translations = {
    myOrders: language === "bn" ? "আমার অর্ডার" : "My Orders",
    orderNumber: language === "bn" ? "অর্ডার নম্বর" : "Order Number",
    date: language === "bn" ? "তারিখ" : "Date",
    status: language === "bn" ? "স্ট্যাটাস" : "Status",
    total: language === "bn" ? "মোট" : "Total",
    actions: language === "bn" ? "অ্যাকশন" : "Actions",
    viewDetails: language === "bn" ? "বিস্তারিত" : "Details",
    cancelOrder: language === "bn" ? "বাতিল করুন" : "Cancel",
    noOrders: language === "bn" ? "কোন অর্ডার নেই" : "No orders found",
    shopNow: language === "bn" ? "এখনই শপিং করুন" : "Shop Now",
    orderDetails: language === "bn" ? "অর্ডার বিস্তারিত" : "Order Details",
    shippingAddress: language === "bn" ? "শিপিং ঠিকানা" : "Shipping Address",
    items: language === "bn" ? "পণ্যসমূহ" : "Items",
    subtotal: language === "bn" ? "সাবটোটাল" : "Subtotal",
    shipping: language === "bn" ? "ডেলিভারি" : "Shipping",
    free: language === "bn" ? "ফ্রি" : "Free",
    confirmCancel: language === "bn" ? "আপনি কি নিশ্চিত এই অর্ডার বাতিল করতে চান?" : "Are you sure you want to cancel this order?",
    paymentInfo: language === "bn" ? "পেমেন্ট তথ্য" : "Payment Info",
    paymentMethod: language === "bn" ? "পেমেন্ট পদ্ধতি" : "Payment Method",
    paymentStatus: language === "bn" ? "পেমেন্ট স্ট্যাটাস" : "Payment Status",
    trxId: language === "bn" ? "ট্রানজেকশন আইডি" : "Transaction ID",
    verificationPending: language === "bn" ? "ভেরিফিকেশন পেন্ডিং" : "Verification Pending",
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getOrders({ limit: 50 });
      if (response.data?.orders) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error(language === "bn" ? "অর্ডার লোড করতে সমস্যা হয়েছে" : "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleViewDetails = async (orderId: number) => {
    try {
      const response = await apiClient.getOrder(String(orderId));
      if (response.data?.order) {
        setSelectedOrder(response.data.order);
        setIsDetailsOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm(translations.confirmCancel)) return;
    
    setIsCancelling(true);
    try {
      const response = await apiClient.cancelOrder(String(orderId));
      if (response.error) {
        toast.error(response.error);
        return;
      }
      toast.success(language === "bn" ? "অর্ডার বাতিল হয়েছে" : "Order cancelled");
      fetchOrders();
      setIsDetailsOpen(false);
    } catch (error) {
      console.error("Failed to cancel order:", error);
      toast.error(language === "bn" ? "অর্ডার বাতিল করতে সমস্যা হয়েছে" : "Failed to cancel order");
    } finally {
      setIsCancelling(false);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            {translations.myOrders}
          </h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{translations.noOrders}</h3>
              <Button asChild className="mt-4">
                <Link to="/shop">{translations.shopNow}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{translations.orderNumber}</TableHead>
                    <TableHead>{translations.date}</TableHead>
                    <TableHead>{translations.status}</TableHead>
                    <TableHead>{translations.total}</TableHead>
                    <TableHead className="text-right">{translations.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="font-semibold">{formatPrice(order.total_amount)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(order.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.status === 'pending' && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={isCancelling}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {translations.orderDetails}
              </DialogTitle>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{translations.orderNumber}</p>
                    <p className="font-semibold">{selectedOrder.order_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{translations.status}</p>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{translations.date}</p>
                    <p className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(selectedOrder.created_at).toLocaleString(language === "bn" ? "bn-BD" : "en-US")}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Shipping Address */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
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

                <Separator />

                {/* Payment Info */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    {translations.paymentInfo}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{translations.paymentMethod}</p>
                      <p className="font-medium capitalize">
                        {selectedOrder.payment_method === 'cod' ? (language === "bn" ? "ক্যাশ অন ডেলিভারি" : "Cash on Delivery") : selectedOrder.payment_method}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{translations.paymentStatus}</p>
                      <Badge variant={
                        selectedOrder.payment_status === 'paid' ? 'default' : 
                        selectedOrder.payment_status === 'verification_pending' ? 'outline' : 
                        'secondary'
                      }>
                        {selectedOrder.payment_status === 'verification_pending' 
                          ? translations.verificationPending
                          : selectedOrder.payment_status}
                      </Badge>
                    </div>
                    {selectedOrder.payment_trx_id && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">{translations.trxId}</p>
                        <p className="font-mono font-medium">{selectedOrder.payment_trx_id}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Shipment Tracking */}
                {(selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered' || selectedOrder.courier_name || selectedOrder.tracking_number) && (
                  <>
                    <ShipmentTrackingDisplay order={selectedOrder} />
                    <Separator />
                  </>
                )}

                {/* Items */}
                <div>
                  <h4 className="font-semibold mb-3">{translations.items}</h4>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                          {item.product_image ? (
                            <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(item.unit_price * (1 - item.discount_percentage / 100))} × {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-sm">{formatPrice(item.total_price)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{translations.subtotal}</span>
                    <span>{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{translations.shipping}</span>
                    <span className="text-primary">
                      {selectedOrder.shipping_cost > 0 ? formatPrice(selectedOrder.shipping_cost) : translations.free}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>{translations.total}</span>
                    <span className="text-primary">{formatPrice(selectedOrder.total_amount)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {/* Invoice Download */}
                  <InvoiceDownloadButton order={selectedOrder} className="flex-1" />
                  
                  {/* Cancel Button */}
                  {selectedOrder.status === 'pending' && (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                      disabled={isCancelling}
                    >
                      {isCancelling ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      {translations.cancelOrder}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default DashboardOrders;
