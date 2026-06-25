/**
 * Products repository facade.
 *
 * Single entry point used by ProductsContext / pages.
 * Routes each call to Supabase or the Hostinger MySQL backend based on
 * `getDataSource("products")` from `src/lib/dataSource.ts`.
 *
 * Public-facing Product shape is identical regardless of backend so
 * callers don't need to branch.
 */
import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "@/lib/apiClient";
import { getDataSource } from "@/lib/dataSource";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  cost_price: number;
  discount_percentage: number | null;
  category: string;
  image_url: string | null;
  external_link: string | null;
  stock_quantity: number;
  sku: string | null;
  unit: string | null;
  reorder_level: number | null;
  company_id: string | null;
  brand_id: string | null;
  created_at: string;
  updated_at: string;
}

export type ProductInput = Omit<Product, "id" | "created_at" | "updated_at">;

const SUPABASE_COLUMNS =
  "id, name, description, price, discount_percentage, category, image_url, external_link, stock_quantity, sku, unit, reorder_level, company_id, brand_id, created_at, updated_at";

/** Normalize a row coming from either backend into the canonical Product shape. */
function normalize(row: any): Product {
  return {
    id: String(row.id),
    name: row.name,
    description: row.description ?? null,
    price: Number(row.price) || 0,
    cost_price: Number(row.cost_price) || 0,
    discount_percentage:
      row.discount_percentage === null || row.discount_percentage === undefined
        ? null
        : Number(row.discount_percentage),
    category: row.category,
    image_url: row.image_url ?? null,
    external_link: row.external_link ?? null,
    stock_quantity: Number(row.stock_quantity) || 0,
    sku: row.sku ?? null,
    unit: row.unit ?? null,
    reorder_level:
      row.reorder_level === null || row.reorder_level === undefined
        ? null
        : Number(row.reorder_level),
    company_id: row.company_id ?? null,
    brand_id: row.brand_id ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ---------------- Supabase implementation ----------------

async function listFromSupabase(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(SUPABASE_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const base = (data || []).map((p) => normalize({ ...p, cost_price: 0 }));

  // Admin-only enrichment with cost prices via security-definer RPC.
  try {
    const { data: costData } = await supabase.rpc("get_products_cost_map");
    if (costData && costData.length > 0) {
      const map = new Map<string, number>(
        (costData as { id: string; cost_price: number | null }[]).map((c) => [
          c.id,
          Number(c.cost_price) || 0,
        ])
      );
      return base.map((p) => ({ ...p, cost_price: map.get(p.id) ?? 0 }));
    }
  } catch {
    /* non-admin: cost_price stays 0 */
  }
  return base;
}

async function createInSupabase(input: ProductInput): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert(input)
    .select(SUPABASE_COLUMNS)
    .single();
  if (error) throw error;
  return normalize({ ...data, cost_price: input.cost_price ?? 0 });
}

async function updateInSupabase(id: string, patch: Partial<Product>): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .select(SUPABASE_COLUMNS)
    .single();
  if (error) throw error;
  return normalize({ ...data, cost_price: patch.cost_price ?? 0 });
}

async function deleteInSupabase(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

// ---------------- MySQL backend implementation ----------------

interface MySQLListResponse {
  products: any[];
  total: number;
}
interface MySQLSingleResponse {
  product: any;
}

async function listFromMysql(): Promise<Product[]> {
  // Backend returns paginated, fetch a big page; tighten later if needed.
  const res = await apiClient.get<MySQLListResponse>(
    "/api/products?limit=1000&offset=0"
  );
  return (res.products || []).map(normalize);
}

async function createInMysql(input: ProductInput): Promise<Product> {
  const res = await apiClient.post<MySQLSingleResponse>("/api/products", input);
  return normalize(res.product);
}

async function updateInMysql(id: string, patch: Partial<Product>): Promise<Product> {
  const res = await apiClient.put<MySQLSingleResponse>(
    `/api/products/${encodeURIComponent(id)}`,
    patch
  );
  return normalize(res.product);
}

async function deleteInMysql(id: string): Promise<void> {
  await apiClient.delete(`/api/products/${encodeURIComponent(id)}`);
}

// ---------------- Public facade ----------------

export const productsRepo = {
  source: () => getDataSource("products"),

  async list(): Promise<Product[]> {
    return getDataSource("products") === "mysql"
      ? listFromMysql()
      : listFromSupabase();
  },

  async create(input: ProductInput): Promise<Product> {
    return getDataSource("products") === "mysql"
      ? createInMysql(input)
      : createInSupabase(input);
  },

  async update(id: string, patch: Partial<Product>): Promise<Product> {
    return getDataSource("products") === "mysql"
      ? updateInMysql(id, patch)
      : updateInSupabase(id, patch);
  },

  async remove(id: string): Promise<void> {
    return getDataSource("products") === "mysql"
      ? deleteInMysql(id)
      : deleteInSupabase(id);
  },
};

/** Pure helper kept for backward compatibility with existing imports. */
export const getDiscountedPrice = (price: number, discountPercentage: number): number => {
  if (discountPercentage <= 0) return price;
  return Math.round(price * (1 - discountPercentage / 100));
};