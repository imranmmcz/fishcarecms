/**
 * Categories repository facade. Routes to Supabase or the Hostinger MySQL
 * backend based on getDataSource("categories").
 */
import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "@/lib/apiClient";
import { getDataSource } from "@/lib/dataSource";

export interface Category {
  id: string;
  name: string;
  name_bn: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  display_order: number;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export type CategoryInput = Partial<Omit<Category, "id" | "created_at" | "updated_at">>;

function normalize(row: any): Category {
  return {
    id: String(row.id),
    name: row.name,
    name_bn: row.name_bn,
    slug: row.slug,
    description: row.description ?? null,
    icon: row.icon ?? null,
    is_active: !!row.is_active,
    display_order: Number(row.display_order) || 0,
    parent_id: row.parent_id ? String(row.parent_id) : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ---- Supabase ----
async function listSupa(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data || []).map(normalize);
}
async function createSupa(input: CategoryInput): Promise<Category> {
  const slug = input.slug || input.name?.toLowerCase().replace(/\s+/g, "-") || "";
  const { data, error } = await supabase
    .from("categories")
    .insert({ ...input, slug } as any)
    .select("*")
    .single();
  if (error) throw error;
  return normalize(data);
}
async function updateSupa(id: string, patch: CategoryInput): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .update(patch as any)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return normalize(data);
}
async function removeSupa(id: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

// ---- MySQL ----
interface MyList { categories: any[] }
interface MyOne { category: any }
async function listMy(): Promise<Category[]> {
  const res = await apiClient.get<MyList>("/api/categories");
  return (res.categories || []).map(normalize);
}
async function createMy(input: CategoryInput): Promise<Category> {
  const res = await apiClient.post<MyOne>("/api/categories", input);
  return normalize(res.category);
}
async function updateMy(id: string, patch: CategoryInput): Promise<Category> {
  const res = await apiClient.put<MyOne>(`/api/categories/${encodeURIComponent(id)}`, patch);
  return normalize(res.category);
}
async function removeMy(id: string): Promise<void> {
  await apiClient.delete(`/api/categories/${encodeURIComponent(id)}`);
}

export const categoriesRepo = {
  source: () => getDataSource("categories"),
  list: () => (getDataSource("categories") === "mysql" ? listMy() : listSupa()),
  create: (input: CategoryInput) =>
    getDataSource("categories") === "mysql" ? createMy(input) : createSupa(input),
  update: (id: string, patch: CategoryInput) =>
    getDataSource("categories") === "mysql" ? updateMy(id, patch) : updateSupa(id, patch),
  remove: (id: string) =>
    getDataSource("categories") === "mysql" ? removeMy(id) : removeSupa(id),
};