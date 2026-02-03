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
}

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = useCallback(async (params?: { status?: string; limit?: number }) => {
    if (!user) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let query = supabase
        .from("orders")
        .select(`
          *,
          items:order_items(*)
        `)
        .order("created_at", { ascending: false });

      if (params?.status && params.status !== "all") {
        query = query.eq("status", params.status);
      }

      if (params?.limit) {
        query = query.limit(params.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const getOrder = async (orderId: string): Promise<Order | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from("orders")
        .select(`
          *,
          items:order_items(*)
        `)
        .eq("id", orderId)
        .single();

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      console.error("Error fetching order:", err);
      return null;
    }
  };

  const createOrder = async (orderData: CreateOrderData): Promise<{ order: Order | null; error: string | null }> => {
    try {
      // Generate order number
      const { data: orderNumber } = await supabase.rpc("generate_order_number");

      // Get product details
      const productIds = orderData.items.map(item => item.product_id);
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds);

      if (productsError) throw productsError;

      // Calculate totals
      let subtotal = 0;
      const orderItems = orderData.items.map(item => {
        const product = products?.find(p => p.id === item.product_id);
        if (!product) throw new Error(`Product not found: ${item.product_id}`);

        const discountedPrice = product.price * (1 - (product.discount_percentage || 0) / 100);
        const totalPrice = discountedPrice * item.quantity;
        subtotal += totalPrice;

        return {
          product_id: item.product_id,
          product_name: product.name,
          product_image: product.image_url,
          quantity: item.quantity,
          unit_price: product.price,
          discount_percentage: product.discount_percentage || 0,
          total_price: totalPrice,
        };
      });

      const shippingCost = 0; // Free shipping
      const totalAmount = subtotal + shippingCost;

      // Determine payment status
      const paymentStatus = orderData.payment_method === "cod" 
        ? "pending" 
        : "verification_pending";

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber || `ORD-${Date.now()}`,
          user_id: user?.id || null,
          customer_name: orderData.shipping_name,
          customer_email: user?.email || null,
          customer_phone: orderData.shipping_mobile,
          shipping_address: orderData.shipping_address || "",
          division: orderData.shipping_division || null,
          district: orderData.shipping_district || null,
          upazila: orderData.shipping_upazila || null,
          payment_method: orderData.payment_method,
          payment_status: paymentStatus,
          transaction_id: orderData.payment_trx_id || null,
          sender_number: orderData.payment_sender_number || null,
          subtotal,
          shipping_cost: shippingCost,
          discount_amount: 0,
          total_amount: totalAmount,
          status: "pending",
          notes: orderData.customer_note || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(
          orderItems.map(item => ({
            ...item,
            order_id: order.id,
          }))
        );

      if (itemsError) throw itemsError;

      return { order, error: null };
    } catch (err) {
      console.error("Error creating order:", err);
      return { order: null, error: (err as Error).message };
    }
  };

  const updateOrderStatus = async (orderId: string, status: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (updateError) throw updateError;
      toast.success("অর্ডার স্ট্যাটাস আপডেট হয়েছে");
      return true;
    } catch (err) {
      console.error("Error updating order status:", err);
      toast.error("স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে");
      return false;
    }
  };

  const cancelOrder = async (orderId: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (updateError) throw updateError;
      toast.success("অর্ডার বাতিল হয়েছে");
      return true;
    } catch (err) {
      console.error("Error cancelling order:", err);
      toast.error("অর্ডার বাতিল করতে সমস্যা হয়েছে");
      return false;
    }
  };

  const getOrderStats = async (): Promise<OrderStats | null> => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Get today's orders
      const { data: todayOrders } = await supabase
        .from("orders")
        .select("total_amount")
        .gte("created_at", todayStart);

      // Get this month's orders
      const { data: monthOrders } = await supabase
        .from("orders")
        .select("total_amount")
        .gte("created_at", monthStart);

      // Get all orders
      const { data: allOrders } = await supabase
        .from("orders")
        .select("total_amount, status");

      const todayTotal = todayOrders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
      const monthTotal = monthOrders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
      const total = allOrders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

      const byStatus: Record<string, number> = {};
      allOrders?.forEach(o => {
        byStatus[o.status] = (byStatus[o.status] || 0) + 1;
      });

      return {
        today: { count: todayOrders?.length || 0, total_amount: todayTotal },
        this_month: { count: monthOrders?.length || 0, total_amount: monthTotal },
        total: { count: allOrders?.length || 0, total_amount: total },
        by_status: byStatus,
      };
    } catch (err) {
      console.error("Error fetching order stats:", err);
      return null;
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    isLoading,
    error,
    fetchOrders,
    getOrder,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    getOrderStats,
    refetch: fetchOrders,
  };
}
