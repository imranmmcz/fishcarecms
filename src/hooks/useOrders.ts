/**
 * Orders Hook - MySQL API Version
 */

import { useState, useEffect, useCallback } from "react";
import { apiClient, Order as ApiOrder, OrderItem as ApiOrderItem, CreateOrderData as ApiCreateOrderData } from "@/lib/api-client";
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
  partial_payment?: boolean;
  advance_amount?: number;
  due_amount?: number;
}

const mapApiOrder = (o: ApiOrder): Order => ({
  id: String(o.id),
  order_number: o.order_number,
  user_id: o.user_id ? String(o.user_id) : null,
  customer_name: o.customer_name || o.shipping_name,
  customer_email: o.customer_email || null,
  customer_phone: o.shipping_mobile,
  shipping_address: o.shipping_address || '',
  division: o.shipping_division || null,
  district: o.shipping_district || null,
  upazila: o.shipping_upazila || null,
  payment_method: o.payment_method,
  payment_status: o.payment_status,
  transaction_id: o.payment_trx_id || null,
  sender_number: o.payment_sender_number || null,
  subtotal: o.subtotal,
  shipping_cost: o.shipping_cost,
  discount_amount: o.discount_amount,
  total_amount: o.total_amount,
  status: o.status,
  notes: o.customer_note || null,
  created_at: o.created_at,
  updated_at: o.updated_at,
  items: o.items?.map((item: ApiOrderItem) => ({
    id: String(item.id),
    order_id: String(item.order_id),
    product_id: String(item.product_id),
    product_name: item.product_name,
    product_image: item.product_image,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount_percentage: item.discount_percentage,
    total_price: item.total_price,
    created_at: '',
  })),
});

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
      const queryParams: { status?: string; limit?: number } = {};
      if (params?.status && params.status !== "all") {
        queryParams.status = params.status;
      }
      if (params?.limit) {
        queryParams.limit = params.limit;
      }

      const response = await apiClient.getOrders(queryParams);
      if (response.data?.orders) {
        setOrders(response.data.orders.map(mapApiOrder));
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const getOrder = async (orderId: string): Promise<Order | null> => {
    try {
      const response = await apiClient.getOrder(orderId);
      if (response.data?.order) {
        return mapApiOrder(response.data.order);
      }
      return null;
    } catch (err) {
      console.error("Error fetching order:", err);
      return null;
    }
  };

  const createOrder = async (orderData: CreateOrderData): Promise<{ order: Order | null; error: string | null }> => {
    try {
      const apiData: ApiCreateOrderData = {
        items: orderData.items.map(i => ({ product_id: Number(i.product_id), quantity: i.quantity })),
        shipping_name: orderData.shipping_name,
        shipping_mobile: orderData.shipping_mobile,
        shipping_division: orderData.shipping_division,
        shipping_district: orderData.shipping_district,
        shipping_upazila: orderData.shipping_upazila,
        shipping_address: orderData.shipping_address,
        payment_method: orderData.payment_method,
        customer_note: orderData.customer_note,
        payment_trx_id: orderData.payment_trx_id,
        payment_sender_number: orderData.payment_sender_number,
      };

      const response = await apiClient.createOrder(apiData);
      if (response.error) {
        return { order: null, error: response.error };
      }
      if (response.data?.order) {
        return { order: mapApiOrder(response.data.order), error: null };
      }
      return { order: null, error: 'Unknown error' };
    } catch (err) {
      console.error("Error creating order:", err);
      return { order: null, error: (err as Error).message };
    }
  };

  const updateOrderStatus = async (orderId: string, status: string): Promise<boolean> => {
    try {
      const response = await apiClient.updateOrderStatus(orderId, status);
      if (response.error) {
        toast.error("স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে");
        return false;
      }
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
      const response = await apiClient.cancelOrder(orderId);
      if (response.error) {
        toast.error("অর্ডার বাতিল করতে সমস্যা হয়েছে");
        return false;
      }
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
      const response = await apiClient.getOrderStats();
      if (response.data) {
        const stats = response.data;
        const byStatus: Record<string, number> = {};
        stats.status_summary?.forEach((s: { status: string; count: number }) => {
          byStatus[s.status] = s.count;
        });
        return {
          today: stats.today || { count: 0, total_amount: 0 },
          this_month: stats.this_month || { count: 0, total_amount: 0 },
          total: { count: Object.values(byStatus).reduce((a, b) => a + b, 0), total_amount: 0 },
          by_status: byStatus,
        };
      }
      return null;
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
