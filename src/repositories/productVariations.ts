/**
 * Product Variations repository facade. Routes to Supabase or the Hostinger
 * MySQL backend based on getDataSource("product_variations").
 *
 * Supabase cost_price is admin-restricted; we hydrate it via
 * get_product_variations_cost_map when available, mirroring products.ts.
 */
import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "@/lib/apiClient";
import { getDataSource } from "@/lib/dataSource";

export interface ProductVariation {
  id: string;
  product_id: string;
  variation_name: string;
  unit: string;
  weight_value: number;
  price: number;
  cost_price: number;
  stock_quantity: number;
  sku: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type VariationInput = Partial<
  Omit<ProductVariation, "id" | "created_at" | "updated_at">
>;

function normalize(row: any): ProductVariation {
  return {
    id: String(row.id),
    product_id: String(row.product_id),
    variation_name: row.variation_name,
    unit: row.unit,
    weight_value: Number(row.weight_value) || 0,
    price: Number(row.price) || 0,
    cost_price: Number(row.cost_price) || 0,
    stock_quantity: Number(row.stock_quantity) || 0,
    sku: row.sku ?? null,
    is_active: !!row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const SUPA_COLS =
  "id, product_id, variation_name, sku, price, stock_quantity, unit, weight_value, is_active, created_at, updated_at";

async function listSupa(productId?: string): Promise<ProductVariation[]> {
  let q = supabase.from("product_variations").select(SUPA_COLS).order("created_at", { ascending: false });
  if (productId) q = q.eq("product_id", productId);
  const { data, error } = await q;
  if (error) throw error;
  const base = (data || []).map((r) => normalize({ ...r, cost_price: 0 }));
  try {
    const { data: costs } = await supabase.rpc("get_product_variations_cost_map");
    if (costs && costs.length) {
      const map = new Map<string, number>(
        (costs as { id: string; cost_price: number | null }[]).map((c) => [c.id, Number(c.cost_price) || 0])
      );
      return base.map((v) => ({ ...v, cost_price: map.get(v.id) ?? 0 }));
    }
  } catch {
    /* non-admin: keep 0 */
  }
  return base;
}
async function createSupa(input: VariationInput): Promise<ProductVariation> {
  const { data, error } = await supabase
    .from("product_variations")
    .insert(input as any)
    .select(SUPA_COLS)
    .single();
  if (error) throw error;
  return normalize({ ...data, cost_price: input.cost_price ?? 0 });
}
async function updateSupa(id: string, patch: VariationInput): Promise<ProductVariation> {
  const { data, error } = await supabase
    .from("product_variations")
    .update({ ...patch, updated_at: new Date().toISOString() } as any)
    .eq("id", id)
    .select(SUPA_COLS)
    .single();
  if (error) throw error;
  return normalize({ ...data, cost_price: patch.cost_price ?? 0 });
}
async function removeSupa(id: string): Promise<void> {
  const { error } = await supabase.from("product_variations").delete().eq("id", id);
  if (error) throw error;
}

interface MyList { variations: any[] }
interface MyOne { variation: any }
async function listMy(productId?: string): Promise<ProductVariation[]> {
  const qs = productId ? `?product_id=${encodeURIComponent(productId)}` : "";
  const res = await apiClient.get<MyList>(`/api/product-variations${qs}`);
  return (res.variations || []).map(normalize);
}
async function createMy(input: VariationInput): Promise<ProductVariation> {
  const res = await apiClient.post<MyOne>("/api/product-variations", input);
  return normalize(res.variation);
}
async function updateMy(id: string, patch: VariationInput): Promise<ProductVariation> {
  const res = await apiClient.put<MyOne>(`/api/product-variations/${encodeURIComponent(id)}`, patch);
  return normalize(res.variation);
}
async function removeMy(id: string): Promise<void> {
  await apiClient.delete(`/api/product-variations/${encodeURIComponent(id)}`);
}

export const productVariationsRepo = {
  source: () => getDataSource("product_variations"),
  list: (productId?: string) =>
    getDataSource("product_variations") === "mysql" ? listMy(productId) : listSupa(productId),
  create: (input: VariationInput) =>
    getDataSource("product_variations") === "mysql" ? createMy(input) : createSupa(input),
  update: (id: string, patch: VariationInput) =>
    getDataSource("product_variations") === "mysql" ? updateMy(id, patch) : updateSupa(id, patch),
  remove: (id: string) =>
    getDataSource("product_variations") === "mysql" ? removeMy(id) : removeSupa(id),
};