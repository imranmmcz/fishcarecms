/**
 * Purchase Orders repository facade.
 * Routes between Supabase and the Hostinger MySQL backend based on
 * getDataSource("purchase_orders").
 *
 * Supabase path preserves the existing two-step flow
 * (RPC generate_purchase_order_number + insert order + insert items).
 * MySQL path uses a single transactional POST that inserts the order,
 * its items, and returns the full row.
 */
import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "@/lib/apiClient";
import { getDataSource } from "@/lib/dataSource";

export interface PurchaseOrderItem {
  id?: string;
  purchase_order_id?: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  received_quantity?: number;
}

export interface PurchaseOrder {
  id: string;
  order_number: string;
  company_id: string | null;
  status: string;
  order_date: string;
  expected_date?: string | null;
  received_date?: string | null;
  subtotal: number;
  tax_amount?: number;
  shipping_cost?: number;
  total_amount: number;
  notes: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at?: string;
  companies?: { name: string } | null;
  purchase_order_items?: PurchaseOrderItem[];
}

export interface CreatePurchaseInput {
  order: {
    company_id?: string | null;
    subtotal: number;
    total_amount: number;
    notes?: string | null;
    created_by?: string | null;
    status?: string;
    tax_amount?: number;
    shipping_cost?: number;
  };
  items: PurchaseOrderItem[];
}

export interface ListOptions {
  search?: string;
  status?: string;
  limit?: number;
  includeItems?: boolean;
}

function normalize(row: any): PurchaseOrder {
  return {
    id: String(row.id),
    order_number: row.order_number,
    company_id: row.company_id != null ? String(row.company_id) : null,
    status: row.status,
    order_date: row.order_date,
    expected_date: row.expected_date ?? null,
    received_date: row.received_date ?? null,
    subtotal: Number(row.subtotal) || 0,
    tax_amount: Number(row.tax_amount) || 0,
    shipping_cost: Number(row.shipping_cost) || 0,
    total_amount: Number(row.total_amount) || 0,
    notes: row.notes ?? null,
    created_by: row.created_by != null ? String(row.created_by) : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    companies: row.companies ?? null,
    purchase_order_items: row.purchase_order_items ?? undefined,
  };
}

// ---------------- Supabase ----------------
async function listSupa(opts: ListOptions): Promise<PurchaseOrder[]> {
  let q = supabase
    .from("purchase_orders")
    .select("*, companies(name), purchase_order_items(quantity, total_cost, product_id, unit_cost)")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 200);
  if (opts.status) q = q.eq("status", opts.status);
  const { data, error } = await q;
  if (error) throw error;
  let rows = (data || []).map(normalize);
  if (opts.search) {
    const s = opts.search.toLowerCase();
    rows = rows.filter(
      r =>
        r.order_number?.toLowerCase().includes(s) ||
        r.companies?.name?.toLowerCase().includes(s),
    );
  }
  return rows;
}

async function getSupa(id: string): Promise<PurchaseOrder | null> {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("*, companies(name), purchase_order_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? normalize(data) : null;
}

async function createSupa(input: CreatePurchaseInput): Promise<PurchaseOrder> {
  const { data: numData } = await supabase.rpc("generate_purchase_order_number");
  const orderNumber = (numData as string) || `PO-${Date.now()}`;

  const { data: order, error: orderErr } = await supabase
    .from("purchase_orders")
    .insert({
      order_number: orderNumber,
      company_id: input.order.company_id || null,
      subtotal: input.order.subtotal,
      total_amount: input.order.total_amount,
      notes: input.order.notes ?? null,
      created_by: input.order.created_by ?? null,
      status: input.order.status || "pending",
    })
    .select()
    .single();
  if (orderErr) throw orderErr;

  const orderItems = input.items.map(i => ({
    purchase_order_id: order.id,
    product_id: i.product_id,
    quantity: i.quantity,
    unit_cost: i.unit_cost,
    total_cost: i.total_cost,
  }));
  const { error: itemsErr } = await supabase
    .from("purchase_order_items")
    .insert(orderItems);
  if (itemsErr) throw itemsErr;

  return normalize(order);
}

async function updateSupa(id: string, patch: Partial<PurchaseOrder>): Promise<void> {
  const { error } = await supabase
    .from("purchase_orders")
    .update(patch as any)
    .eq("id", id);
  if (error) throw error;
}

async function removeSupa(id: string): Promise<void> {
  const { error } = await supabase.from("purchase_orders").delete().eq("id", id);
  if (error) throw error;
}

// ---------------- MySQL ----------------
interface MyList { purchase_orders: any[] }
interface MyOne { purchase_order: any }

async function listMy(opts: ListOptions): Promise<PurchaseOrder[]> {
  const p = new URLSearchParams();
  if (opts.search) p.set("search", opts.search);
  if (opts.status) p.set("status", opts.status);
  if (opts.limit) p.set("limit", String(opts.limit));
  p.set("include_items", "1");
  const res = await apiClient.get<MyList>(`/api/purchase-orders?${p.toString()}`);
  return (res.purchase_orders || []).map(normalize);
}

async function getMy(id: string): Promise<PurchaseOrder | null> {
  try {
    const res = await apiClient.get<MyOne>(`/api/purchase-orders/${id}`);
    return res.purchase_order ? normalize(res.purchase_order) : null;
  } catch {
    return null;
  }
}

async function createMy(input: CreatePurchaseInput): Promise<PurchaseOrder> {
  const res = await apiClient.post<MyOne>("/api/purchase-orders", {
    order: input.order,
    items: input.items,
  });
  return normalize(res.purchase_order);
}

async function updateMy(id: string, patch: Partial<PurchaseOrder>): Promise<void> {
  await apiClient.patch(`/api/purchase-orders/${id}`, patch);
}

async function removeMy(id: string): Promise<void> {
  await apiClient.delete(`/api/purchase-orders/${id}`);
}

export const purchasesRepo = {
  source: () => getDataSource("purchase_orders"),
  list: (opts: ListOptions = {}) =>
    getDataSource("purchase_orders") === "mysql" ? listMy(opts) : listSupa(opts),
  get: (id: string) =>
    getDataSource("purchase_orders") === "mysql" ? getMy(id) : getSupa(id),
  create: (input: CreatePurchaseInput) =>
    getDataSource("purchase_orders") === "mysql" ? createMy(input) : createSupa(input),
  update: (id: string, patch: Partial<PurchaseOrder>) =>
    getDataSource("purchase_orders") === "mysql" ? updateMy(id, patch) : updateSupa(id, patch),
  remove: (id: string) =>
    getDataSource("purchase_orders") === "mysql" ? removeMy(id) : removeSupa(id),
};