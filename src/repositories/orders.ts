/**
 * Orders repository facade.
 *
 * Routes to Supabase or the Hostinger MySQL backend based on
 * `getDataSource("orders")` from `src/lib/dataSource.ts`.
 *
 * The public Order / OrderItem shape mirrors `useOrders` so existing
 * consumers don't have to branch on the active backend.
 */
import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "@/lib/apiClient";
import { getDataSource } from "@/lib/dataSource";

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

export interface CreateOrderInput {
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
  user_id?: string | null;
}

export interface ListParams {
  status?: string;
  limit?: number;
  userScope?: "self" | "all";
  userId?: string | null;
}

function normalizeOrder(o: any): Order {
  return {
    id: String(o.id),
    order_number: o.order_number,
    user_id: o.user_id ?? null,
    customer_name: o.customer_name ?? "",
    customer_email: o.customer_email ?? null,
    customer_phone: o.customer_phone ?? "",
    shipping_address: o.shipping_address ?? "",
    division: o.division ?? null,
    district: o.district ?? null,
    upazila: o.upazila ?? null,
    payment_method: o.payment_method ?? "cod",
    payment_status: o.payment_status ?? "pending",
    transaction_id: o.transaction_id ?? null,
    sender_number: o.sender_number ?? null,
    subtotal: Number(o.subtotal) || 0,
    shipping_cost: Number(o.shipping_cost) || 0,
    discount_amount: Number(o.discount_amount) || 0,
    total_amount: Number(o.total_amount) || 0,
    status: o.status ?? "pending",
    notes: o.notes ?? null,
    created_at: o.created_at,
    updated_at: o.updated_at ?? o.created_at,
  };
}

function normalizeItem(i: any): OrderItem {
  return {
    id: String(i.id),
    order_id: String(i.order_id),
    product_id: String(i.product_id),
    product_name: i.product_name,
    product_image: i.product_image ?? null,
    quantity: Number(i.quantity) || 0,
    unit_price: Number(i.unit_price) || 0,
    discount_percentage: Number(i.discount_percentage) || 0,
    total_price: Number(i.total_price) || 0,
    created_at: i.created_at,
  };
}

// ---------------- Supabase implementation ----------------

async function listFromSupabase(params: ListParams = {}): Promise<Order[]> {
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (params.userScope !== "all" && params.userId) {
    query = query.eq("user_id", params.userId);
  }
  if (params.status && params.status !== "all") query = query.eq("status", params.status);
  if (params.limit) query = query.limit(params.limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(normalizeOrder);
}

async function getFromSupabase(orderId: string): Promise<Order | null> {
  const { data: o, error } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (error || !o) return null;
  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", orderId);
  const order = normalizeOrder(o);
  order.items = (items || []).map(normalizeItem);
  return order;
}

async function createInSupabase(input: CreateOrderInput): Promise<Order> {
  const productIds = input.items.map((i) => i.product_id);
  const { data: products } = await supabase.from("products").select("*").in("id", productIds);
  if (!products) throw new Error("পণ্য পাওয়া যায়নি");

  const subtotal = input.items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.product_id);
    if (!product) return sum;
    const discounted = product.price * (1 - (product.discount_percentage || 0) / 100);
    return sum + discounted * item.quantity;
  }, 0);
  const shippingCost = input.shipping_cost || 0;
  const referralDiscount = input.referral_discount || 0;
  const totalAmount = Math.max(subtotal - referralDiscount, 0) + shippingCost;

  const { data: orderNumData } = await supabase.rpc("generate_order_number");
  const orderNumber = orderNumData || `ORD-${Date.now()}`;

  const { data: newOrder, error: insertErr } = await supabase.from("orders").insert({
    order_number: orderNumber,
    user_id: input.user_id ?? null,
    customer_name: input.shipping_name,
    customer_phone: input.shipping_mobile,
    shipping_address: input.shipping_address || "",
    division: input.shipping_division || null,
    district: input.shipping_district || null,
    upazila: input.shipping_upazila || null,
    payment_method: input.payment_method,
    transaction_id: input.payment_trx_id || null,
    sender_number: input.payment_sender_number || null,
    notes: input.customer_note || null,
    subtotal,
    shipping_cost: shippingCost,
    total_amount: totalAmount,
    referral_code: input.referral_code || null,
    referral_discount: referralDiscount,
    discount_amount: referralDiscount,
  }).select().single();
  if (insertErr) throw insertErr;

  const orderItems = input.items.map((item) => {
    const product = products.find((p) => p.id === item.product_id)!;
    const discounted = product.price * (1 - (product.discount_percentage || 0) / 100);
    return {
      order_id: newOrder.id,
      product_id: item.product_id,
      product_name: product.name,
      product_image: product.image_url,
      quantity: item.quantity,
      unit_price: product.price,
      discount_percentage: product.discount_percentage || 0,
      total_price: discounted * item.quantity,
    };
  });
  await supabase.from("order_items").insert(orderItems);

  return normalizeOrder(newOrder);
}

