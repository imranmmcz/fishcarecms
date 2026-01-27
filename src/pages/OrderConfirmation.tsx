/**
 * Order Confirmation Page
 */

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { apiClient } from "@/lib/api-client";
import type { Order } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Package,
  MapPin,
  Phone,
  Calendar,
  Loader2,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { ShipmentTrackingDisplay } from "@/components/ShipmentTrackingDisplay";

const statusConfig: Record<string, { color: string; label: { bn: string; en: string } }> = {
  pending: { color: "bg-yellow-500", label: { bn: "পেন্ডিং", en: "Pending" } },
  processing: { color: "bg-blue-500", label: { bn: "প্রসেসিং", en: "Processing" } },
  shipped: { color: "bg-purple-500", label: { bn: "শিপড", en: "Shipped" } },
  delivered: { color: "bg-green-500", label: { bn: "ডেলিভারড", en: "Delivered" } },
  cancelled: { color: "bg-red-500", label: { bn: "বাতিল", en: "Cancelled" } },
};

const OrderConfirmation = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderNumber) return;
      
      try {
        const response = await apiClient.getOrder(orderNumber);
        if (response.data?.order) {
          setOrder(response.data.order);
        }
      } catch (error) {
        console.error("Failed to fetch order:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber]);

  const translations = {
    orderConfirmed: language === "bn" ? "অর্ডার সফল হয়েছে!" : "Order Confirmed!",
    thankYou: language === "bn" ? "ধন্যবাদ! আপনার অর্ডার সফলভাবে সম্পন্ন হয়েছে।" : "Thank you! Your order has been placed successfully.",
    orderNumber: language === "bn" ? "অর্ডার নম্বর" : "Order Number",
    orderDate: language === "bn" ? "অর্ডার তারিখ" : "Order Date",
    status: language === "bn" ? "স্ট্যাটাস" : "Status",
    shippingAddress: language === "bn" ? "শিপিং ঠিকানা" : "Shipping Address",
    orderDetails: language === "bn" ? "অর্ডার বিবরণ" : "Order Details",
    subtotal: language === "bn" ? "সাবটোটাল" : "Subtotal",
    shipping: language === "bn" ? "ডেলিভারি" : "Shipping",
    total: language === "bn" ? "মোট" : "Total",
    continueShopping: language === "bn" ? "শপিং চালিয়ে যান" : "Continue Shopping",
    viewOrders: language === "bn" ? "অর্ডার দেখুন" : "View Orders",
    orderNotFound: language === "bn" ? "অর্ডার পাওয়া যায়নি" : "Order not found",
    free: language === "bn" ? "ফ্রি" : "Free",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h1 className="text-2xl font-bold mb-4">{translations.orderNotFound}</h1>
          <Button asChild>
            <Link to="/shop">{translations.continueShopping}</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.pending;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8 max-w-4xl">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary mb-4">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{translations.orderConfirmed}</h1>
          <p className="text-muted-foreground">{translations.thankYou}</p>
        </div>

        {/* Order Info Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {translations.orderNumber}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-2xl font-bold text-primary">{order.order_number}</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(order.created_at).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <Badge className={`${status.color} text-white`}>
                {language === "bn" ? status.label.bn : status.label.en}
              </Badge>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {translations.shippingAddress}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{order.shipping_name}</p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                {order.shipping_mobile}
              </p>
              <p className="text-sm text-muted-foreground">
                {[order.shipping_address, order.shipping_upazila, order.shipping_district, order.shipping_division]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Shipment Tracking - Show when available */}
        {(order.status === 'shipped' || order.status === 'delivered' || order.courier_name || order.tracking_number) && (
          <div className="mb-8">
            <ShipmentTrackingDisplay order={order} />
          </div>
        )}

        {/* Order Items */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{translations.orderDetails}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.product_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.unit_price * (1 - item.discount_percentage / 100))} × {item.quantity}
                    </p>
                  </div>
                  <div className="font-semibold">
                    {formatPrice(item.total_price)}
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{translations.subtotal}</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{translations.shipping}</span>
                <span className="text-primary">
                  {order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : translations.free}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>{translations.total}</span>
                <span className="text-primary">{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link to="/shop">{translations.continueShopping}</Link>
          </Button>
          <Button asChild>
            <Link to="/dashboard/orders">
              {translations.viewOrders}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OrderConfirmation;
