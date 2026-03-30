import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SeoHead from "@/components/SeoHead";
import {
  Search, Package, Truck, CheckCircle, Clock, XCircle,
  MapPin, CreditCard, Calendar, ShoppingBag, Loader2
} from "lucide-react";
import { toast } from "sonner";

interface TrackingResult {
  order: {
    order_number: string;
    customer_name: string;
    status: string;
    payment_method: string;
    payment_status: string;
    total_amount: number;
    shipping_cost: number;
    created_at: string;
    updated_at: string;
  };
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_image: string | null;
  }>;
  tracking: {
    consignment_id: string | null;
    tracking_code: string | null;
    status: string | null;
    delivery_status: string | null;
    created_at: string;
  } | null;
}

const statusConfig: Record<string, { label: string; labelBn: string; icon: typeof Clock; color: string }> = {
  pending: { label: "Pending", labelBn: "অপেক্ষমাণ", icon: Clock, color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  processing: { label: "Processing", labelBn: "প্রসেসিং", icon: Package, color: "bg-blue-100 text-blue-800 border-blue-300" },
  shipped: { label: "Shipped", labelBn: "শিপড", icon: Truck, color: "bg-purple-100 text-purple-800 border-purple-300" },
  delivered: { label: "Delivered", labelBn: "ডেলিভারড", icon: CheckCircle, color: "bg-green-100 text-green-800 border-green-300" },
  cancelled: { label: "Cancelled", labelBn: "বাতিল", icon: XCircle, color: "bg-red-100 text-red-800 border-red-300" },
  on_hold: { label: "On Hold", labelBn: "হোল্ড", icon: Clock, color: "bg-orange-100 text-orange-800 border-orange-300" },
  partial_delivered: { label: "Partial Delivered", labelBn: "আংশিক ডেলিভারড", icon: Package, color: "bg-teal-100 text-teal-800 border-teal-300" },
};

const statusSteps = ["pending", "processing", "shipped", "delivered"];

const TrackOrder = () => {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState("");

  const t = {
    title: language === "bn" ? "অর্ডার ট্র্যাকিং" : "Track Your Order",
    subtitle: language === "bn" ? "অর্ডার নম্বর ও ফোন নম্বর দিয়ে আপনার অর্ডারের স্ট্যাটাস জানুন" : "Enter your order number and phone to check status",
    orderNumber: language === "bn" ? "অর্ডার নম্বর" : "Order Number",
    phone: language === "bn" ? "ফোন নম্বর" : "Phone Number",
    track: language === "bn" ? "ট্র্যাক করুন" : "Track Order",
    orderDetails: language === "bn" ? "অর্ডার বিবরণ" : "Order Details",
    items: language === "bn" ? "পণ্যসমূহ" : "Items",
    trackingInfo: language === "bn" ? "কুরিয়ার ট্র্যাকিং" : "Courier Tracking",
    orderDate: language === "bn" ? "অর্ডারের তারিখ" : "Order Date",
    total: language === "bn" ? "মোট" : "Total",
    shipping: language === "bn" ? "ডেলিভারি চার্জ" : "Shipping",
    payment: language === "bn" ? "পেমেন্ট" : "Payment",
    trackingCode: language === "bn" ? "ট্র্যাকিং কোড" : "Tracking Code",
    courierStatus: language === "bn" ? "কুরিয়ার স্ট্যাটাস" : "Courier Status",
    noTracking: language === "bn" ? "কুরিয়ার তথ্য এখনো যোগ হয়নি" : "Courier info not yet available",
    placeholder_order: "ORD-20260223-0001",
    placeholder_phone: "01XXXXXXXXX",
    cancelOrder: language === "bn" ? "অর্ডার বাতিল করুন" : "Cancel Order",
    confirmCancel: language === "bn" ? "আপনি কি নিশ্চিত এই অর্ডার বাতিল করতে চান?" : "Are you sure you want to cancel this order?",
    cancelSuccess: language === "bn" ? "অর্ডার সফলভাবে বাতিল করা হয়েছে" : "Order cancelled successfully",
  };

  const handleTrack = async () => {
    if (!orderNumber.trim() || !phone.trim()) {
      toast.error(language === "bn" ? "অর্ডার নম্বর ও ফোন নম্বর দিন" : "Enter order number and phone");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/track-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_number: orderNumber.trim(), phone: phone.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setResult(data);
    } catch {
      setError(language === "bn" ? "সার্ভারে সমস্যা হয়েছে" : "Server error");
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentStep = (status: string) => {
    const idx = statusSteps.indexOf(status);
    return idx >= 0 ? idx : (status === "cancelled" ? -1 : 1);
  };

  const handleCancelOrder = async () => {
    if (!result || !confirm(t.confirmCancel)) return;
    setIsCancelling(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/track-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_number: orderNumber.trim(), phone: phone.trim(), action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Cancel failed");
      } else {
        toast.success(t.cancelSuccess);
        // Refresh tracking result
        handleTrack();
      }
    } catch {
      toast.error(language === "bn" ? "বাতিল করতে সমস্যা হয়েছে" : "Failed to cancel");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title={language === "bn" ? "অর্ডার ট্র্যাকিং - FishCare BD" : "Track Order - FishCare BD"}
        description={language === "bn" ? "আপনার অর্ডারের ডেলিভারি স্ট্যাটাস ট্র্যাক করুন" : "Track your order delivery status"}
      />
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Search Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Truck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder={t.placeholder_order}
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                  className="text-center font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1 text-center">{t.orderNumber}</p>
              </div>
              <div className="flex-1">
                <Input
                  placeholder={t.placeholder_phone}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-center"
                  type="tel"
                />
                <p className="text-xs text-muted-foreground mt-1 text-center">{t.phone}</p>
              </div>
              <Button onClick={handleTrack} disabled={isLoading} className="sm:self-start">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                {t.track}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive/50 bg-destructive/5 mb-6">
            <CardContent className="pt-6 text-center">
              <XCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
              <p className="text-destructive font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4">
            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  {result.order.order_number}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.order.status === "cancelled" ? (
                  <div className="text-center py-4">
                    <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
                    <p className="text-lg font-semibold text-destructive">
                      {language === "bn" ? "অর্ডার বাতিল হয়েছে" : "Order Cancelled"}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mb-6">
                    {statusSteps.map((step, i) => {
                      const currentStep = getCurrentStep(result.order.status);
                      const isActive = i <= currentStep;
                      const cfg = statusConfig[step];
                      const Icon = cfg?.icon || Clock;
                      return (
                        <div key={step} className="flex items-center flex-1">
                          <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className={`text-xs mt-1 text-center ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                              {language === "bn" ? cfg?.labelBn : cfg?.label}
                            </span>
                          </div>
                          {i < statusSteps.length - 1 && (
                            <div className={`flex-1 h-1 mx-1 rounded ${i < currentStep ? 'bg-primary' : 'bg-muted'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Order Info Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">{t.orderDate}</p>
                      <p className="font-medium">
                        {new Date(result.order.created_at).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">{t.payment}</p>
                      <p className="font-medium capitalize">{result.order.payment_method}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">{t.total}</p>
                      <p className="font-bold text-primary">{formatPrice(result.order.total_amount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">{t.shipping}</p>
                      <p className="font-medium">{formatPrice(result.order.shipping_cost)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            {result.items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.items}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        {item.product_image && (
                          <img src={item.product_image} alt={item.product_name} className="w-12 h-12 rounded object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(item.unit_price)} × {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold">{formatPrice(item.total_price)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Courier Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {t.trackingInfo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.tracking ? (
                  <div className="space-y-3">
                    {result.tracking.tracking_code && (
                      <div>
                        <p className="text-xs text-muted-foreground">{t.trackingCode}</p>
                        <p className="font-mono font-bold text-lg">{result.tracking.tracking_code}</p>
                      </div>
                    )}
                    {result.tracking.consignment_id && (
                      <div>
                        <p className="text-xs text-muted-foreground">Consignment ID</p>
                        <p className="font-mono">{result.tracking.consignment_id}</p>
                      </div>
                    )}
                    {(result.tracking.status || result.tracking.delivery_status) && (
                      <div>
                        <p className="text-xs text-muted-foreground">{t.courierStatus}</p>
                        <Badge variant="outline" className="mt-1">
                          {result.tracking.delivery_status || result.tracking.status}
                        </Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>{t.noTracking}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default TrackOrder;