async function updateStatusInSupabase(orderId: string, status: string): Promise<void> {
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) throw error;
}

async function statsFromSupabase(): Promise<OrderStats | null> {
  const { data } = await supabase.from("orders").select("status, total_amount, created_at");
  if (!data) return null;
  return aggregateStats(data);
}

function aggregateStats(rows: any[]): OrderStats {
  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.substring(0, 7);
  const byStatus: Record<string, number> = {};
  let todayCount = 0, todayTotal = 0, monthCount = 0, monthTotal = 0;
  rows.forEach((o) => {
    byStatus[o.status] = (byStatus[o.status] || 0) + 1;
    const ca = (o.created_at || "").toString();
    const amt = Number(o.total_amount) || 0;
    if (ca.startsWith(today)) { todayCount++; todayTotal += amt; }
    if (ca.startsWith(thisMonth)) { monthCount++; monthTotal += amt; }
  });
  return {
    today: { count: todayCount, total_amount: todayTotal },
    this_month: { count: monthCount, total_amount: monthTotal },
    total: { count: rows.length, total_amount: rows.reduce((s, o) => s + (Number(o.total_amount) || 0), 0) },
    by_status: byStatus,
  };
}

// ---------------- MySQL implementation ----------------

interface MysqlListResponse { orders: any[]; total: number }
interface MysqlSingleResponse { order: any }

async function listFromMysql(params: ListParams = {}): Promise<Order[]> {
  const qs = new URLSearchParams();
  if (params.status && params.status !== "all") qs.set("status", params.status);
  qs.set("limit", String(params.limit ?? 200));
  qs.set("offset", "0");
  // Backend auto-scopes non-admin callers to their own orders via JWT.
  const res = await apiClient.get<MysqlListResponse>(`/api/orders?${qs.toString()}`);
  return (res.orders || []).map(normalizeOrder);
}

async function getFromMysql(orderId: string): Promise<Order | null> {
  try {
    const res = await apiClient.get<MysqlSingleResponse>(
      `/api/orders/${encodeURIComponent(orderId)}`
    );
    const o = res.order;
    if (!o) return null;
    const order = normalizeOrder(o);
    order.items = (o.items || []).map(normalizeItem);
    return order;
  } catch {
    return null;
  }
}

async function createInMysql(input: CreateOrderInput): Promise<Order> {
  const res = await apiClient.post<MysqlSingleResponse>("/api/orders", input);
  return normalizeOrder(res.order);
}

async function updateStatusInMysql(orderId: string, status: string): Promise<void> {
  await apiClient.patch(`/api/orders/${encodeURIComponent(orderId)}/status`, { status });
}

async function statsFromMysql(): Promise<OrderStats | null> {
  try {
    // Backend `/stats/summary` is admin-only; fall back to derived stats from list.
    const res = await apiClient.get<MysqlListResponse>(`/api/orders?limit=1000&offset=0`);
    return aggregateStats(res.orders || []);
  } catch {
    return null;
  }
}

// ---------------- Public facade ----------------

export const ordersRepo = {
  source: () => getDataSource("orders"),

  list(params?: ListParams): Promise<Order[]> {
    return getDataSource("orders") === "mysql"
      ? listFromMysql(params)
      : listFromSupabase(params);
  },

  get(orderId: string): Promise<Order | null> {
    return getDataSource("orders") === "mysql"
      ? getFromMysql(orderId)
      : getFromSupabase(orderId);
  },

  create(input: CreateOrderInput): Promise<Order> {
    return getDataSource("orders") === "mysql"
      ? createInMysql(input)
      : createInSupabase(input);
  },

  updateStatus(orderId: string, status: string): Promise<void> {
    return getDataSource("orders") === "mysql"
      ? updateStatusInMysql(orderId, status)
      : updateStatusInSupabase(orderId, status);
  },

  cancel(orderId: string): Promise<void> {
    return this.updateStatus(orderId, "cancelled");
  },

  stats(): Promise<OrderStats | null> {
    return getDataSource("orders") === "mysql"
      ? statsFromMysql()
      : statsFromSupabase();
  },
};