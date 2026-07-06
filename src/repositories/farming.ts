/**
 * Farming repository facade — Ponds, Incomes, Expenses, Samplings, Alerts.
 *
 * Routes to Supabase or the Hostinger MySQL backend per module toggle in
 * `getDataSource(...)`. Public shapes mirror the current Supabase row types
 * so existing consumers can migrate without shape changes.
 *
 * NOTE: consumers today still hit `supabase.from("farmer_*")` directly.
 * They can migrate to `farmingRepo.<x>.list()` etc. incrementally; the
 * toggle in Admin → Database Config only affects code that goes through
 * these facades.
 */
import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "@/lib/apiClient";
import { getDataSource } from "@/lib/dataSource";

// ---------------- Types ----------------

export interface FarmerPond {
  id: string;
  user_id: string;
  name: string;
  area: number;
  area_unit: string;
  depth: number;
  depth_unit: string;
  fish_types: string[] | null;
  fish_count: number | null;
  stocking_date: string | null;
  fish_stock_entries: unknown | null;
  total_stocking_cost: number | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FarmerIncome {
  id: string;
  user_id: string;
  date: string;
  category: string;
  description: string | null;
  amount: number;
  pond_name: string | null;
  fish_type: string | null;
  fish_weight: number | null;
  fish_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface FarmerExpense {
  id: string;
  user_id: string;
  date: string;
  category: string;
  description: string | null;
  amount: number;
  pond_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface FarmerSampling {
  id: string;
  user_id: string;
  pond_id: string | null;
  pond_name: string;
  date: string;
  fish_entries: unknown | null;
  total_fish: number | null;
  total_weight: number | null;
  avg_weight: number | null;
  notes: string | null;
  created_at: string;
}

export interface FarmingAlert {
  id: string;
  user_id: string | null;
  created_by: string | null;
  pond_id: string | null;
  pond_name: string | null;
  title: string;
  title_bn: string | null;
  message: string;
  message_bn: string | null;
  alert_type: string;
  fish_species: string | null;
  alert_date: string;
  alert_time: string | null;
  priority: string | null;
  status: string | null;
  channels: string[] | null;
  is_global: boolean | null;
  is_recurring: boolean | null;
  recurrence_interval: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------- Normalizers ----------------

const toNum = (v: unknown): number => (v == null ? 0 : Number(v) || 0);
const nullNum = (v: unknown): number | null =>
  v == null || v === "" ? null : Number(v) || 0;
const asStr = (v: unknown): string => (v == null ? "" : String(v));

const parseJson = <T,>(v: unknown, fallback: T): T => {
  if (v == null) return fallback;
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as T;
    } catch {
      return fallback;
    }
  }
  return v as T;
};

function normPond(r: any): FarmerPond {
  return {
    id: asStr(r.id),
    user_id: asStr(r.user_id),
    name: r.name,
    area: toNum(r.area),
    area_unit: r.area_unit ?? "শতক",
    depth: toNum(r.depth),
    depth_unit: r.depth_unit ?? "ফুট",
    fish_types: parseJson<string[] | null>(r.fish_types, null),
    fish_count: r.fish_count == null ? null : toNum(r.fish_count),
    stocking_date: r.stocking_date ?? null,
    fish_stock_entries: parseJson<unknown>(r.fish_stock_entries, null),
    total_stocking_cost: nullNum(r.total_stocking_cost),
    status: r.status ?? "active",
    notes: r.notes ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at ?? r.created_at,
  };
}

function normIncome(r: any): FarmerIncome {
  return {
    id: asStr(r.id),
    user_id: asStr(r.user_id),
    date: r.date,
    category: r.category ?? "মাছ বিক্রয়",
    description: r.description ?? null,
    amount: toNum(r.amount),
    pond_name: r.pond_name ?? null,
    fish_type: r.fish_type ?? null,
    fish_weight: nullNum(r.fish_weight),
    fish_price: nullNum(r.fish_price),
    created_at: r.created_at,
    updated_at: r.updated_at ?? r.created_at,
  };
}

function normExpense(r: any): FarmerExpense {
  return {
    id: asStr(r.id),
    user_id: asStr(r.user_id),
    date: r.date,
    category: r.category ?? "খাবার",
    description: r.description ?? null,
    amount: toNum(r.amount),
    pond_name: r.pond_name ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at ?? r.created_at,
  };
}

function normSampling(r: any): FarmerSampling {
  return {
    id: asStr(r.id),
    user_id: asStr(r.user_id),
    pond_id: r.pond_id ? asStr(r.pond_id) : null,
    pond_name: r.pond_name,
    date: r.date,
    fish_entries: parseJson<unknown>(r.fish_entries, null),
    total_fish: r.total_fish == null ? null : toNum(r.total_fish),
    total_weight: nullNum(r.total_weight),
    avg_weight: nullNum(r.avg_weight),
    notes: r.notes ?? null,
    created_at: r.created_at,
  };
}

function normAlert(r: any): FarmingAlert {
  return {
    id: asStr(r.id),
    user_id: r.user_id ? asStr(r.user_id) : null,
    created_by: r.created_by ? asStr(r.created_by) : null,
    pond_id: r.pond_id ? asStr(r.pond_id) : null,
    pond_name: r.pond_name ?? null,
    title: r.title,
    title_bn: r.title_bn ?? null,
    message: r.message,
    message_bn: r.message_bn ?? null,
    alert_type: r.alert_type ?? "general",
    fish_species: r.fish_species ?? null,
    alert_date: r.alert_date,
    alert_time: r.alert_time ?? null,
    priority: r.priority ?? "medium",
    status: r.status ?? "pending",
    channels: parseJson<string[] | null>(r.channels, null),
    is_global: r.is_global == null ? null : !!r.is_global,
    is_recurring: r.is_recurring == null ? null : !!r.is_recurring,
    recurrence_interval: r.recurrence_interval ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at ?? r.created_at,
  };
}

// ---------------- Ponds ----------------

async function listPondsSb(userId: string): Promise<FarmerPond[]> {
  const { data, error } = await supabase
    .from("farmer_ponds").select("*").eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(normPond);
}
async function listPondsMy(userId?: string): Promise<FarmerPond[]> {
  const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  const res = await apiClient.get<{ data: any[] }>(`/api/farming/ponds${qs}`);
  return (res.data || []).map(normPond);
}
async function createPondSb(input: Partial<FarmerPond>, userId: string): Promise<FarmerPond> {
  const { data, error } = await supabase
    .from("farmer_ponds")
    .insert({ ...input, user_id: userId } as any)
    .select("*").single();
  if (error) throw error;
  return normPond(data);
}
async function createPondMy(input: Partial<FarmerPond>): Promise<FarmerPond> {
  const res = await apiClient.post<{ data: any }>("/api/farming/ponds", input);
  return normPond(res.data);
}
async function updatePondSb(id: string, patch: Partial<FarmerPond>): Promise<FarmerPond> {
  const { data, error } = await supabase.from("farmer_ponds")
    .update(patch as any).eq("id", id).select("*").single();
  if (error) throw error;
  return normPond(data);
}
async function updatePondMy(id: string, patch: Partial<FarmerPond>): Promise<FarmerPond> {
  const res = await apiClient.put<{ data: any }>(
    `/api/farming/ponds/${encodeURIComponent(id)}`, patch);
  return normPond(res.data);
}
async function deletePondSb(id: string): Promise<void> {
  const { error } = await supabase.from("farmer_ponds").delete().eq("id", id);
  if (error) throw error;
}
async function deletePondMy(id: string): Promise<void> {
  await apiClient.delete(`/api/farming/ponds/${encodeURIComponent(id)}`);
}

// ---------------- Incomes ----------------

async function listIncomesSb(userId: string): Promise<FarmerIncome[]> {
  const { data, error } = await supabase.from("farmer_incomes").select("*")
    .eq("user_id", userId).order("date", { ascending: false });
  if (error) throw error;
  return (data || []).map(normIncome);
}
async function listIncomesMy(userId?: string): Promise<FarmerIncome[]> {
  const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  const res = await apiClient.get<{ data: any[] }>(`/api/farming/incomes${qs}`);
  return (res.data || []).map(normIncome);
}
async function createIncomeSb(input: Partial<FarmerIncome>, userId: string): Promise<FarmerIncome> {
  const { data, error } = await supabase.from("farmer_incomes")
    .insert({ ...input, user_id: userId } as any).select("*").single();
  if (error) throw error;
  return normIncome(data);
}
async function createIncomeMy(input: Partial<FarmerIncome>): Promise<FarmerIncome> {
  const res = await apiClient.post<{ data: any }>("/api/farming/incomes", input);
  return normIncome(res.data);
}
async function deleteIncomeSb(id: string): Promise<void> {
  const { error } = await supabase.from("farmer_incomes").delete().eq("id", id);
  if (error) throw error;
}
async function deleteIncomeMy(id: string): Promise<void> {
  await apiClient.delete(`/api/farming/incomes/${encodeURIComponent(id)}`);
}

// ---------------- Expenses ----------------

async function listExpensesSb(userId: string): Promise<FarmerExpense[]> {
  const { data, error } = await supabase.from("farmer_expenses").select("*")
    .eq("user_id", userId).order("date", { ascending: false });
  if (error) throw error;
  return (data || []).map(normExpense);
}
async function listExpensesMy(userId?: string): Promise<FarmerExpense[]> {
  const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  const res = await apiClient.get<{ data: any[] }>(`/api/farming/expenses${qs}`);
  return (res.data || []).map(normExpense);
}
async function createExpenseSb(input: Partial<FarmerExpense>, userId: string): Promise<FarmerExpense> {
  const { data, error } = await supabase.from("farmer_expenses")
    .insert({ ...input, user_id: userId } as any).select("*").single();
  if (error) throw error;
  return normExpense(data);
}
async function createExpenseMy(input: Partial<FarmerExpense>): Promise<FarmerExpense> {
  const res = await apiClient.post<{ data: any }>("/api/farming/expenses", input);
  return normExpense(res.data);
}
async function deleteExpenseSb(id: string): Promise<void> {
  const { error } = await supabase.from("farmer_expenses").delete().eq("id", id);
  if (error) throw error;
}
async function deleteExpenseMy(id: string): Promise<void> {
  await apiClient.delete(`/api/farming/expenses/${encodeURIComponent(id)}`);
}

// ---------------- Samplings ----------------

async function listSamplingsSb(userId: string): Promise<FarmerSampling[]> {
  const { data, error } = await supabase.from("farmer_samplings").select("*")
    .eq("user_id", userId).order("date", { ascending: false });
  if (error) throw error;
  return (data || []).map(normSampling);
}
async function listSamplingsMy(userId?: string): Promise<FarmerSampling[]> {
  const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  const res = await apiClient.get<{ data: any[] }>(`/api/farming/samplings${qs}`);
  return (res.data || []).map(normSampling);
}
async function createSamplingSb(input: Partial<FarmerSampling>, userId: string): Promise<FarmerSampling> {
  const { data, error } = await supabase.from("farmer_samplings")
    .insert({ ...input, user_id: userId } as any).select("*").single();
  if (error) throw error;
  return normSampling(data);
}
async function createSamplingMy(input: Partial<FarmerSampling>): Promise<FarmerSampling> {
  const res = await apiClient.post<{ data: any }>("/api/farming/samplings", input);
  return normSampling(res.data);
}
async function deleteSamplingSb(id: string): Promise<void> {
  const { error } = await supabase.from("farmer_samplings").delete().eq("id", id);
  if (error) throw error;
}
async function deleteSamplingMy(id: string): Promise<void> {
  await apiClient.delete(`/api/farming/samplings/${encodeURIComponent(id)}`);
}

// ---------------- Alerts ----------------

async function listAlertsSb(userId: string): Promise<FarmingAlert[]> {
  const { data, error } = await supabase.from("farming_alerts").select("*")
    .or(`user_id.eq.${userId},is_global.eq.true`)
    .order("alert_date", { ascending: false });
  if (error) throw error;
  return (data || []).map(normAlert);
}
async function listAlertsMy(userId?: string): Promise<FarmingAlert[]> {
  const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  const res = await apiClient.get<{ data: any[] }>(`/api/farming/alerts${qs}`);
  return (res.data || []).map(normAlert);
}
async function createAlertSb(input: Partial<FarmingAlert>, userId: string): Promise<FarmingAlert> {
  const payload: any = { ...input };
  if (!payload.user_id) payload.user_id = userId;
  if (!payload.created_by) payload.created_by = userId;
  const { data, error } = await supabase.from("farming_alerts")
    .insert(payload).select("*").single();
  if (error) throw error;
  return normAlert(data);
}
async function createAlertMy(input: Partial<FarmingAlert>): Promise<FarmingAlert> {
  const res = await apiClient.post<{ data: any }>("/api/farming/alerts", input);
  return normAlert(res.data);
}
async function updateAlertSb(id: string, patch: Partial<FarmingAlert>): Promise<FarmingAlert> {
  const { data, error } = await supabase.from("farming_alerts")
    .update(patch as any).eq("id", id).select("*").single();
  if (error) throw error;
  return normAlert(data);
}
async function updateAlertMy(id: string, patch: Partial<FarmingAlert>): Promise<FarmingAlert> {
  const res = await apiClient.put<{ data: any }>(
    `/api/farming/alerts/${encodeURIComponent(id)}`, patch);
  return normAlert(res.data);
}
async function deleteAlertSb(id: string): Promise<void> {
  const { error } = await supabase.from("farming_alerts").delete().eq("id", id);
  if (error) throw error;
}
async function deleteAlertMy(id: string): Promise<void> {
  await apiClient.delete(`/api/farming/alerts/${encodeURIComponent(id)}`);
}

// ---------------- Public facade ----------------

const isMy = (m: any) => getDataSource(m) === "mysql";

export const farmingRepo = {
  ponds: {
    source: () => getDataSource("farmer_ponds"),
    list: (userId: string) =>
      isMy("farmer_ponds") ? listPondsMy(userId) : listPondsSb(userId),
    create: (input: Partial<FarmerPond>, userId: string) =>
      isMy("farmer_ponds") ? createPondMy(input) : createPondSb(input, userId),
    update: (id: string, patch: Partial<FarmerPond>) =>
      isMy("farmer_ponds") ? updatePondMy(id, patch) : updatePondSb(id, patch),
    remove: (id: string) =>
      isMy("farmer_ponds") ? deletePondMy(id) : deletePondSb(id),
  },
  incomes: {
    source: () => getDataSource("farmer_incomes"),
    list: (userId: string) =>
      isMy("farmer_incomes") ? listIncomesMy(userId) : listIncomesSb(userId),
    create: (input: Partial<FarmerIncome>, userId: string) =>
      isMy("farmer_incomes") ? createIncomeMy(input) : createIncomeSb(input, userId),
    remove: (id: string) =>
      isMy("farmer_incomes") ? deleteIncomeMy(id) : deleteIncomeSb(id),
  },
  expenses: {
    source: () => getDataSource("farmer_expenses"),
    list: (userId: string) =>
      isMy("farmer_expenses") ? listExpensesMy(userId) : listExpensesSb(userId),
    create: (input: Partial<FarmerExpense>, userId: string) =>
      isMy("farmer_expenses") ? createExpenseMy(input) : createExpenseSb(input, userId),
    remove: (id: string) =>
      isMy("farmer_expenses") ? deleteExpenseMy(id) : deleteExpenseSb(id),
  },
  samplings: {
    source: () => getDataSource("farmer_samplings"),
    list: (userId: string) =>
      isMy("farmer_samplings") ? listSamplingsMy(userId) : listSamplingsSb(userId),
    create: (input: Partial<FarmerSampling>, userId: string) =>
      isMy("farmer_samplings") ? createSamplingMy(input) : createSamplingSb(input, userId),
    remove: (id: string) =>
      isMy("farmer_samplings") ? deleteSamplingMy(id) : deleteSamplingSb(id),
  },
  alerts: {
    source: () => getDataSource("farming_alerts"),
    list: (userId: string) =>
      isMy("farming_alerts") ? listAlertsMy(userId) : listAlertsSb(userId),
    create: (input: Partial<FarmingAlert>, userId: string) =>
      isMy("farming_alerts") ? createAlertMy(input) : createAlertSb(input, userId),
    update: (id: string, patch: Partial<FarmingAlert>) =>
      isMy("farming_alerts") ? updateAlertMy(id, patch) : updateAlertSb(id, patch),
    remove: (id: string) =>
      isMy("farming_alerts") ? deleteAlertMy(id) : deleteAlertSb(id),
  },
};