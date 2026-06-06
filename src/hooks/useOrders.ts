/**
 * Orders Hook - Supabase Implementation
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  total_price: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  shipping_address: string;
  division: string | null;
  district: string | null;
  upazila: string | null;
  payment_method: string;
  payment_status: string;
  transaction_id: string | null;
  sender_number: string | null;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderStats {
  today: { count: number; total_amount: number };
  this_month: { count: number; total_amount: number };
  total: { count: number; total_amount: number };
  by_status: Record<string, number>;
}

export interface CreateOrderData {
  items: { product_id: string; quantity: number }[];
  shipping_name: string;
  shipping_mobile: string;
  shipping_division?: string;
  shipping_district?: string;
  shipping_upazila?: string;
  shipping_address?: string;
  payment_method: string;
  customer_note?: string;
  payment_trx_id?: string;
  payment_sender_number?: string;
  shipping_cost?: number;
  referral_code?: string;
  referral_discount?: number;
}

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = useCallback(async (params?: { status?: string; limit?: number }) => {
    if (!user) { setOrders([]); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      let query = supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (params?.status && params.status !== "all") query = query.eq("status", params.status);
      if (params?.limit) query = query.limit(params.limit);

      const { data, error: err } = await query;
      if (err) throw err;
      setOrders((data || []).map(mapRow));
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err as Error);
    } finally { setIsLoading(false); }
  }, [user]);

  const mapRow = (o: any): Order => ({
    id: o.id, order_number: o.order_number, user_id: o.user_id,
    customer_name: o.customer_name, customer_email: o.customer_email,
    customer_phone: o.customer_phone, shipping_address: o.shipping_address,
    division: o.division, district: o.district, upazila: o.upazila,
    payment_method: o.payment_method, payment_status: o.payment_status,
    transaction_id: o.transaction_id, sender_number: o.sender_number,
    subtotal: o.subtotal, shipping_cost: o.shipping_cost,
    discount_amount: o.discount_amount, total_amount: o.total_amount,
    status: o.status, notes: o.notes,
    created_at: o.created_at, updated_at: o.updated_at,
  });

  const getOrder = async (orderId: string): Promise<Order | null> => {
    try {
      const { data: orderData, error: orderErr } = await supabase.from("orders").select("*").eq("id", orderId).single();
      if (orderErr) throw orderErr;
      const { data: itemsData } = await supabase.from("order_items").select("*").eq("order_id", orderId);
      const order = mapRow(orderData);
      order.items = (itemsData || []).map((i) => ({
        id: i.id, order_id: i.order_id, product_id: i.product_id,
        product_name: i.product_name, product_image: i.product_image,
        quantity: i.quantity, unit_price: i.unit_price,
        discount_percentage: i.discount_percentage || 0, total_price: i.total_price,
        created_at: i.created_at,
      }));
      return order;
    } catch (err) {
      console.error("Error fetching order:", err);
      return null;
    }
  };

  const createOrder = async (orderData: CreateOrderData): Promise<{ order: Order | null; error: string | null }> => {
    try {
      // Get products for pricing
      const productIds = orderData.items.map(i => i.product_id);
      const { data: products } = await supabase.from("products").select("*").in("id", productIds);
      if (!products) return { order: null, error: "পণ্য পাওয়া যায়নি" };

      const subtotal = orderData.items.reduce((sum, item) => {
        const product = products.find(p => p.id === item.product_id);
        if (!product) return sum;
        const discountedPrice = product.price * (1 - (product.discount_percentage || 0) / 100);
        return sum + discountedPrice * item.quantity;
      }, 0);

      const shippingCost = orderData.shipping_cost || 0;
      const referralDiscount = orderData.referral_discount || 0;
      const totalAmount = Math.max(subtotal - referralDiscount, 0) + shippingCost;

      // Generate order number
      const { data: orderNumData } = await supabase.rpc("generate_order_number");
      const orderNumber = orderNumData || `ORD-${Date.now()}`;

      const { data: newOrder, error: insertErr } = await supabase.from("orders").insert({
        order_number: orderNumber,
        user_id: user?.id || null,
        customer_name: orderData.shipping_name,
        customer_phone: orderData.shipping_mobile,
        shipping_address: orderData.shipping_address || "",
        division: orderData.shipping_division || null,
        district: orderData.shipping_district || null,
        upazila: orderData.shipping_upazila || null,
        payment_method: orderData.payment_method,
        transaction_id: orderData.payment_trx_id || null,
        sender_number: orderData.payment_sender_number || null,
        notes: orderData.customer_note || null,
        subtotal, shipping_cost: shippingCost, total_amount: totalAmount,
        referral_code: orderData.referral_code || null,
        referral_discount: referralDiscount,
        discount_amount: referralDiscount,
      }).select().single();

      if (insertErr) throw insertErr;

      // Insert order items
      const orderItems = orderData.items.map(item => {
        const product = products.find(p => p.id === item.product_id)!;
        const discountedPrice = product.price * (1 - (product.discount_percentage || 0) / 100);
        return {
          order_id: newOrder.id, product_id: item.product_id,
          product_name: product.name, product_image: product.image_url,
          quantity: item.quantity, unit_price: product.price,
          discount_percentage: product.discount_percentage || 0,
          total_price: discountedPrice * item.quantity,
        };
      });
      await supabase.from("order_items").insert(orderItems);

      return { order: mapRow(newOrder), error: null };
    } catch (err) {
      console.error("Error creating order:", err);
      return { order: null, error: (err as Error).message };
    }
  };

  const updateOrderStatus = async (orderId: string, status: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (error) throw error;
      toast.success("অর্ডার স্ট্যাটাস আপডেট হয়েছে");
      return true;
    } catch (err) {
      console.error("Error updating order status:", err);
      toast.error("স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে");
      return false;
    }
  };

  const cancelOrder = async (orderId: string): Promise<boolean> => {
    return updateOrderStatus(orderId, "cancelled");
  };

  const getOrderStats = async (): Promise<OrderStats | null> => {
    try {
      const { data } = await supabase.from("orders").select("status, total_amount, created_at");
      if (!data) return null;
      const today = new Date().toISOString().split("T")[0];
      const thisMonth = today.substring(0, 7);
      const byStatus: Record<string, number> = {};
      let todayCount = 0, todayTotal = 0, monthCount = 0, monthTotal = 0;
      data.forEach(o => {
        byStatus[o.status] = (byStatus[o.status] || 0) + 1;
        if (o.created_at.startsWith(today)) { todayCount++; todayTotal += o.total_amount; }
        if (o.created_at.startsWith(thisMonth)) { monthCount++; monthTotal += o.total_amount; }
      });
      return {
        today: { count: todayCount, total_amount: todayTotal },
        this_month: { count: monthCount, total_amount: monthTotal },
        total: { count: data.length, total_amount: data.reduce((s, o) => s + o.total_amount, 0) },
        by_status: byStatus,
      };
    } catch (err) {
      console.error("Error fetching order stats:", err);
      return null;
    }
  };

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return { orders, isLoading, error, fetchOrders, getOrder, createOrder, updateOrderStatus, cancelOrder, getOrderStats, refetch: fetchOrders };
}
