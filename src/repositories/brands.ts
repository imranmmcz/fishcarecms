/**
 * Brands repository facade. Routes to Supabase or the Hostinger MySQL
 * backend based on getDataSource("brands").
 */
import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "@/lib/apiClient";
import { getDataSource } from "@/lib/dataSource";

export interface Brand {
  id: string;
  name: string;
  name_bn: string | null;
  company_id: string | null;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type BrandInput = Partial<Omit<Brand, "id" | "created_at" | "updated_at">>;

function normalize(row: any): Brand {
  return {
    id: String(row.id),
    name: row.name,
    name_bn: row.name_bn ?? null,
    company_id: row.company_id ? String(row.company_id) : null,
    logo_url: row.logo_url ?? null,
    description: row.description ?? null,
    is_active: !!row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function listSupa(): Promise<Brand[]> {
  const { data, error } = await supabase.from("brands").select("*").order("name");
  if (error) throw error;
  return (data || []).map(normalize);
}
async function createSupa(input: BrandInput): Promise<Brand> {
  const { data, error } = await supabase.from("brands").insert(input as any).select("*").single();
  if (error) throw error;
  return normalize(data);
}
async function updateSupa(id: string, patch: BrandInput): Promise<Brand> {
  const { data, error } = await supabase.from("brands").update(patch as any).eq("id", id).select("*").single();
  if (error) throw error;
  return normalize(data);
}
async function removeSupa(id: string): Promise<void> {
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) throw error;
}

interface MyList { brands: any[] }
interface MyOne { brand: any }
async function listMy(): Promise<Brand[]> {
  const res = await apiClient.get<MyList>("/api/brands");
  return (res.brands || []).map(normalize);
}
async function createMy(input: BrandInput): Promise<Brand> {
  const res = await apiClient.post<MyOne>("/api/brands", input);
  return normalize(res.brand);
}
async function updateMy(id: string, patch: BrandInput): Promise<Brand> {
  const res = await apiClient.put<MyOne>(`/api/brands/${encodeURIComponent(id)}`, patch);
  return normalize(res.brand);
}
async function removeMy(id: string): Promise<void> {
  await apiClient.delete(`/api/brands/${encodeURIComponent(id)}`);
}

export const brandsRepo = {
  source: () => getDataSource("brands"),
  list: () => (getDataSource("brands") === "mysql" ? listMy() : listSupa()),
  create: (input: BrandInput) =>
    getDataSource("brands") === "mysql" ? createMy(input) : createSupa(input),
  update: (id: string, patch: BrandInput) =>
    getDataSource("brands") === "mysql" ? updateMy(id, patch) : updateSupa(id, patch),
  remove: (id: string) =>
    getDataSource("brands") === "mysql" ? removeMy(id) : removeSupa(id),
};