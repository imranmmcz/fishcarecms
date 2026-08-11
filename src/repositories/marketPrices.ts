/**
 * Market Prices repository facade (Supabase ⇄ MySQL).
 */
import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "@/lib/apiClient";
import { getDataSource } from "@/lib/dataSource";

export interface MarketPrice {
  id: string;
  fish_name: string;
  fish_name_bn: string;
  price_per_kg: number;
  min_price: number | null;
  max_price: number | null;
  division: string;
  district: string;
  upazila: string;
  market_name: string | null;
  price_date: string;
  created_at: string;
  updated_at: string;
}

export type MarketPriceInput = Partial<Omit<MarketPrice, "id" | "created_at" | "updated_at">>;

export interface MarketPriceQuery {
  search?: string;
  division?: string;
  district?: string;
  upazila?: string;
  limit?: number;
}

function normalize(row: any): MarketPrice {
  return {
    id: String(row.id),
    fish_name: row.fish_name,
    fish_name_bn: row.fish_name_bn,
    price_per_kg: Number(row.price_per_kg) || 0,
    min_price: row.min_price === null || row.min_price === undefined ? null : Number(row.min_price),
    max_price: row.max_price === null || row.max_price === undefined ? null : Number(row.max_price),
    division: row.division,
    district: row.district,
    upazila: row.upazila,
    market_name: row.market_name ?? null,
    price_date: row.price_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const isMy = () => getDataSource("market_prices") === "mysql";

async function listSupa(q: MarketPriceQuery = {}): Promise<MarketPrice[]> {
  let query = supabase.from("market_prices").select("*").order("updated_at", { ascending: false });
  if (q.division) query = query.eq("division", q.division);
  if (q.district) query = query.eq("district", q.district);
  if (q.upazila) query = query.eq("upazila", q.upazila);
  if (q.search) {
    query = query.or(
      `fish_name.ilike.%${q.search}%,fish_name_bn.ilike.%${q.search}%,division.ilike.%${q.search}%,district.ilike.%${q.search}%`
    );
  }
  if (q.limit) query = query.limit(q.limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(normalize);
}

async function listMy(q: MarketPriceQuery = {}): Promise<MarketPrice[]> {
  const params = new URLSearchParams();
  if (q.search) params.set("search", q.search);
  if (q.division) params.set("division", q.division);
  if (q.district) params.set("district", q.district);
  if (q.upazila) params.set("upazila", q.upazila);
  params.set("limit", String(q.limit ?? 500));
  const res = await apiClient.get<{ prices: any[] }>(`/api/market-prices?${params.toString()}`);
  return (res.prices || []).map(normalize);
}

export const marketPricesRepo = {
  source: () => getDataSource("market_prices"),
  list: (q?: MarketPriceQuery) => (isMy() ? listMy(q) : listSupa(q)),
  async create(input: MarketPriceInput): Promise<MarketPrice> {
    if (isMy()) {
      const res = await apiClient.post<{ price: any }>("/api/market-prices", input);
      return normalize(res.price);
    }
    const { data, error } = await supabase.from("market_prices").insert(input as any).select("*").single();
    if (error) throw error;
    return normalize(data);
  },
  async update(id: string, patch: MarketPriceInput): Promise<MarketPrice> {
    if (isMy()) {
      const res = await apiClient.put<{ price: any }>(`/api/market-prices/${encodeURIComponent(id)}`, patch);
      return normalize(res.price);
    }
    const { data, error } = await supabase
      .from("market_prices")
      .update(patch as any)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return normalize(data);
  },
  async remove(id: string): Promise<void> {
    if (isMy()) {
      await apiClient.delete(`/api/market-prices/${encodeURIComponent(id)}`);
      return;
    }
    const { error } = await supabase.from("market_prices").delete().eq("id", id);
    if (error) throw error;
  },
};
