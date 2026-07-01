/**
 * Stock Adjustments repository facade.
 * Routes to Supabase or the Hostinger MySQL backend based on
 * getDataSource("stock_adjustments").
 *
 * The Supabase path preserves the existing two-step flow
 * (insert adjustment + update products.stock_quantity).
 * The MySQL path uses a single transactional POST endpoint that
 * performs both mutations atomically and returns the new row.
 */
import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "@/lib/apiClient";
import { getDataSource } from "@/lib/dataSource";

export interface StockAdjustment {
  id: string;
  product_id: string;
  adjustment_type: string;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  products?: { name: string; sku: string | null } | null;
  product?: { name: string; sku: string | null } | null;
}

export interface StockAdjustmentInput {
  product_id: string;
  adjustment_type: string;
  quantity_change: number;
  /** Ignored by MySQL (recomputed server-side inside a txn). */
  previous_quantity?: number;
  /** Ignored by MySQL (recomputed server-side inside a txn). */
  new_quantity?: number;
  reference_type?: string | null;
  reference_id?: string | null;
  notes?: string | null;
  created_by?: string | null;
}

export interface ListOptions {
  productId?: string;
  type?: string;
  limit?: number;
  includeProduct?: boolean;
}

function normalize(row: any): StockAdjustment {
  const productJoin =
    row.products ?? row.product ?? null;
  return {
    id: String(row.id),
    product_id: String(row.product_id),
    adjustment_type: row.adjustment_type,
    quantity_change: Number(row.quantity_change) || 0,
    previous_quantity: Number(row.previous_quantity) || 0,
    new_quantity: Number(row.new_quantity) || 0,
    reference_type: row.reference_type ?? null,
    reference_id: row.reference_id ?? null,
    notes: row.notes ?? null,
    created_by: row.created_by != null ? String(row.created_by) : null,
    created_at: row.created_at,
    products: productJoin
      ? { name: productJoin.name, sku: productJoin.sku ?? null }
      : null,
    product: productJoin
      ? { name: productJoin.name, sku: productJoin.sku ?? null }
      : null,
  };
}

// ---------------- Supabase ----------------
async function listSupa(opts: ListOptions): Promise<StockAdjustment[]> {
  const cols = opts.includeProduct
    ? "*, products(name, sku)"
    : "*";
  let q = supabase
    .from("stock_adjustments")
    .select(cols)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 100);
  if (opts.productId) q = q.eq("product_id", opts.productId);
  if (opts.type) q = q.eq("adjustment_type", opts.type);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(normalize);
}

async function createSupa(input: StockAdjustmentInput): Promise<StockAdjustment> {
  // Fetch the current stock so previous/new are correct.
  const { data: prod, error: prodErr } = await supabase
    .from("products")
    .select("stock_quantity")
    .eq("id", input.product_id)
    .single();
  if (prodErr) throw prodErr;

  const prev = Number(prod?.stock_quantity) || 0;
  const next = prev + Number(input.quantity_change);
  if (next < 0) throw new Error("Insufficient stock");

  const insertPayload = {
    product_id: input.product_id,
    adjustment_type: input.adjustment_type,
    quantity_change: input.quantity_change,
    previous_quantity: prev,
    new_quantity: next,
    reference_type: input.reference_type ?? null,
    reference_id: input.reference_id ?? null,
    notes: input.notes ?? null,
  };

  const { data, error } = await supabase
    .from("stock_adjustments")
    .insert(insertPayload as any)
    .select("*")
    .single();
  if (error) throw error;

  const { error: updErr } = await supabase
    .from("products")
    .update({ stock_quantity: next })
    .eq("id", input.product_id);
  if (updErr) throw updErr;

  return normalize(data);
}

// ---------------- MySQL ----------------
interface MyList { adjustments: any[] }
interface MyOne { adjustment: any }

async function listMy(opts: ListOptions): Promise<StockAdjustment[]> {
  const p = new URLSearchParams();
  if (opts.productId) p.set("product_id", opts.productId);
  if (opts.type) p.set("type", opts.type);
  if (opts.limit) p.set("limit", String(opts.limit));
  if (opts.includeProduct) p.set("include_product", "1");
  const qs = p.toString() ? `?${p.toString()}` : "";
  const res = await apiClient.get<MyList>(`/api/stock-adjustments${qs}`);
  return (res.adjustments || []).map(normalize);
}

async function createMy(input: StockAdjustmentInput): Promise<StockAdjustment> {
  const res = await apiClient.post<MyOne>("/api/stock-adjustments", {
    product_id: input.product_id,
    adjustment_type: input.adjustment_type,
    quantity_change: input.quantity_change,
    reference_type: input.reference_type ?? null,
    reference_id: input.reference_id ?? null,
    notes: input.notes ?? null,
  });
  return normalize(res.adjustment);
}

export const stockAdjustmentsRepo = {
  source: () => getDataSource("stock_adjustments"),
  list: (opts: ListOptions = {}) =>
    getDataSource("stock_adjustments") === "mysql" ? listMy(opts) : listSupa(opts),
  create: (input: StockAdjustmentInput) =>
    getDataSource("stock_adjustments") === "mysql" ? createMy(input) : createSupa(input),
};