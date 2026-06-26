/**
 * Orders Hook — delegates to `ordersRepo` so queries follow the
 * Admin → Database Config routing (Supabase ⇄ MySQL).
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ordersRepo,
  type Order,
  type OrderItem,
  type OrderStats,
  type CreateOrderInput,
} from "@/repositories/orders";

export type { Order, OrderItem, OrderStats } from "@/repositories/orders";
export type CreateOrderData = CreateOrderInput;

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = useCallback(async (params?: { status?: string; limit?: number }) => {
    if (!user) { setOrders([]); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const rows = await ordersRepo.list({
        userScope: "self",
        userId: user.id,
        status: params?.status,
        limit: params?.limit,
      });
      setOrders(rows);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err as Error);
    } finally { setIsLoading(false); }
  }, [user]);

  const getOrder = async (orderId: string): Promise<Order | null> => {
    try {
      return await ordersRepo.get(orderId);
    } catch (err) {
      console.error("Error fetching order:", err);
      return null;
    }
  };

  const createOrder = async (orderData: CreateOrderData): Promise<{ order: Order | null; error: string | null }> => {
    try {
      const order = await ordersRepo.create({ ...orderData, user_id: user?.id || null });
      return { order, error: null };
    } catch (err) {
      console.error("Error creating order:", err);
      return { order: null, error: (err as Error).message };
    }
  };

  const updateOrderStatus = async (orderId: string, status: string): Promise<boolean> => {
    try {
      await ordersRepo.updateStatus(orderId, status);
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
      return await ordersRepo.stats();
    } catch (err) {
      console.error("Error fetching order stats:", err);
      return null;
    }
  };

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return { orders, isLoading, error, fetchOrders, getOrder, createOrder, updateOrderStatus, cancelOrder, getOrderStats, refetch: fetchOrders };
}
