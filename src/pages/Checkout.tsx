/**
 * Checkout Page - Order Placement with Supabase
 */

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { usePaymentSettings } from "@/hooks/usePaymentSettings";
import { useDeliverySettings } from "@/hooks/useDeliverySettings";
import { useOrders } from "@/hooks/useOrders";
import { supabase } from "@/integrations/supabase/client";
import { sendOrderConfirmationEmail } from "@/lib/emailService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { usePartnerCode } from "@/hooks/usePartnerCode";
import { getStoredReferral, clearStoredReferral } from "@/components/ReferralCapture";
import { Ticket, X as XIcon } from "lucide-react";
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
  const { user, profile, isLoading: isAuthLoading, signUp } = useAuth();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { settings: paymentSettings, isLoading: isLoadingPayment } = usePaymentSettings();
  const { calculateDeliveryCharge, calculatePartialPayment, settings: deliverySettings } = useDeliverySettings();
  const { createOrder } = useOrders();

  const [isLoading, setIsLoading] = useState(false);
  const [usePartialPayment, setUsePartialPayment] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const { validate: validateCoupon, apply: applyCoupon, clear: clearCoupon, applied: appliedCoupon, isValidating: validatingCoupon } = usePartnerCode();
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [freeShippingByCode, setFreeShippingByCode] = useState(false);
  const [formData, setFormData] = useState({
    shipping_name: "",
    shipping_mobile: "",
    shipping_division: "",
    shipping_district: "",
    shipping_upazila: "",
    shipping_address: "",
    payment_method: "cod",
    customer_note: "",
    payment_trx_id: "",
    payment_sender_number: "",
  });

  // Auto-fill from profile
  useEffect(() => {
    if (user && profile) {
      setFormData(prev => ({
        ...prev,
        shipping_name: prev.shipping_name || user.full_name || "",
        shipping_mobile: prev.shipping_mobile || profile.mobile || "",
        shipping_division: prev.shipping_division || profile.division || "",
        shipping_district: prev.shipping_district || profile.district || "",
        shipping_upazila: prev.shipping_upazila || profile.upazila || "",
        shipping_address: prev.shipping_address || profile.village || "",
      }));
    }
  }, [user, profile]);

  const districts = formData.shipping_division 
    ? districtsByDivision[formData.shipping_division] || []
    : [];
  const upazilas = formData.shipping_district 
    ? upazilasByDistrict[formData.shipping_district] || []
    : [];

  // Calculate total weight from cart items
  const totalWeight = items.reduce((sum, item) => {
    const weight = (item.product as any).weight_kg || 0;
    return sum + weight * item.quantity;
  }, 0);

  // Dynamic delivery charge calculation
  const shippingCost = calculateDeliveryCharge(
    formData.shipping_district,
    subtotal,
    totalWeight,
    formData.payment_method
  );
  const effectiveShipping = freeShippingByCode ? 0 : shippingCost;
  const discountedSubtotal = Math.max(subtotal - referralDiscount, 0);
  const total = discountedSubtotal + effectiveShipping;

  // Check if delivery charge is mandatory for current payment method
  const isDeliveryMandatory = deliverySettings.deliveryChargeMandatory === 'all' ||
    (deliverySettings.deliveryChargeMandatory === 'cod_only' && formData.payment_method === 'cod');

  // Partial payment calculation
  const partialPayment = calculatePartialPayment(total);

  // Auto-apply stored referral from ?ref=
  useEffect(() => {
    const stored = getStoredReferral();
    if (stored && !appliedCoupon && subtotal > 0) {
      setCouponInput(stored);
      validateCoupon(stored, subtotal).then((r) => {
        if (r.valid && r.code) {
          applyCoupon(r.code);
          setReferralDiscount(r.discountAmount || 0);
          setFreeShippingByCode(!!r.freeShipping);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const handleApplyCoupon = async () => {
    const r = await validateCoupon(couponInput, subtotal);
    if (!r.valid) { toast.error(r.error || "Invalid"); return; }
    applyCoupon(r.code!);
    setReferralDiscount(r.discountAmount || 0);
    setFreeShippingByCode(!!r.freeShipping);
    toast.success(language === "bn" ? "কোড প্রয়োগ হয়েছে" : "Code applied");
  };

  const handleClearCoupon = () => {
    clearCoupon();
    setReferralDiscount(0);
    setFreeShippingByCode(false);
    setCouponInput("");
    clearStoredReferral();
  };
  const payableAmount = usePartialPayment ? partialPayment.advanceAmount : total;
  const dueAmount = usePartialPayment ? partialPayment.dueAmount : 0;
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
    nagad: language === "bn" ? "নগদ" : "Nagad",
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
    trxId: language === "bn" ? "ট্রানজেকশন আইডি (TrxID)" : "Transaction ID (TrxID)",
    senderNumber: language === "bn" ? "প্রেরকের নম্বর" : "Sender Number",
    paymentPending: language === "bn" ? "পেমেন্ট ভেরিফিকেশন পেন্ডিং" : "Payment verification pending",
    sendMoneyTo: language === "bn" ? "টাকা পাঠান এই নম্বরে" : "Send money to",
    afterPayment: language === "bn" ? "টাকা পাঠানোর পর নিচের তথ্য দিন" : "After sending, provide details below",
    guestCheckout: language === "bn" ? "লগইন ছাড়াই অর্ডার করুন" : "Continue as Guest",
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

      // Save checkout form data for abandoned cart tracking
      try {
        sessionStorage.setItem("_checkout_form", JSON.stringify({
          name: updated.shipping_name,
          phone: updated.shipping_mobile,
          division: updated.shipping_division,
          district: updated.shipping_district,
          upazila: updated.shipping_upazila,
          address: updated.shipping_address,
        }));
      } catch {}
      
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error(translations.emptyCart);
      return;
    }

    // Validate form
    if (!formData.shipping_name || !formData.shipping_mobile) {
      toast.error(language === "bn" ? "নাম এবং মোবাইল নম্বর প্রয়োজন" : "Name and mobile are required");
      return;
    }

    // Validate payment details for bKash/Nagad
    if ((formData.payment_method === "bkash" || formData.payment_method === "nagad") && 
        (!formData.payment_trx_id || !formData.payment_sender_number)) {
      toast.error(language === "bn" ? "ট্রানজেকশন আইডি এবং প্রেরকের নম্বর প্রয়োজন" : "Transaction ID and sender number are required");
      return;
    }

    setIsLoading(true);

    try {
      const orderData = {
        items: items.map(item => ({
          product_id: String(item.product.id),
          quantity: item.quantity,
        })),
        shipping_name: formData.shipping_name,
        shipping_mobile: formData.shipping_mobile,
        shipping_division: formData.shipping_division,
        shipping_district: formData.shipping_district,
        shipping_upazila: formData.shipping_upazila,
        shipping_address: formData.shipping_address,
        payment_method: formData.payment_method,
        customer_note: formData.customer_note,
        payment_trx_id: formData.payment_trx_id,
        payment_sender_number: formData.payment_sender_number,
        shipping_cost: effectiveShipping,
        referral_code: appliedCoupon?.code,
        referral_discount: referralDiscount,
        partial_payment: usePartialPayment,
        advance_amount: usePartialPayment ? partialPayment.advanceAmount : undefined,
        due_amount: usePartialPayment ? partialPayment.dueAmount : undefined,
      };

      const { order, error } = await createOrder(orderData);

      if (error) {
        toast.error(error);
        return;
      }

      // Auto-verify payment if bKash/Nagad with TrxID
      if (order && (formData.payment_method === "bkash" || formData.payment_method === "nagad") && formData.payment_trx_id) {
        try {
          toast.info(language === "bn" ? "পেমেন্ট ভেরিফাই করা হচ্ছে..." : "Verifying payment...");
          const { data: verifyResult } = await supabase.functions.invoke("verify-payment", {
            body: {
              order_id: order.id,
              payment_method: formData.payment_method,
              transaction_id: formData.payment_trx_id,
              sender_number: formData.payment_sender_number,
              amount: order.total_amount,
            },
          });

          if (verifyResult?.verified) {
            toast.success(language === "bn" ? "পেমেন্ট সফলভাবে ভেরিফাই হয়েছে!" : "Payment verified successfully!");
          } else {
            toast.info(language === "bn" ? "পেমেন্ট ম্যানুয়ালি ভেরিফাই করা হবে" : "Payment will be verified manually");
          }
        } catch (verifyErr) {
          console.warn("Payment auto-verify failed, will be verified manually:", verifyErr);
        }
      }

      // Send order confirmation email (fire and forget)
      if (order && user?.email) {
        const emailItems = items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price * (1 - (item.product.discount_percentage || 0) / 100),
        }));
        
        sendOrderConfirmationEmail(
          user.email,
          formData.shipping_name || "Customer",
          order.order_number,
          emailItems,
          order.total_amount
        ).then(result => {
          if (result.success) {
            console.log("Order confirmation email sent successfully");
          } else {
            console.warn("Failed to send order confirmation email:", result.message);
          }
        }).catch(err => {
          console.warn("Error sending order confirmation email:", err);
        });
      }

      // Create customer account if requested
      if (createAccount && accountEmail && accountPassword && !user) {
        try {
          const { error: signUpError } = await signUp(
            accountEmail, 
            accountPassword, 
            formData.shipping_name, 
            {
              mobile: formData.shipping_mobile,
              division: formData.shipping_division,
              district: formData.shipping_district,
              upazila: formData.shipping_upazila,
            },
            'customer'
          );
          if (signUpError) {
            console.warn("Account creation failed:", signUpError);
            toast.info(language === "bn" ? "অ্যাকাউন্ট তৈরি করা যায়নি, কিন্তু অর্ডার সফল হয়েছে" : "Account creation failed, but order was placed");
          } else {
            toast.success(language === "bn" ? "কাস্টমার অ্যাকাউন্ট তৈরি হয়েছে!" : "Customer account created!");
          }
        } catch (accErr) {
          console.warn("Account creation error:", accErr);
        }
      }

      // Success
      clearCart();
      toast.success(language === "bn" ? "অর্ডার সফল হয়েছে!" : "Order placed successfully!");
      navigate(`/order-confirmation/${order?.order_number}`);
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

        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 flex items-center gap-3">
          <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8" />
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <CardContent className="space-y-4">
                  <RadioGroup
                    value={formData.payment_method}
                    onValueChange={(value) => handleInputChange("payment_method", value)}
                    className="space-y-3"
                  >
                    {/* Cash on Delivery */}
                    {paymentSettings.cod.enabled && (
                      <div className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${formData.payment_method === 'cod' ? 'border-primary bg-primary/5' : 'hover:border-primary'}`}>
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
                    )}

                    {/* bKash Payment */}
                    {paymentSettings.bkash.enabled && (
                      <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${formData.payment_method === 'bkash' ? 'border-primary bg-primary/5' : 'hover:border-primary'}`}>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="bkash" id="bkash" />
                          <Label htmlFor="bkash" className="flex-1 cursor-pointer flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-[hsl(330,80%,60%)] flex items-center justify-center text-white font-bold text-xs">
                              bK
                            </div>
                            <div>
                              <p className="font-medium">{translations.bkash}</p>
                              <p className="text-sm text-muted-foreground">
                                {language === "bn" ? "বিকাশে সেন্ড মানি করুন" : "Send money via bKash"}
                              </p>
                            </div>
                          </Label>
                        </div>
                        
                        {/* bKash Details - Show when selected */}
                        {formData.payment_method === 'bkash' && (
                          <div className="mt-4 pl-8 space-y-4">
                            <div className="p-4 rounded-lg bg-[hsl(330,80%,95%)] dark:bg-[hsl(330,50%,15%)] border border-[hsl(330,60%,80%)] dark:border-[hsl(330,40%,30%)]">
                              <p className="text-sm font-medium text-[hsl(330,60%,30%)] dark:text-[hsl(330,60%,80%)] mb-2">
                                {translations.sendMoneyTo}:
                              </p>
                              <p className="text-xl font-bold text-[hsl(330,70%,40%)] dark:text-[hsl(330,70%,70%)]">
                                {paymentSettings.bkash.number || "01XXXXXXXXX"}
                              </p>
                              <p className="text-xs text-[hsl(330,50%,40%)] dark:text-[hsl(330,50%,70%)] mt-1">
                                {translations.afterPayment}
                              </p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="bkash_trx">{translations.trxId} *</Label>
                                <Input
                                  id="bkash_trx"
                                  value={formData.payment_trx_id}
                                  onChange={(e) => handleInputChange("payment_trx_id", e.target.value)}
                                  placeholder="e.g., ABC123XYZ"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="bkash_sender">{translations.senderNumber} *</Label>
                                <Input
                                  id="bkash_sender"
                                  type="tel"
                                  value={formData.payment_sender_number}
                                  onChange={(e) => handleInputChange("payment_sender_number", e.target.value)}
                                  placeholder="01XXXXXXXXX"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Nagad Payment */}
                    {paymentSettings.nagad.enabled && (
                      <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${formData.payment_method === 'nagad' ? 'border-primary bg-primary/5' : 'hover:border-primary'}`}>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="nagad" id="nagad" />
                          <Label htmlFor="nagad" className="flex-1 cursor-pointer flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-[hsl(25,90%,55%)] flex items-center justify-center text-white font-bold text-xs">
                              N
                            </div>
                            <div>
                              <p className="font-medium">{translations.nagad}</p>
                              <p className="text-sm text-muted-foreground">
                                {language === "bn" ? "নগদে সেন্ড মানি করুন" : "Send money via Nagad"}
                              </p>
                            </div>
                          </Label>
                        </div>
                        
                        {/* Nagad Details - Show when selected */}
                        {formData.payment_method === 'nagad' && (
                          <div className="mt-4 pl-8 space-y-4">
                            <div className="p-4 rounded-lg bg-[hsl(25,90%,95%)] dark:bg-[hsl(25,50%,15%)] border border-[hsl(25,60%,80%)] dark:border-[hsl(25,40%,30%)]">
                              <p className="text-sm font-medium text-[hsl(25,60%,30%)] dark:text-[hsl(25,60%,80%)] mb-2">
                                {translations.sendMoneyTo}:
                              </p>
                              <p className="text-xl font-bold text-[hsl(25,70%,40%)] dark:text-[hsl(25,70%,70%)]">
                                {paymentSettings.nagad.number || "01XXXXXXXXX"}
                              </p>
                              <p className="text-xs text-[hsl(25,50%,40%)] dark:text-[hsl(25,50%,70%)] mt-1">
                                {translations.afterPayment}
                              </p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="nagad_trx">{translations.trxId} *</Label>
                                <Input
                                  id="nagad_trx"
                                  value={formData.payment_trx_id}
                                  onChange={(e) => handleInputChange("payment_trx_id", e.target.value)}
                                  placeholder="e.g., ABC123XYZ"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="nagad_sender">{translations.senderNumber} *</Label>
                                <Input
                                  id="nagad_sender"
                                  type="tel"
                                  value={formData.payment_sender_number}
                                  onChange={(e) => handleInputChange("payment_sender_number", e.target.value)}
                                  placeholder="01XXXXXXXXX"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
                      placeholder={language === "bn" ? "বিশেষ কোন নির্দেশনা থাকলে লিখুন..." : "Any special instructions..."}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Create Account Option - Only for Guest Users */}
              {!user && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="create-account" 
                        checked={createAccount}
                        onCheckedChange={(checked) => setCreateAccount(checked === true)}
                      />
                      <Label htmlFor="create-account" className="cursor-pointer font-medium">
                        {language === "bn" ? "অ্যাকাউন্ট তৈরি করুন (অর্ডার ট্র্যাক করতে)" : "Create an account (to track orders)"}
                      </Label>
                    </div>
                    {createAccount && (
                      <div className="grid sm:grid-cols-2 gap-4 pl-6">
                        <div className="space-y-2">
                          <Label htmlFor="acc-email">{language === "bn" ? "ইমেইল" : "Email"} *</Label>
                          <Input
                            id="acc-email"
                            type="email"
                            value={accountEmail}
                            onChange={(e) => setAccountEmail(e.target.value)}
                            placeholder="your@email.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="acc-password">{language === "bn" ? "পাসওয়ার্ড" : "Password"} *</Label>
                          <Input
                            id="acc-password"
                            type="password"
                            value={accountPassword}
                            onChange={(e) => setAccountPassword(e.target.value)}
                            placeholder="••••••••"
                            minLength={6}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>{translations.orderSummary}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items List */}
                  <div className="space-y-3">
                    {items.map((item) => {
                      const discountedPrice = item.product.price * (1 - (item.product.discount_percentage || 0) / 100);
                      return (
                        <div key={item.product.id} className="flex gap-3">
                          <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                            {item.product.image_url ? (
                              <img 
                                src={item.product.image_url} 
                                alt={item.product.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.product.name}</p>
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
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{translations.subtotal}</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{translations.shipping}</span>
                      {shippingCost === 0 ? (
                        <span className="text-primary font-medium">{translations.free}</span>
                      ) : (
                        <span className="font-medium">{formatPrice(shippingCost)}</span>
                      )}
                    </div>
                    {isDeliveryMandatory && shippingCost > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {deliverySettings.deliveryChargeMandatory === 'cod_only'
                          ? (language === "bn" ? "* ক্যাশ অন ডেলিভারিতে ডেলিভারি চার্জ বাধ্যতামূলক" : "* Delivery charge is mandatory for COD")
                          : (language === "bn" ? "* সকল অর্ডারে ডেলিভারি চার্জ বাধ্যতামূলক" : "* Delivery charge is mandatory for all orders")}
                      </p>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>{translations.total}</span>
                      <span className="text-primary">{formatPrice(total)}</span>
                    </div>

                    {/* Partial Payment Option */}
                    {deliverySettings.partialPaymentEnabled &&
                      formData.payment_method !== "cod" &&
                      deliverySettings.partialPaymentMethods.includes(formData.payment_method) && (
                      <div className="mt-3 space-y-2">
                        <Separator />
                        <div className="flex items-center justify-between py-2">
                          <Label htmlFor="partial_pay" className="text-sm cursor-pointer">
                            {language === "bn" ? "আংশিক পেমেন্ট (অ্যাডভান্স)" : "Partial Payment (Advance)"}
                          </Label>
                          <input
                            type="checkbox"
                            id="partial_pay"
                            checked={usePartialPayment}
                            onChange={(e) => setUsePartialPayment(e.target.checked)}
                            className="h-4 w-4 rounded border-input"
                          />
                        </div>
                        {usePartialPayment && (
                          <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                {language === "bn" ? `অ্যাডভান্স (${partialPayment.minPercent}%)` : `Advance (${partialPayment.minPercent}%)`}
                              </span>
                              <span className="font-semibold text-primary">{formatPrice(partialPayment.advanceAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                {language === "bn" ? "বাকি (ডেলিভারিতে)" : "Due (on delivery)"}
                              </span>
                              <span className="font-medium">{formatPrice(partialPayment.dueAmount)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Place Order Button */}
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isLoading || isLoadingPayment}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {language === "bn" ? "অপেক্ষা করুন..." : "Processing..."}
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        {translations.placeOrder}
                      </>
                    )}
                  </Button>

                  {/* Security Note */}
                  <p className="text-xs text-center text-muted-foreground">
                    {language === "bn" 
                      ? "আপনার তথ্য সুরক্ষিত এবং এনক্রিপ্টেড" 
                      : "Your information is secure and encrypted"}
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
