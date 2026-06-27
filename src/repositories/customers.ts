/**
 * Customers repository facade.
 *
 * Single entry point used by AdminCustomers / AdminPOS.
 * Routes each call to Supabase or the Hostinger MySQL backend based on
 * `getDataSource("customers")` from `src/lib/dataSource.ts`.
 *
 * Canonical Customer shape is identical regardless of backend.
 */
import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "@/lib/apiClient";
import { getDataSource } from "@/lib/dataSource";

export interface Customer {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  division: string | null;
  district: string | null;
  upazila: string | null;
  village: string | null;
  shipping_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CustomerInput = Omit<Customer, "id" | "created_at" | "updated_at">;

function normalize(row: any): Customer {
  return {
    id: String(row.id),
    customer_name: row.customer_name ?? "",
    customer_phone: row.customer_phone ?? "",
    customer_email: row.customer_email ?? null,
    division: row.division ?? null,
    district: row.district ?? null,
    upazila: row.upazila ?? null,
    village: row.village ?? null,
    shipping_address: row.shipping_address ?? null,
    notes: row.notes ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export interface ListParams {
  search?: string;
  limit?: number;
  offset?: number;
}

// ---------------- Supabase ----------------

async function listFromSupabase(params: ListParams = {}): Promise<Customer[]> {
  let q = supabase.from("customers").select("*").order("customer_name", { ascending: true });
  if (params.search) {
    const s = `%${params.search}%`;
    q = q.or(`customer_name.ilike.${s},customer_phone.ilike.${s},customer_email.ilike.${s}`);
  }
  if (params.limit) q = q.limit(params.limit);
  if (params.offset)
    q = q.range(params.offset, params.offset + (params.limit ?? 1000) - 1);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(normalize);
}

async function getFromSupabase(id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? normalize(data) : null;
}

async function createInSupabase(input: Partial<CustomerInput>): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .insert(input as any)
    .select("*")
    .single();
  if (error) throw error;
  return normalize(data);
}

async function upsertInSupabase(input: Partial<CustomerInput>): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .upsert(input as any, { onConflict: "customer_phone" })
    .select("*")
    .single();
  if (error) throw error;
  return normalize(data);
}

async function updateInSupabase(id: string, patch: Partial<Customer>): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return normalize(data);
}

async function deleteInSupabase(id: string): Promise<void> {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}

// ---------------- MySQL ----------------

interface MySQLListResponse {
  customers: any[];
  total?: number;
}
interface MySQLSingleResponse {
  customer: any;
}

function qs(params: ListParams): string {
  const sp = new URLSearchParams();
  if (params.search) sp.set("search", params.search);
  sp.set("limit", String(params.limit ?? 1000));
  sp.set("offset", String(params.offset ?? 0));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

async function listFromMysql(params: ListParams = {}): Promise<Customer[]> {
  const res = await apiClient.get<MySQLListResponse>(`/api/customers${qs(params)}`);
  return (res.customers || []).map(normalize);
}

async function getFromMysql(id: string): Promise<Customer | null> {
  try {
    const res = await apiClient.get<MySQLSingleResponse>(
      `/api/customers/${encodeURIComponent(id)}`
    );
    return res.customer ? normalize(res.customer) : null;
  } catch (e: any) {
    if (e?.status === 404) return null;
    throw e;
  }
}

async function createInMysql(input: Partial<CustomerInput>): Promise<Customer> {
  const res = await apiClient.post<MySQLSingleResponse>("/api/customers", input);
  return normalize(res.customer);
}

async function upsertInMysql(input: Partial<CustomerInput>): Promise<Customer> {
  const res = await apiClient.post<MySQLSingleResponse>(
    "/api/customers?upsert=phone",
    input
  );
  return normalize(res.customer);
}

async function updateInMysql(id: string, patch: Partial<Customer>): Promise<Customer> {
  const res = await apiClient.put<MySQLSingleResponse>(
    `/api/customers/${encodeURIComponent(id)}`,
    patch
  );
  return normalize(res.customer);
}

async function deleteInMysql(id: string): Promise<void> {
  await apiClient.delete(`/api/customers/${encodeURIComponent(id)}`);
}

// ---------------- Public facade ----------------

export const customersRepo = {
  source: () => getDataSource("customers"),

  async list(params: ListParams = {}): Promise<Customer[]> {
    return getDataSource("customers") === "mysql"
      ? listFromMysql(params)
      : listFromSupabase(params);
  },

  async get(id: string): Promise<Customer | null> {
    return getDataSource("customers") === "mysql"
      ? getFromMysql(id)
      : getFromSupabase(id);
  },

  async create(input: Partial<CustomerInput>): Promise<Customer> {
    return getDataSource("customers") === "mysql"
      ? createInMysql(input)
      : createInSupabase(input);
  },

  async upsertByPhone(input: Partial<CustomerInput>): Promise<Customer> {
    return getDataSource("customers") === "mysql"
      ? upsertInMysql(input)
      : upsertInSupabase(input);
  },

  async update(id: string, patch: Partial<Customer>): Promise<Customer> {
    return getDataSource("customers") === "mysql"
      ? updateInMysql(id, patch)
      : updateInSupabase(id, patch);
  },

  async remove(id: string): Promise<void> {
    return getDataSource("customers") === "mysql"
      ? deleteInMysql(id)
      : deleteInSupabase(id);
  },
};