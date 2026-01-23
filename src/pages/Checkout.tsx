/**
 * Checkout Page - Order Placement
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContextMySQL";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { divisions, districtsByDivision, upazilasByDistrict } from "@/data/bangladeshLocationData";
import {
  ShoppingBag,
  CreditCard,
  Truck,
  MapPin,
  Loader2,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    shipping_name: user?.full_name || "",
    shipping_mobile: user?.mobile || "",
    shipping_division: user?.division || "",
    shipping_district: user?.district || "",
    shipping_upazila: user?.upazila || "",
    shipping_address: user?.village || "",
    payment_method: "cod",
    customer_note: "",
  });

  const districts = formData.shipping_division 
    ? districtsByDivision[formData.shipping_division] || []
    : [];
  const upazilas = formData.shipping_district 
    ? upazilasByDistrict[formData.shipping_district] || []
    : [];

  const shippingCost = 0; // Free shipping
  const total = subtotal + shippingCost;

  const translations = {
    checkout: language === "bn" ? "চেকআউট" : "Checkout",
    orderSummary: language === "bn" ? "অর্ডার সামারি" : "Order Summary",
    shippingInfo: language === "bn" ? "শিপিং তথ্য" : "Shipping Information",
    paymentMethod: language === "bn" ? "পেমেন্ট পদ্ধতি" : "Payment Method",
    name: language === "bn" ? "নাম" : "Name",
    mobile: language === "bn" ? "মোবাইল" : "Mobile",
    division: language === "bn" ? "বিভাগ" : "Division",
    district: language === "bn" ? "জেলা" : "District",
    upazila: language === "bn" ? "উপজেলা" : "Upazila",
    address: language === "bn" ? "বিস্তারিত ঠিকানা" : "Full Address",
    note: language === "bn" ? "অর্ডার নোট (ঐচ্ছিক)" : "Order Note (Optional)",
    cod: language === "bn" ? "ক্যাশ অন ডেলিভারি" : "Cash on Delivery",
    bkash: language === "bn" ? "বিকাশ" : "bKash",
    subtotal: language === "bn" ? "সাবটোটাল" : "Subtotal",
    shipping: language === "bn" ? "ডেলিভারি চার্জ" : "Shipping",
    free: language === "bn" ? "ফ্রি" : "Free",
    total: language === "bn" ? "মোট" : "Total",
    placeOrder: language === "bn" ? "অর্ডার কনফার্ম করুন" : "Place Order",
    emptyCart: language === "bn" ? "আপনার কার্ট খালি" : "Your cart is empty",
    loginRequired: language === "bn" ? "অর্ডার করতে লগইন করুন" : "Login to place order",
    login: language === "bn" ? "লগইন" : "Login",
    backToShop: language === "bn" ? "শপে ফিরে যান" : "Back to Shop",
    selectDivision: language === "bn" ? "বিভাগ নির্বাচন করুন" : "Select Division",
    selectDistrict: language === "bn" ? "জেলা নির্বাচন করুন" : "Select District",
    selectUpazila: language === "bn" ? "উপজেলা নির্বাচন করুন" : "Select Upazila",
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Reset dependent fields
      if (field === "shipping_division") {
        updated.shipping_district = "";
        updated.shipping_upazila = "";
      } else if (field === "shipping_district") {
        updated.shipping_upazila = "";
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error(translations.loginRequired);
      navigate("/auth");
      return;
    }

    if (items.length === 0) {
      toast.error(translations.emptyCart);
      return;
    }

    // Validate form
    if (!formData.shipping_name || !formData.shipping_mobile) {
      toast.error(language === "bn" ? "নাম এবং মোবাইল নম্বর প্রয়োজন" : "Name and mobile are required");
      return;
    }

    setIsLoading(true);

    try {
      const orderData = {
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        ...formData,
      };

      const response = await apiClient.createOrder(orderData);

      if (response.error) {
        toast.error(response.error);
        return;
      }

      // Success
      clearCart();
      toast.success(language === "bn" ? "অর্ডার সফল হয়েছে!" : "Order placed successfully!");
      navigate(`/order-confirmation/${response.data?.order?.order_number}`);
    } catch (error) {
      console.error("Order error:", error);
      toast.error(language === "bn" ? "অর্ডার করতে সমস্যা হয়েছে" : "Failed to place order");
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if cart is empty and user navigates directly
  if (items.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h1 className="text-2xl font-bold mb-2">{translations.emptyCart}</h1>
          <Button asChild className="mt-4">
            <Link to="/shop">{translations.backToShop}</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link to="/shop">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {translations.backToShop}
          </Link>
        </Button>

        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <ShoppingBag className="h-8 w-8" />
          {translations.checkout}
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {translations.shippingInfo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{translations.name} *</Label>
                      <Input
                        id="name"
                        value={formData.shipping_name}
                        onChange={(e) => handleInputChange("shipping_name", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile">{translations.mobile} *</Label>
                      <Input
                        id="mobile"
                        type="tel"
                        value={formData.shipping_mobile}
                        onChange={(e) => handleInputChange("shipping_mobile", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{translations.division}</Label>
                      <Select
                        value={formData.shipping_division}
                        onValueChange={(value) => handleInputChange("shipping_division", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={translations.selectDivision} />
                        </SelectTrigger>
                        <SelectContent>
                          {divisions.map((div) => (
                            <SelectItem key={div} value={div}>
                              {div}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{translations.district}</Label>
                      <Select
                        value={formData.shipping_district}
                        onValueChange={(value) => handleInputChange("shipping_district", value)}
                        disabled={!formData.shipping_division}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={translations.selectDistrict} />
                        </SelectTrigger>
                        <SelectContent>
                          {districts.map((dist) => (
                            <SelectItem key={dist} value={dist}>
                              {dist}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{translations.upazila}</Label>
                      <Select
                        value={formData.shipping_upazila}
                        onValueChange={(value) => handleInputChange("shipping_upazila", value)}
                        disabled={!formData.shipping_district}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={translations.selectUpazila} />
                        </SelectTrigger>
                        <SelectContent>
                          {upazilas.map((upa) => (
                            <SelectItem key={upa} value={upa}>
                              {upa}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">{translations.address}</Label>
                    <Textarea
                      id="address"
                      value={formData.shipping_address}
                      onChange={(e) => handleInputChange("shipping_address", e.target.value)}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {translations.paymentMethod}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={formData.payment_method}
                    onValueChange={(value) => handleInputChange("payment_method", value)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer flex items-center gap-3">
                        <Truck className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{translations.cod}</p>
                          <p className="text-sm text-muted-foreground">
                            {language === "bn" ? "পণ্য হাতে পেয়ে পেমেন্ট করুন" : "Pay when you receive the product"}
                          </p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors opacity-50">
                      <RadioGroupItem value="bkash" id="bkash" disabled />
                      <Label htmlFor="bkash" className="flex-1 cursor-pointer">
                        <p className="font-medium">{translations.bkash}</p>
                        <p className="text-sm text-muted-foreground">
                          {language === "bn" ? "শীঘ্রই আসছে" : "Coming soon"}
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Order Note */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="note">{translations.note}</Label>
                    <Textarea
                      id="note"
                      value={formData.customer_note}
                      onChange={(e) => handleInputChange("customer_note", e.target.value)}
                      rows={3}
                      placeholder={language === "bn" ? "অতিরিক্ত নির্দেশনা লিখুন..." : "Any special instructions..."}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>{translations.orderSummary}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {items.map((item) => {
                      const discountedPrice = item.product.price * (1 - (item.product.discount_percentage || 0) / 100);
                      return (
                        <div key={item.product.id} className="flex gap-3">
                          <div className="w-12 h-12 rounded bg-muted flex-shrink-0 overflow-hidden">
                            {item.product.image_url ? (
                              <img
                                src={item.product.image_url}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-1">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatPrice(discountedPrice)} × {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold text-sm">
                            {formatPrice(discountedPrice * item.quantity)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{translations.subtotal}</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{translations.shipping}</span>
                      <span className="text-primary">{translations.free}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>{translations.total}</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                  </div>

                  {/* Submit Button */}
                  {isAuthenticated ? (
                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {language === "bn" ? "প্রসেস হচ্ছে..." : "Processing..."}
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          {translations.placeOrder}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button asChild className="w-full" size="lg">
                      <Link to="/auth">{translations.login}</Link>
                    </Button>
                  )}

                  <p className="text-xs text-center text-muted-foreground">
                    {language === "bn" 
                      ? "অর্ডার কনফার্ম করলে আমাদের শর্তাবলী মেনে নেওয়া হবে"
                      : "By placing order you agree to our terms"
                    }
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default Checkout;
