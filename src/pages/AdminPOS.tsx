import { useState, useEffect, useRef, useCallback } from "react";
import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote,
  Smartphone, Receipt, Clock, DollarSign, X, Printer, PlayCircle,
  StopCircle, History, Package, UserPlus, Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  sku: string | null;
  discount_percentage: number | null;
  category: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

interface Shift {
  id: string;
  shift_number: string;
  status: string;
  opening_amount: number;
  cash_sales: number;
  mobile_banking_sales: number;
  total_sales: number;
  total_transactions: number;
  opened_at: string;
}

interface Customer {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  shipping_address: string | null;
}

export default function AdminPOS() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const customerSearchRef = useRef<HTMLInputElement>(null);
  const [mobileBankingProvider, setMobileBankingProvider] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  const [openingAmount, setOpeningAmount] = useState("");
  const [isCloseShiftOpen, setIsCloseShiftOpen] = useState(false);
  const [closingAmount, setClosingAmount] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
    fetchActiveShift();
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from("customers")
      .select("id, customer_name, customer_phone, customer_email, shipping_address")
      .order("customer_name");
    if (data) setCustomers(data);
  };

  const filteredCustomers = customers.filter(c =>
    c.customer_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.customer_phone.includes(customerSearch)
  );

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.customer_name);
    setCustomerPhone(customer.customer_phone);
    setCustomerSearch("");
    setShowCustomerDropdown(false);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerName("");
    setCustomerPhone("");
  };

  const addNewCustomer = async () => {
    if (!newCustomerName || !newCustomerPhone) {
      toast.error("নাম ও ফোন নম্বর আবশ্যক");
      return;
    }
    const { data, error } = await supabase.from("customers").insert({
      customer_name: newCustomerName,
      customer_phone: newCustomerPhone,
      customer_email: newCustomerEmail || null,
    }).select().single();
    if (error) {
      toast.error("কাস্টমার যোগ করতে সমস্যা হয়েছে");
      return;
    }
    toast.success("কাস্টমার যোগ হয়েছে");
    setCustomers(prev => [...prev, data as Customer]);
    selectCustomer(data as Customer);
    setShowAddCustomer(false);
    setNewCustomerName("");
    setNewCustomerPhone("");
    setNewCustomerEmail("");
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, stock_quantity, image_url, sku, discount_percentage, category")
      .gt("stock_quantity", 0)
      .order("name");
    if (!error && data) setProducts(data);
  };

  const fetchActiveShift = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("pos_shifts")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "open")
      .maybeSingle();
    if (!error && data) setActiveShift(data as Shift);
  };

  const openShift = async () => {
    if (!user) return;
    const { data: numData } = await supabase.rpc("generate_shift_number");
    const shiftNumber = numData || `SHIFT-${Date.now()}`;
    const { data, error } = await supabase.from("pos_shifts").insert({
      user_id: user.id,
      shift_number: shiftNumber,
      opening_amount: parseFloat(openingAmount) || 0,
      status: "open",
    }).select().single();
    if (error) {
      toast.error("শিফট শুরু করতে সমস্যা হয়েছে");
      return;
    }
    setActiveShift(data as Shift);
    setIsShiftDialogOpen(false);
    setOpeningAmount("");
    toast.success("শিফট শুরু হয়েছে");
  };

  const closeShift = async () => {
    if (!activeShift) return;
    const expectedAmount = activeShift.opening_amount + activeShift.cash_sales;
    const { error } = await supabase.from("pos_shifts").update({
      status: "closed",
      closing_amount: parseFloat(closingAmount) || 0,
      expected_amount: expectedAmount,
      closed_at: new Date().toISOString(),
      notes: closingNotes || null,
    }).eq("id", activeShift.id);
    if (error) {
      toast.error("শিফট বন্ধ করতে সমস্যা হয়েছে");
      return;
    }
    setActiveShift(null);
    setIsCloseShiftOpen(false);
    setClosingAmount("");
    setClosingNotes("");
    toast.success("শিফট বন্ধ হয়েছে");
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          toast.error("স্টকে আর পণ্য নেই");
          return prev;
        }
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unit_price }
            : i
        );
      }
      const effectivePrice = product.discount_percentage
        ? product.price * (1 - product.discount_percentage / 100)
        : product.price;
      return [...prev, {
        product,
        quantity: 1,
        unit_price: effectivePrice,
        discount: product.discount_percentage || 0,
        total: effectivePrice,
      }];
    });
  }, []);

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(i =>
      i.product.id === productId
        ? { ...i, quantity: qty, total: qty * i.unit_price }
        : i
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, i) => sum + i.total, 0);
  const totalAmount = subtotal - discount;
  const paid = parseFloat(paidAmount) || 0;
  const changeAmount = paid - totalAmount;

  const processSale = async () => {
    if (!user || !activeShift) {
      toast.error("প্রথমে শিফট শুরু করুন");
      return;
    }
    if (cart.length === 0) {
      toast.error("কার্টে পণ্য যোগ করুন");
      return;
    }
    if (paymentMethod === "cash" && paid < totalAmount) {
      toast.error("পর্যাপ্ত টাকা দেওয়া হয়নি");
      return;
    }

    setIsProcessing(true);
    try {
      const { data: numData } = await supabase.rpc("generate_pos_sale_number");
      const saleNumber = numData || `POS-${Date.now()}`;

      const { data: sale, error: saleError } = await supabase.from("pos_sales").insert({
        sale_number: saleNumber,
        shift_id: activeShift.id,
        user_id: user.id,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        payment_method: paymentMethod,
        subtotal,
        discount_amount: discount,
        total_amount: totalAmount,
        paid_amount: paymentMethod === "cash" ? paid : totalAmount,
        change_amount: paymentMethod === "cash" ? Math.max(0, changeAmount) : 0,
        mobile_banking_provider: paymentMethod === "mobile_banking" ? mobileBankingProvider : null,
        transaction_id: paymentMethod === "mobile_banking" ? transactionId : null,
        notes: notes || null,
      }).select().single();

      if (saleError) throw saleError;

      const items = cart.map(i => ({
        sale_id: sale.id,
        product_id: i.product.id,
        product_name: i.product.name,
        unit_price: i.unit_price,
        quantity: i.quantity,
        discount_percentage: i.discount,
        total_price: i.total,
      }));
      const { error: itemsError } = await supabase.from("pos_sale_items").insert(items);
      if (itemsError) throw itemsError;

      // Update stock
      for (const item of cart) {
        await supabase.from("products").update({
          stock_quantity: item.product.stock_quantity - item.quantity,
        }).eq("id", item.product.id);
      }

      // Update shift totals
      const cashAdd = paymentMethod === "cash" ? totalAmount : 0;
      const mobileAdd = paymentMethod === "mobile_banking" ? totalAmount : 0;
      await supabase.from("pos_shifts").update({
        cash_sales: activeShift.cash_sales + cashAdd,
        mobile_banking_sales: activeShift.mobile_banking_sales + mobileAdd,
        total_sales: activeShift.total_sales + totalAmount,
        total_transactions: activeShift.total_transactions + 1,
      }).eq("id", activeShift.id);

      setActiveShift(prev => prev ? {
        ...prev,
        cash_sales: prev.cash_sales + cashAdd,
        mobile_banking_sales: prev.mobile_banking_sales + mobileAdd,
        total_sales: prev.total_sales + totalAmount,
        total_transactions: prev.total_transactions + 1,
      } : null);

      setLastSale({ ...sale, items: cart, saleNumber });
      setShowReceipt(true);
      setCart([]);
      setPaidAmount("");
      setCustomerName("");
      setCustomerPhone("");
      setSelectedCustomer(null);
      setCustomerSearch("");
      setDiscount(0);
      setNotes("");
      setMobileBankingProvider("");
      setTransactionId("");
      fetchProducts();
      toast.success("বিক্রি সম্পন্ন হয়েছে!");
    } catch (error) {
      console.error("Sale error:", error);
      toast.error("বিক্রি করতে সমস্যা হয়েছে");
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchSalesHistory = async () => {
    if (!activeShift) return;
    const { data } = await supabase
      .from("pos_sales")
      .select("*")
      .eq("shift_id", activeShift.id)
      .order("created_at", { ascending: false });
    setSalesHistory(data || []);
    setShowHistory(true);
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <POSLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">POS - পয়েন্ট অফ সেল</h1>
            <p className="text-muted-foreground text-sm">দ্রুত বিক্রি ও ক্যাশ ম্যানেজমেন্ট</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {activeShift ? (
              <>
                <Badge variant="default" className="gap-1 py-1.5">
                  <PlayCircle className="h-3.5 w-3.5" />
                  {activeShift.shift_number}
                </Badge>
                <Button size="sm" variant="outline" onClick={fetchSalesHistory}>
                  <History className="h-4 w-4 mr-1" /> বিক্রি তালিকা
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setIsCloseShiftOpen(true)}>
                  <StopCircle className="h-4 w-4 mr-1" /> শিফট বন্ধ
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsShiftDialogOpen(true)} className="gap-2">
                <PlayCircle className="h-4 w-4" /> শিফট শুরু করুন
              </Button>
            )}
          </div>
        </div>

        {!activeShift ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <Clock className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">শিফট শুরু করুন</h2>
              <p className="text-muted-foreground mb-4">বিক্রি শুরু করতে প্রথমে একটি শিফট ওপেন করুন</p>
              <Button onClick={() => setIsShiftDialogOpen(true)} size="lg">
                <PlayCircle className="h-5 w-5 mr-2" /> শিফট শুরু করুন
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Product Search & Grid */}
            <div className="lg:col-span-7 space-y-3">
              {/* Shift Summary */}
              <div className="grid grid-cols-3 gap-2">
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">মোট বিক্রি</p>
                    <p className="text-lg font-bold text-primary">৳{activeShift.total_sales.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">নগদ</p>
                    <p className="text-lg font-bold text-green-600">৳{activeShift.cash_sales.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">মোবাইল</p>
                    <p className="text-lg font-bold text-blue-600">৳{activeShift.mobile_banking_sales.toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  placeholder="পণ্য খুঁজুন (নাম বা SKU)..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[55vh] overflow-y-auto pr-1">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="border rounded-lg p-2 text-left hover:border-primary hover:bg-primary/5 transition-colors group"
                  >
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-16 object-cover rounded mb-1" />
                    ) : (
                      <div className="w-full h-16 bg-muted rounded mb-1 flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <p className="text-xs font-medium line-clamp-2 leading-tight">{product.name}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs font-bold text-primary">৳{product.price}</span>
                      <span className="text-[10px] text-muted-foreground">স্টক: {product.stock_quantity}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cart & Checkout */}
            <div className="lg:col-span-5">
              <Card className="sticky top-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShoppingCart className="h-5 w-5" />
                    কার্ট ({cart.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Cart Items */}
                  <div className="max-h-[25vh] overflow-y-auto space-y-2">
                    {cart.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6 text-sm">কার্ট খালি</p>
                    ) : cart.map(item => (
                      <div key={item.product.id} className="flex items-center gap-2 border rounded-lg p-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">৳{item.unit_price} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.product.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-sm font-bold w-16 text-right">৳{item.total.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Customer Info */}
                  <div className="space-y-2">
                    {selectedCustomer ? (
                      <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                        <Users className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{selectedCustomer.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{selectedCustomer.customer_phone}</p>
                        </div>
                        <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={clearCustomer}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="flex gap-1">
                          <div className="relative flex-1">
                            <Users className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              ref={customerSearchRef}
                              placeholder="কাস্টমার খুঁজুন (নাম/ফোন)..."
                              value={customerSearch}
                              onChange={e => {
                                setCustomerSearch(e.target.value);
                                setShowCustomerDropdown(true);
                              }}
                              onFocus={() => setShowCustomerDropdown(true)}
                              className="h-8 text-xs pl-7"
                            />
                          </div>
                          <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={() => setShowAddCustomer(true)} title="নতুন কাস্টমার">
                            <UserPlus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {showCustomerDropdown && customerSearch.length > 0 && (
                          <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                            {filteredCustomers.length > 0 ? filteredCustomers.slice(0, 8).map(c => (
                              <button
                                key={c.id}
                                className="w-full text-left px-3 py-2 hover:bg-muted/50 text-xs flex justify-between items-center"
                                onClick={() => selectCustomer(c)}
                              >
                                <span className="font-medium">{c.customer_name}</span>
                                <span className="text-muted-foreground">{c.customer_phone}</span>
                              </button>
                            )) : (
                              <div className="px-3 py-3 text-xs text-muted-foreground text-center">
                                কোনো কাস্টমার পাওয়া যায়নি
                                <Button size="sm" variant="link" className="block mx-auto mt-1 text-xs h-auto p-0" onClick={() => { setShowAddCustomer(true); setShowCustomerDropdown(false); }}>
                                  <UserPlus className="h-3 w-3 mr-1 inline" /> নতুন কাস্টমার যোগ করুন
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {!selectedCustomer && (
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="কাস্টমার নাম (ঐচ্ছিক)" value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-8 text-xs" />
                        <Input placeholder="ফোন নম্বর (ঐচ্ছিক)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="h-8 text-xs" />
                      </div>
                    )}
                  </div>

                  {/* Add Customer Dialog */}
                  <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <UserPlus className="h-5 w-5" /> নতুন কাস্টমার যোগ করুন
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs">নাম *</Label>
                          <Input placeholder="কাস্টমারের নাম" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">ফোন নম্বর *</Label>
                          <Input placeholder="01XXXXXXXXX" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">ইমেইল (ঐচ্ছিক)</Label>
                          <Input placeholder="email@example.com" value={newCustomerEmail} onChange={e => setNewCustomerEmail(e.target.value)} />
                        </div>
                        <Button className="w-full" onClick={addNewCustomer}>কাস্টমার যোগ করুন</Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Payment Method */}
                  <div className="flex gap-2">
                    <Button size="sm" variant={paymentMethod === "cash" ? "default" : "outline"} className="flex-1 gap-1" onClick={() => setPaymentMethod("cash")}>
                      <Banknote className="h-3.5 w-3.5" /> নগদ
                    </Button>
                    <Button size="sm" variant={paymentMethod === "mobile_banking" ? "default" : "outline"} className="flex-1 gap-1" onClick={() => setPaymentMethod("mobile_banking")}>
                      <Smartphone className="h-3.5 w-3.5" /> মোবাইল
                    </Button>
                  </div>

                  {paymentMethod === "mobile_banking" && (
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={mobileBankingProvider} onValueChange={setMobileBankingProvider}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="প্রোভাইডার" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bkash">বিকাশ</SelectItem>
                          <SelectItem value="nagad">নগদ</SelectItem>
                          <SelectItem value="rocket">রকেট</SelectItem>
                          <SelectItem value="upay">উপায়</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="ট্রানজেকশন ID" value={transactionId} onChange={e => setTransactionId(e.target.value)} className="h-8 text-xs" />
                    </div>
                  )}

                  {/* Discount */}
                  <div className="flex items-center gap-2">
                    <Label className="text-xs shrink-0">ডিসকাউন্ট:</Label>
                    <Input type="number" value={discount || ""} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="h-8 text-xs" placeholder="০" />
                  </div>

                  {/* Totals */}
                  <div className="space-y-1 bg-muted/50 rounded-lg p-3">
                    <div className="flex justify-between text-sm">
                      <span>সাবটোটাল:</span>
                      <span>৳{subtotal.toFixed(0)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-red-500">
                        <span>ডিসকাউন্ট:</span>
                        <span>-৳{discount.toFixed(0)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>মোট:</span>
                      <span className="text-primary">৳{totalAmount.toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Paid Amount (cash only) */}
                  {paymentMethod === "cash" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs shrink-0">প্রদান:</Label>
                        <Input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="h-9 text-base font-bold" placeholder="০" />
                      </div>
                      {paid > 0 && changeAmount >= 0 && (
                        <div className="flex justify-between bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg p-2 font-bold">
                          <span>ফেরত:</span>
                          <span>৳{changeAmount.toFixed(0)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Process Button */}
                  <Button
                    className="w-full h-12 text-lg gap-2"
                    onClick={processSale}
                    disabled={isProcessing || cart.length === 0}
                  >
                    {isProcessing ? "প্রসেসিং..." : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        বিক্রি সম্পন্ন করুন — ৳{totalAmount.toFixed(0)}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Open Shift Dialog */}
        <Dialog open={isShiftDialogOpen} onOpenChange={setIsShiftDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5" /> শিফট শুরু করুন
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ক্যাশ ড্রয়ারে প্রারম্ভিক টাকা</Label>
                <Input type="number" placeholder="০" value={openingAmount} onChange={e => setOpeningAmount(e.target.value)} />
              </div>
              <Button className="w-full" onClick={openShift}>শিফট শুরু করুন</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Close Shift Dialog */}
        <Dialog open={isCloseShiftOpen} onOpenChange={setIsCloseShiftOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <StopCircle className="h-5 w-5" /> শিফট বন্ধ করুন
              </DialogTitle>
            </DialogHeader>
            {activeShift && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span>প্রারম্ভিক টাকা:</span><span className="font-bold">৳{activeShift.opening_amount.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>নগদ বিক্রি:</span><span className="font-bold text-green-600">৳{activeShift.cash_sales.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>মোবাইল বিক্রি:</span><span className="font-bold text-blue-600">৳{activeShift.mobile_banking_sales.toLocaleString()}</span></div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base"><span>প্রত্যাশিত ক্যাশ:</span><span>৳{(activeShift.opening_amount + activeShift.cash_sales).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>মোট ট্রানজেকশন:</span><span className="font-bold">{activeShift.total_transactions}</span></div>
                </div>
                <div className="space-y-2">
                  <Label>ক্যাশ ড্রয়ারে বর্তমান টাকা গণনা করুন</Label>
                  <Input type="number" placeholder="০" value={closingAmount} onChange={e => setClosingAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>নোট (ঐচ্ছিক)</Label>
                  <Textarea placeholder="কোনো মন্তব্য..." value={closingNotes} onChange={e => setClosingNotes(e.target.value)} />
                </div>
                <Button className="w-full" variant="destructive" onClick={closeShift}>শিফট বন্ধ করুন</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Receipt Dialog */}
        <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" /> রিসিপ্ট
              </DialogTitle>
            </DialogHeader>
            {lastSale && (
              <div className="space-y-3 text-sm" id="receipt-content">
                <div className="text-center border-b pb-2">
                  <h3 className="font-bold text-lg">FishCare BD</h3>
                  <p className="text-xs text-muted-foreground">বিক্রি রিসিপ্ট</p>
                </div>
                <div className="space-y-1 text-xs">
                  <p><strong>রিসিপ্ট #:</strong> {lastSale.saleNumber || lastSale.sale_number}</p>
                  <p><strong>তারিখ:</strong> {new Date(lastSale.created_at).toLocaleString('bn-BD')}</p>
                  {lastSale.customer_name && <p><strong>কাস্টমার:</strong> {lastSale.customer_name}</p>}
                  {lastSale.customer_phone && <p><strong>ফোন:</strong> {lastSale.customer_phone}</p>}
                </div>
                <Separator />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs p-1">পণ্য</TableHead>
                      <TableHead className="text-xs p-1 text-center">পরিমাণ</TableHead>
                      <TableHead className="text-xs p-1 text-right">মূল্য</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lastSale.items?.map((item: CartItem, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs p-1">{item.product.name}</TableCell>
                        <TableCell className="text-xs p-1 text-center">{item.quantity}</TableCell>
                        <TableCell className="text-xs p-1 text-right">৳{item.total.toFixed(0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Separator />
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>সাবটোটাল:</span><span>৳{lastSale.subtotal}</span></div>
                  {lastSale.discount_amount > 0 && <div className="flex justify-between text-red-500"><span>ডিসকাউন্ট:</span><span>-৳{lastSale.discount_amount}</span></div>}
                  <div className="flex justify-between font-bold text-base"><span>মোট:</span><span>৳{lastSale.total_amount}</span></div>
                  <div className="flex justify-between"><span>প্রদান ({lastSale.payment_method === 'cash' ? 'নগদ' : 'মোবাইল'}):</span><span>৳{lastSale.paid_amount}</span></div>
                  {lastSale.change_amount > 0 && <div className="flex justify-between"><span>ফেরত:</span><span>৳{lastSale.change_amount}</span></div>}
                </div>
                <div className="text-center text-xs text-muted-foreground border-t pt-2">
                  ধন্যবাদ! আবার আসবেন।
                </div>
              </div>
            )}
            <Button onClick={printReceipt} className="w-full gap-2">
              <Printer className="h-4 w-4" /> প্রিন্ট করুন
            </Button>
          </DialogContent>
        </Dialog>

        {/* Sales History Dialog */}
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" /> এই শিফটের বিক্রি তালিকা
              </DialogTitle>
            </DialogHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>রিসিপ্ট</TableHead>
                  <TableHead>কাস্টমার</TableHead>
                  <TableHead>পেমেন্ট</TableHead>
                  <TableHead className="text-right">মূল্য</TableHead>
                  <TableHead>সময়</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesHistory.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-xs">{sale.sale_number}</TableCell>
                    <TableCell>{sale.customer_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={sale.payment_method === 'cash' ? 'default' : 'secondary'}>
                        {sale.payment_method === 'cash' ? 'নগদ' : 'মোবাইল'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">৳{sale.total_amount}</TableCell>
                    <TableCell className="text-xs">{new Date(sale.created_at).toLocaleTimeString('bn-BD')}</TableCell>
                  </TableRow>
                ))}
                {salesHistory.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">এই শিফটে কোনো বিক্রি নেই</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
      </div>
    </POSLayout>
  );
}
