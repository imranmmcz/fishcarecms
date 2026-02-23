/**
 * Dashboard Orders Page - Customer Order History with Supabase
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders, Order } from "@/hooks/useOrders";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  PlusCircle,
  FileDown,
  Printer,
} from "lucide-react";
import { generateInvoicePDF } from "@/lib/generateInvoicePDF";
import { useInvoiceSettings } from "@/hooks/useInvoiceSettings";
import type { Order as ApiOrder } from "@/lib/api-client";

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
  const { isFarmer, user } = useAuth();
  const { orders, isLoading, getOrder, cancelOrder, refetch } = useOrders();
  const { settings: companySettings } = useInvoiceSettings();
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
    addToExpense: language === "bn" ? "পুকুরের খরচে যোগ করুন" : "Add to Pond Expense",
    addedToExpense: language === "bn" ? "পুকুরের খরচে যোগ করা হয়েছে!" : "Added to pond expense!",
    invoice: language === "bn" ? "ইনভয়েস" : "Invoice",
    print: language === "bn" ? "প্রিন্ট" : "Print",
  };

  // Convert useOrders Order to api-client Order for invoice generation
  const toApiOrder = (order: Order): ApiOrder => ({
    id: 0,
    order_number: order.order_number,
    user_id: 0,
    status: order.status as ApiOrder['status'],
    payment_status: order.payment_status as ApiOrder['payment_status'],
    payment_method: order.payment_method,
    payment_trx_id: order.transaction_id,
    payment_sender_number: order.sender_number,
    subtotal: order.subtotal,
    shipping_cost: order.shipping_cost,
    discount_amount: order.discount_amount,
    total_amount: order.total_amount,
    shipping_name: order.customer_name,
    shipping_mobile: order.customer_phone,
    shipping_division: order.division,
    shipping_district: order.district,
    shipping_upazila: order.upazila,
    shipping_address: order.shipping_address,
    customer_note: order.notes,
    admin_note: null,
    created_at: order.created_at,
    updated_at: order.updated_at,
    shipped_at: null,
    delivered_at: null,
    courier_name: null,
    tracking_number: null,
    tracking_url: null,
    estimated_delivery: null,
    items: order.items?.map(item => ({
      id: 0,
      order_id: 0,
      product_id: 0,
      product_name: item.product_name,
      product_image: item.product_image,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percentage: item.discount_percentage,
      total_price: item.total_price,
    })),
  });

  const handlePrintInvoice = (order: Order) => {
    const apiOrder = toApiOrder(order);
    generateInvoicePDF(apiOrder, { language });
  };

  const handleViewDetails = async (orderId: string) => {
    const order = await getOrder(orderId);
    if (order) {
      setSelectedOrder(order);
      setIsDetailsOpen(true);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm(translations.confirmCancel)) return;
    
    setIsCancelling(true);
    const success = await cancelOrder(orderId);
    if (success) {
      refetch();
      setIsDetailsOpen(false);
    }
    setIsCancelling(false);
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
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {selectedOrder.customer_phone}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {[selectedOrder.shipping_address, selectedOrder.upazila, selectedOrder.district, selectedOrder.division]
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
                    {selectedOrder.transaction_id && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">{translations.trxId}</p>
                        <p className="font-mono font-medium">{selectedOrder.transaction_id}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

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
                <div className="flex flex-wrap gap-3">
                  {/* Invoice Download - Customer Copy */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      const apiOrder = toApiOrder(selectedOrder);
                      generateInvoicePDF(apiOrder, { language, copyType: "customer", ...companySettings });
                    }}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    {language === "bn" ? "কাস্টমার কপি" : "Customer Copy"}
                  </Button>

                  {/* Add to Pond Expense - Farmer only */}
                  {isFarmer && selectedOrder.status === 'delivered' && (
                    <Button
                      variant="outline"
                      onClick={async () => {
                        if (!user) return;
                        try {
                          // Check existing expenses via API (simplified - just add)
                          const res = await apiClient.createExpense({
                            user_id: user.id,
                            date: new Date(selectedOrder.created_at).toISOString().split('T')[0],
                            category: language === "bn" ? "অর্ডার কেনাকাটা" : "Order Purchase",
                            amount: selectedOrder.total_amount,
                            description: `${language === "bn" ? "অর্ডার" : "Order"} #${selectedOrder.order_number}`,
                            pond_name: "",
                          });
                          
                          if (res.error) {
                            toast.error(language === "bn" ? "খরচ যোগ করতে ব্যর্থ" : "Failed to add expense");
                          } else {
                            toast.success(translations.addedToExpense);
                          }
                        } catch {
                          toast.error(language === "bn" ? "খরচ যোগ করতে ব্যর্থ" : "Failed to add expense");
                        }
                      }}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {translations.addToExpense}
                    </Button>
                  )}

                  {/* Cancel Button */}
                  {selectedOrder.status === 'pending' && (
                    <Button
                      variant="destructive"
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
