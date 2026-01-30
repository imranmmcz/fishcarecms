/**
 * Purchase Order Management Component
 * Manages purchase orders from suppliers
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  Eye,
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  FileDown,
} from "lucide-react";
import { generatePurchaseOrderPDF, type PurchaseOrderData } from "@/lib/generatePurchaseOrderPDF";

// Types
interface Company {
  id: string;
  name: string;
  name_bn: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
}

interface PurchaseOrderItem {
  id?: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

interface PurchaseOrder {
  id: string;
  order_number: string;
  company_id: string | null;
  company_name?: string;
  status: string;
  order_date: string;
  expected_date: string | null;
  received_date: string | null;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  notes: string | null;
  items?: PurchaseOrderItem[];
}

interface PurchaseOrdersProps {
  companies: Company[];
  products: Product[];
  onRefresh: () => void;
}

const statusConfig: Record<string, { color: string; icon: typeof Clock; label: { bn: string; en: string } }> = {
  pending: { color: "bg-yellow-500", icon: Clock, label: { bn: "পেন্ডিং", en: "Pending" } },
  ordered: { color: "bg-blue-500", icon: Truck, label: { bn: "অর্ডার করা হয়েছে", en: "Ordered" } },
  received: { color: "bg-green-500", icon: CheckCircle2, label: { bn: "প্রাপ্ত", en: "Received" } },
  cancelled: { color: "bg-red-500", icon: XCircle, label: { bn: "বাতিল", en: "Cancelled" } },
};

const PurchaseOrders = ({ companies, products, onRefresh }: PurchaseOrdersProps) => {
  const { toast } = useToast();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [orderDialog, setOrderDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  
  // Form state
  const [orderForm, setOrderForm] = useState({
    company_id: "",
    order_date: new Date().toISOString().split("T")[0],
    expected_date: "",
    notes: "",
    tax_amount: 0,
    shipping_cost: 0,
  });
  
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);

  const translations = {
    title: language === "bn" ? "ক্রয় অর্ডার" : "Purchase Orders",
    addOrder: language === "bn" ? "নতুন ক্রয় অর্ডার" : "New Purchase Order",
    orderNumber: language === "bn" ? "অর্ডার নম্বর" : "Order Number",
    supplier: language === "bn" ? "সাপ্লায়ার" : "Supplier",
    orderDate: language === "bn" ? "অর্ডার তারিখ" : "Order Date",
    expectedDate: language === "bn" ? "প্রত্যাশিত তারিখ" : "Expected Date",
    status: language === "bn" ? "স্ট্যাটাস" : "Status",
    total: language === "bn" ? "মোট" : "Total",
    actions: language === "bn" ? "অ্যাকশন" : "Actions",
    noData: language === "bn" ? "কোন ডাটা নেই" : "No data found",
    save: language === "bn" ? "সংরক্ষণ" : "Save",
    cancel: language === "bn" ? "বাতিল" : "Cancel",
    selectSupplier: language === "bn" ? "সাপ্লায়ার নির্বাচন করুন" : "Select Supplier",
    selectProduct: language === "bn" ? "পণ্য নির্বাচন করুন" : "Select Product",
    addProduct: language === "bn" ? "পণ্য যোগ করুন" : "Add Product",
    product: language === "bn" ? "পণ্য" : "Product",
    quantity: language === "bn" ? "পরিমাণ" : "Quantity",
    unitCost: language === "bn" ? "একক মূল্য" : "Unit Cost",
    totalCost: language === "bn" ? "মোট মূল্য" : "Total Cost",
    subtotal: language === "bn" ? "সাবটোটাল" : "Subtotal",
    tax: language === "bn" ? "ট্যাক্স" : "Tax",
    shipping: language === "bn" ? "শিপিং" : "Shipping",
    notes: language === "bn" ? "নোট" : "Notes",
    refresh: language === "bn" ? "রিফ্রেশ" : "Refresh",
    view: language === "bn" ? "দেখুন" : "View",
    markAsOrdered: language === "bn" ? "অর্ডার করা হয়েছে" : "Mark as Ordered",
    markAsReceived: language === "bn" ? "প্রাপ্ত হয়েছে" : "Mark as Received",
    cancelOrder: language === "bn" ? "অর্ডার বাতিল" : "Cancel Order",
    orderDetails: language === "bn" ? "অর্ডার বিবরণ" : "Order Details",
    receivedDate: language === "bn" ? "প্রাপ্তির তারিখ" : "Received Date",
    downloadInvoice: language === "bn" ? "ইনভয়েস ডাউনলোড" : "Download Invoice",
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const res = await fetch(
        `${supabaseUrl}/rest/v1/purchase_orders?select=*&order=created_at.desc`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken || supabaseKey}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        // Add company names
        const ordersWithNames = data.map((order: PurchaseOrder) => ({
          ...order,
          company_name: companies.find((c) => c.id === order.company_id)?.name || "-",
        }));
        setOrders(ordersWithNames);
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [companies]);

  const generateOrderNumber = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `PO-${dateStr}-${random}`;
  };

  const handleAddItem = () => {
    setOrderItems([
      ...orderItems,
      { product_id: "", quantity: 1, unit_cost: 0, total_cost: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const updated = [...orderItems];
    if (field === "product_id") {
      const product = products.find((p) => p.id === value);
      updated[index] = {
        ...updated[index],
        product_id: value as string,
        product_name: product?.name,
        unit_cost: product?.price || 0,
        total_cost: (product?.price || 0) * updated[index].quantity,
      };
    } else if (field === "quantity") {
      updated[index] = {
        ...updated[index],
        quantity: Number(value),
        total_cost: Number(value) * updated[index].unit_cost,
      };
    } else if (field === "unit_cost") {
      updated[index] = {
        ...updated[index],
        unit_cost: Number(value),
        total_cost: Number(value) * updated[index].quantity,
      };
    }
    setOrderItems(updated);
  };

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.total_cost, 0);
    const total = subtotal + orderForm.tax_amount + orderForm.shipping_cost;
    return { subtotal, total };
  };

  const handleSaveOrder = async () => {
    if (!orderForm.company_id) {
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" ? "সাপ্লায়ার নির্বাচন করুন" : "Please select a supplier",
        variant: "destructive",
      });
      return;
    }

    if (orderItems.length === 0 || orderItems.some((item) => !item.product_id)) {
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" ? "অন্তত একটি পণ্য যোগ করুন" : "Please add at least one product",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const { subtotal, total } = calculateTotals();

      // Create purchase order
      const orderRes = await fetch(`${supabaseUrl}/rest/v1/purchase_orders`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken || supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          order_number: generateOrderNumber(),
          company_id: orderForm.company_id,
          order_date: orderForm.order_date,
          expected_date: orderForm.expected_date || null,
          notes: orderForm.notes || null,
          subtotal,
          tax_amount: orderForm.tax_amount,
          shipping_cost: orderForm.shipping_cost,
          total_amount: total,
          status: "pending",
        }),
      });

      if (!orderRes.ok) {
        throw new Error("Failed to create purchase order");
      }

      const [newOrder] = await orderRes.json();

      // Create order items
      const itemsToInsert = orderItems.map((item) => ({
        purchase_order_id: newOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        total_cost: item.total_cost,
      }));

      const itemsRes = await fetch(`${supabaseUrl}/rest/v1/purchase_order_items`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken || supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemsToInsert),
      });

      if (!itemsRes.ok) {
        throw new Error("Failed to create order items");
      }

      toast({
        title: language === "bn" ? "সফল" : "Success",
        description: language === "bn" ? "ক্রয় অর্ডার তৈরি হয়েছে" : "Purchase order created",
      });

      setOrderDialog(false);
      resetForm();
      fetchOrders();
      onRefresh();
    } catch (error) {
      console.error("Error saving purchase order:", error);
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" ? "অর্ডার সংরক্ষণে সমস্যা হয়েছে" : "Failed to save order",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      await fetch(`${supabaseUrl}/rest/v1/purchase_orders?id=eq.${orderId}`, {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken || supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      toast({
        title: language === "bn" ? "সফল" : "Success",
        description: language === "bn" ? "স্ট্যাটাস আপডেট হয়েছে" : "Status updated",
      });

      fetchOrders();
      onRefresh();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleViewOrder = async (order: PurchaseOrder) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const res = await fetch(
        `${supabaseUrl}/rest/v1/purchase_order_items?purchase_order_id=eq.${order.id}`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken || supabaseKey}`,
          },
        }
      );

      if (res.ok) {
        const items = await res.json();
        const itemsWithNames = items.map((item: PurchaseOrderItem) => ({
          ...item,
          product_name: products.find((p) => p.id === item.product_id)?.name || "-",
        }));
        setSelectedOrder({ ...order, items: itemsWithNames });
        setViewDialog(true);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    }
  };

  const resetForm = () => {
    setOrderForm({
      company_id: "",
      order_date: new Date().toISOString().split("T")[0],
      expected_date: "",
      notes: "",
      tax_amount: 0,
      shipping_cost: 0,
    });
    setOrderItems([]);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US");
  };

  const handleDownloadInvoice = async (order: PurchaseOrder) => {
    try {
      // Get company details
      const company = companies.find(c => c.id === order.company_id);
      
      // Fetch items if not already loaded
      let orderItems = order.items;
      if (!orderItems || orderItems.length === 0) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        const res = await fetch(
          `${supabaseUrl}/rest/v1/purchase_order_items?purchase_order_id=eq.${order.id}`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${accessToken || supabaseKey}`,
            },
          }
        );

        if (res.ok) {
          const items = await res.json();
          orderItems = items.map((item: PurchaseOrderItem) => ({
            ...item,
            product_name: products.find((p) => p.id === item.product_id)?.name || "-",
          }));
        }
      }

      const pdfData: PurchaseOrderData = {
        order_number: order.order_number,
        company_name: company ? (language === "bn" && company.name_bn ? company.name_bn : company.name) : order.company_name,
        status: order.status,
        order_date: order.order_date,
        expected_date: order.expected_date,
        received_date: order.received_date,
        subtotal: order.subtotal,
        tax_amount: order.tax_amount,
        shipping_cost: order.shipping_cost,
        total_amount: order.total_amount,
        notes: order.notes,
        items: orderItems || [],
      };

      generatePurchaseOrderPDF(pdfData, { language });

      toast({
        title: language === "bn" ? "সফল" : "Success",
        description: language === "bn" ? "ইনভয়েস ডাউনলোড হয়েছে" : "Invoice downloaded",
      });
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" ? "ইনভয়েস ডাউনলোডে সমস্যা হয়েছে" : "Failed to download invoice",
        variant: "destructive",
      });
    }
  };

  const { subtotal, total } = calculateTotals();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          {translations.title}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchOrders} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            {translations.refresh}
          </Button>
          <Button onClick={() => setOrderDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {translations.addOrder}
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translations.orderNumber}</TableHead>
                  <TableHead>{translations.supplier}</TableHead>
                  <TableHead>{translations.orderDate}</TableHead>
                  <TableHead>{translations.expectedDate}</TableHead>
                  <TableHead>{translations.status}</TableHead>
                  <TableHead className="text-right">{translations.total}</TableHead>
                  <TableHead className="text-right">{translations.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.company_name}</TableCell>
                      <TableCell>{formatDate(order.order_date)}</TableCell>
                      <TableCell>{formatDate(order.expected_date)}</TableCell>
                      <TableCell>
                        <Badge className={`${status.color} text-white flex items-center gap-1 w-fit`}>
                          <StatusIcon className="h-3 w-3" />
                          {language === "bn" ? status.label.bn : status.label.en}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(order.total_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                            title={translations.view}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadInvoice(order)}
                            title={translations.downloadInvoice}
                          >
                            <FileDown className="h-4 w-4 text-primary" />
                          </Button>
                          {order.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, "ordered")}
                              title={translations.markAsOrdered}
                            >
                              <Truck className="h-4 w-4 text-blue-500" />
                            </Button>
                          )}
                          {order.status === "ordered" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, "received")}
                              title={translations.markAsReceived}
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                          {order.status !== "cancelled" && order.status !== "received" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, "cancelled")}
                              title={translations.cancelOrder}
                            >
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {translations.noData}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Order Dialog */}
      <Dialog open={orderDialog} onOpenChange={(open) => {
        setOrderDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{translations.addOrder}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{translations.supplier} *</Label>
                <Select
                  value={orderForm.company_id}
                  onValueChange={(v) => setOrderForm({ ...orderForm, company_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={translations.selectSupplier} />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {language === "bn" && c.name_bn ? c.name_bn : c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{translations.orderDate}</Label>
                <Input
                  type="date"
                  value={orderForm.order_date}
                  onChange={(e) => setOrderForm({ ...orderForm, order_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{translations.expectedDate}</Label>
                <Input
                  type="date"
                  value={orderForm.expected_date}
                  onChange={(e) => setOrderForm({ ...orderForm, expected_date: e.target.value })}
                />
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">{translations.product}</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  {translations.addProduct}
                </Button>
              </div>

              {orderItems.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{translations.product}</TableHead>
                        <TableHead className="w-24">{translations.quantity}</TableHead>
                        <TableHead className="w-32">{translations.unitCost}</TableHead>
                        <TableHead className="w-32 text-right">{translations.totalCost}</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Select
                              value={item.product_id}
                              onValueChange={(v) => handleItemChange(index, "product_id", v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={translations.selectProduct} />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_cost}
                              onChange={(e) => handleItemChange(index, "unit_cost", e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatPrice(item.total_cost)}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {orderItems.length === 0 && (
                <div className="text-center py-8 border rounded-lg text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{language === "bn" ? "পণ্য যোগ করুন" : "Add products to this order"}</p>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{translations.notes}</Label>
                <Textarea
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>{translations.subtotal}</Label>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-20">{translations.tax}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={orderForm.tax_amount}
                    onChange={(e) => setOrderForm({ ...orderForm, tax_amount: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-20">{translations.shipping}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={orderForm.shipping_cost}
                    onChange={(e) => setOrderForm({ ...orderForm, shipping_cost: Number(e.target.value) })}
                  />
                </div>
                <Separator />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>{translations.total}</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOrderDialog(false)}>
                {translations.cancel}
              </Button>
              <Button onClick={handleSaveOrder} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {translations.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{translations.orderDetails}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{translations.orderNumber}:</span>
                  <p className="font-medium">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{translations.supplier}:</span>
                  <p className="font-medium">{selectedOrder.company_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{translations.orderDate}:</span>
                  <p className="font-medium">{formatDate(selectedOrder.order_date)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{translations.status}:</span>
                  <Badge className={`${statusConfig[selectedOrder.status]?.color} text-white mt-1`}>
                    {language === "bn"
                      ? statusConfig[selectedOrder.status]?.label.bn
                      : statusConfig[selectedOrder.status]?.label.en}
                  </Badge>
                </div>
                {selectedOrder.expected_date && (
                  <div>
                    <span className="text-muted-foreground">{translations.expectedDate}:</span>
                    <p className="font-medium">{formatDate(selectedOrder.expected_date)}</p>
                  </div>
                )}
                {selectedOrder.received_date && (
                  <div>
                    <span className="text-muted-foreground">{translations.receivedDate}:</span>
                    <p className="font-medium">{formatDate(selectedOrder.received_date)}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Items */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{translations.product}</TableHead>
                    <TableHead className="text-center">{translations.quantity}</TableHead>
                    <TableHead className="text-right">{translations.unitCost}</TableHead>
                    <TableHead className="text-right">{translations.totalCost}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatPrice(item.unit_cost)}</TableCell>
                      <TableCell className="text-right font-medium">{formatPrice(item.total_cost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Separator />

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{translations.subtotal}</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{translations.tax}</span>
                    <span>{formatPrice(selectedOrder.tax_amount)}</span>
                  </div>
                )}
                {selectedOrder.shipping_cost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{translations.shipping}</span>
                    <span>{formatPrice(selectedOrder.shipping_cost)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>{translations.total}</span>
                  <span className="text-primary">{formatPrice(selectedOrder.total_amount)}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <>
                  <Separator />
                  <div>
                    <span className="text-muted-foreground text-sm">{translations.notes}:</span>
                    <p className="mt-1">{selectedOrder.notes}</p>
                  </div>
                </>
              )}

              {/* Download Invoice Button */}
              <div className="pt-4">
                <Button 
                  onClick={() => handleDownloadInvoice(selectedOrder)}
                  className="w-full"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  {translations.downloadInvoice}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrders;
