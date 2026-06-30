/**
 * POS repository facade — Sales, Sale Items, Shifts, Expenses, Categories.
 *
 * Routes to Supabase or the Hostinger MySQL backend based on the per-module
 * toggles in `getDataSource(...)`. Public shapes mirror the existing hooks
 * (`usePosExpenses`, etc.) so consumers don't have to branch on backend.
 */
import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "@/lib/apiClient";
import { getDataSource } from "@/lib/dataSource";

// ---------------- Types ----------------

export interface PosShift {
  id: string;
  shift_number: string;
  user_id: string;
  status: "open" | "closed";
  opening_amount: number;
  closing_amount: number | null;
  expected_amount: number | null;
  cash_sales: number;
  mobile_banking_sales: number;
  total_sales: number;
  total_transactions: number;
  notes: string | null;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PosSaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  total_price: number;
  created_at: string;
}

export interface PosSale {
  id: string;
  sale_number: string;
  user_id: string;
  shift_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  change_amount: number;
  payment_method: string;
  payment_type: string;
  mobile_banking_provider: string | null;
  mobile_banking_number: string | null;
  transaction_id: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: PosSaleItem[];
}

export interface PosExpenseCategory {
  id: string;
  name: string;
  name_bn: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PosExpense {
  id: string;
  category_id: string | null;
  amount: number;
  description: string | null;
  expense_date: string;
  payment_method: string;
  reference_no: string | null;
  user_id: string;
  created_at: string;
  category?: PosExpenseCategory | null;
}

export interface CreateSaleItemInput {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
}

export interface CreateSaleInput {
  items: CreateSaleItemInput[];
  customer_name?: string | null;
  customer_phone?: string | null;
  discount_amount?: number;
  paid_amount?: number;
  change_amount?: number;
  payment_method?: string;
  payment_type?: string;
  mobile_banking_provider?: string | null;
  mobile_banking_number?: string | null;
  transaction_id?: string | null;
  shift_id?: string | null;
  notes?: string | null;
  status?: string;
}

export interface ListSalesParams {
  status?: string;
  shift_id?: string;
  customer_phone?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  payment_type?: string;
  payment_method?: string;
  min_due?: number;
  includeItems?: boolean;
  limit?: number;
}

// ---------------- Normalizers ----------------

const toNum = (v: any) => (v == null ? 0 : Number(v) || 0);

function normShift(s: any): PosShift {
  return {
    id: String(s.id),
    shift_number: s.shift_number,
    user_id: String(s.user_id),
    status: s.status === "closed" ? "closed" : "open",
    opening_amount: toNum(s.opening_amount),
    closing_amount: s.closing_amount == null ? null : toNum(s.closing_amount),
    expected_amount: s.expected_amount == null ? null : toNum(s.expected_amount),
    cash_sales: toNum(s.cash_sales),
    mobile_banking_sales: toNum(s.mobile_banking_sales),
    total_sales: toNum(s.total_sales),
    total_transactions: toNum(s.total_transactions),
    notes: s.notes ?? null,
    opened_at: s.opened_at,
    closed_at: s.closed_at ?? null,
    created_at: s.created_at,
    updated_at: s.updated_at ?? s.created_at,
  };
}

function normSaleItem(i: any): PosSaleItem {
  return {
    id: String(i.id),
    sale_id: String(i.sale_id),
    product_id: String(i.product_id),
    product_name: i.product_name,
    quantity: toNum(i.quantity),
    unit_price: toNum(i.unit_price),
    discount_percentage: toNum(i.discount_percentage),
    total_price: toNum(i.total_price),
    created_at: i.created_at,
  };
}

function normSale(s: any): PosSale {
  const out: PosSale = {
    id: String(s.id),
    sale_number: s.sale_number,
    user_id: String(s.user_id),
    shift_id: s.shift_id ? String(s.shift_id) : null,
    customer_name: s.customer_name ?? null,
    customer_phone: s.customer_phone ?? null,
    subtotal: toNum(s.subtotal),
    discount_amount: toNum(s.discount_amount),
    total_amount: toNum(s.total_amount),
    paid_amount: toNum(s.paid_amount),
    due_amount: toNum(s.due_amount),
    change_amount: toNum(s.change_amount),
    payment_method: s.payment_method ?? "cash",
    payment_type: s.payment_type ?? "full",
    mobile_banking_provider: s.mobile_banking_provider ?? null,
    mobile_banking_number: s.mobile_banking_number ?? null,
    transaction_id: s.transaction_id ?? null,
    status: s.status ?? "completed",
    notes: s.notes ?? null,
    created_at: s.created_at,
    updated_at: s.updated_at ?? s.created_at,
  };
  if (Array.isArray(s.items)) out.items = s.items.map(normSaleItem);
  return out;
}

function normCategory(c: any): PosExpenseCategory {
  return {
    id: String(c.id),
    name: c.name,
    name_bn: c.name_bn,
    description: c.description ?? null,
    is_active: !!c.is_active,
    created_at: c.created_at,
  };
}

function normExpense(e: any): PosExpense {
  return {
    id: String(e.id),
    category_id: e.category_id ? String(e.category_id) : null,
    amount: toNum(e.amount),
    description: e.description ?? null,
    expense_date: e.expense_date,
    payment_method: e.payment_method ?? "cash",
    reference_no: e.reference_no ?? null,
    user_id: String(e.user_id),
    created_at: e.created_at,
    category: e.category ? normCategory(e.category) : null,
  };
}

// ---------------- Sales ----------------

async function listSalesSb(p: ListSalesParams): Promise<PosSale[]> {
  const cols = p.includeItems ? "*, items:pos_sale_items(*)" : "*";
  let q = supabase.from("pos_sales").select(cols).order("created_at", { ascending: false });
  if (p.status) q = q.eq("status", p.status);
  if (p.shift_id) q = q.eq("shift_id", p.shift_id);
  if (p.customer_phone) q = q.eq("customer_phone", p.customer_phone);
  if (p.payment_type) q = q.eq("payment_type", p.payment_type);
  if (p.payment_method) q = q.eq("payment_method", p.payment_method);
  if (typeof p.min_due === "number") q = q.gt("due_amount", p.min_due);
  if (p.date_from) q = q.gte("created_at", p.date_from);
  if (p.date_to) q = q.lte("created_at", p.date_to);
  if (p.search) q = q.or(`sale_number.ilike.%${p.search}%,customer_name.ilike.%${p.search}%,customer_phone.ilike.%${p.search}%`);
  if (p.limit) q = q.limit(p.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(normSale);
}

async function listSalesMy(p: ListSalesParams): Promise<PosSale[]> {
  const qs = new URLSearchParams();
  if (p.status) qs.set("status", p.status);
  if (p.shift_id) qs.set("shift_id", p.shift_id);
  if (p.customer_phone) qs.set("customer_phone", p.customer_phone);
  if (p.payment_type) qs.set("payment_type", p.payment_type);
  if (p.payment_method) qs.set("payment_method", p.payment_method);
  if (typeof p.min_due === "number") qs.set("min_due", String(p.min_due));
  if (p.date_from) qs.set("date_from", p.date_from);
  if (p.date_to) qs.set("date_to", p.date_to);
  if (p.search) qs.set("search", p.search);
  if (p.includeItems) qs.set("include_items", "1");
  qs.set("limit", String(p.limit ?? 200));
  const res = await apiClient.get<{ sales: any[] }>(`/api/pos/sales?${qs.toString()}`);
  return (res.sales || []).map(normSale);
}

async function getSaleSb(id: string): Promise<PosSale | null> {
  const { data, error } = await supabase
    .from("pos_sales")
    .select("*, items:pos_sale_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return normSale(data);
}

async function getSaleMy(id: string): Promise<PosSale | null> {
  try {
    const res = await apiClient.get<{ sale: any }>(`/api/pos/sales/${encodeURIComponent(id)}`);
    return res.sale ? normSale(res.sale) : null;
  } catch { return null; }
}

async function createSaleSb(input: CreateSaleInput, userId: string): Promise<PosSale> {
  const subtotal = input.items.reduce(
    (s, it) => s + it.unit_price * it.quantity * (1 - (it.discount_percentage || 0) / 100),
    0,
  );
  const total = Math.max(subtotal - (input.discount_amount || 0), 0);
  const paid = input.paid_amount ?? total;
  const due = Math.max(total - paid, 0);
  const { data: numData } = await supabase.rpc("generate_pos_sale_number");
  const sale_number = numData || `POS-${Date.now()}`;
  const { data: sale, error } = await supabase.from("pos_sales").insert({
    sale_number, user_id: userId, shift_id: input.shift_id ?? null,
    customer_name: input.customer_name ?? null, customer_phone: input.customer_phone ?? null,
    subtotal, discount_amount: input.discount_amount || 0, total_amount: total,
    paid_amount: paid, due_amount: due, change_amount: input.change_amount || 0,
    payment_method: input.payment_method || "cash",
    payment_type: input.payment_type || "full",
    mobile_banking_provider: input.mobile_banking_provider ?? null,
    mobile_banking_number: input.mobile_banking_number ?? null,
    transaction_id: input.transaction_id ?? null,
    status: input.status || "completed", notes: input.notes ?? null,
  }).select().single();
  if (error) throw error;
  const itemRows = input.items.map((it) => ({
    sale_id: sale.id, product_id: it.product_id, product_name: it.product_name,
    quantity: it.quantity, unit_price: it.unit_price,
    discount_percentage: it.discount_percentage || 0,
    total_price: it.unit_price * it.quantity * (1 - (it.discount_percentage || 0) / 100),
  }));
  await supabase.from("pos_sale_items").insert(itemRows);
  return normSale(sale);
}

async function createSaleMy(input: CreateSaleInput): Promise<PosSale> {
  const res = await apiClient.post<{ sale: any }>("/api/pos/sales", input);
  return normSale(res.sale);
}

// ---------------- Shifts ----------------

async function listShiftsSb(status?: string): Promise<PosShift[]> {
  let q = supabase.from("pos_shifts").select("*").order("opened_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(normShift);
}

async function listShiftsMy(status?: string): Promise<PosShift[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await apiClient.get<{ shifts: any[] }>(`/api/pos/shifts${qs}`);
  return (res.shifts || []).map(normShift);
}

async function activeShiftSb(userId: string): Promise<PosShift | null> {
  const { data } = await supabase.from("pos_shifts")
    .select("*").eq("user_id", userId).eq("status", "open")
    .order("opened_at", { ascending: false }).limit(1).maybeSingle();
  return data ? normShift(data) : null;
}

async function activeShiftMy(): Promise<PosShift | null> {
  const res = await apiClient.get<{ shift: any }>("/api/pos/shifts/active");
  return res.shift ? normShift(res.shift) : null;
}

async function openShiftSb(userId: string, opening_amount: number, notes?: string): Promise<PosShift> {
  const { data: numData } = await supabase.rpc("generate_shift_number");
  const shift_number = numData || `SHIFT-${Date.now()}`;
  const { data, error } = await supabase.from("pos_shifts").insert({
    shift_number, user_id: userId, opening_amount, notes: notes ?? null, status: "open",
  }).select().single();
  if (error) throw error;
  return normShift(data);
}

async function openShiftMy(opening_amount: number, notes?: string): Promise<PosShift> {
  const res = await apiClient.post<{ shift: any }>("/api/pos/shifts/open", { opening_amount, notes });
  return normShift(res.shift);
}

async function closeShiftSb(id: string, closing_amount: number, notes?: string): Promise<PosShift> {
  const { data, error } = await supabase.from("pos_shifts").update({
    status: "closed", closing_amount, closed_at: new Date().toISOString(),
    notes: notes ?? undefined,
  }).eq("id", id).select().single();
  if (error) throw error;
  return normShift(data);
}

async function closeShiftMy(id: string, closing_amount: number, notes?: string): Promise<PosShift> {
  const res = await apiClient.patch<{ shift: any }>(
    `/api/pos/shifts/${encodeURIComponent(id)}/close`,
    { closing_amount, notes },
  );
  return normShift(res.shift);
}

// ---------------- Expense categories ----------------

async function listCategoriesSb(): Promise<PosExpenseCategory[]> {
  const { data, error } = await supabase.from("pos_expense_categories").select("*").order("name");
  if (error) throw error;
  return (data || []).map(normCategory);
}
async function listCategoriesMy(): Promise<PosExpenseCategory[]> {
  const res = await apiClient.get<{ categories: any[] }>("/api/pos/expense-categories");
  return (res.categories || []).map(normCategory);
}

async function createCategorySb(c: { name: string; name_bn: string; description?: string }): Promise<PosExpenseCategory> {
  const { data, error } = await supabase.from("pos_expense_categories").insert([c]).select().single();
  if (error) throw error;
  return normCategory(data);
}
async function createCategoryMy(c: { name: string; name_bn: string; description?: string }): Promise<PosExpenseCategory> {
  const res = await apiClient.post<{ category: any }>("/api/pos/expense-categories", c);
  return normCategory(res.category);
}

async function updateCategorySb(id: string, patch: Partial<PosExpenseCategory>): Promise<PosExpenseCategory> {
  const { data, error } = await supabase.from("pos_expense_categories").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return normCategory(data);
}
async function updateCategoryMy(id: string, patch: Partial<PosExpenseCategory>): Promise<PosExpenseCategory> {
  const res = await apiClient.patch<{ category: any }>(`/api/pos/expense-categories/${encodeURIComponent(id)}`, patch);
  return normCategory(res.category);
}

async function deleteCategorySb(id: string): Promise<void> {
  const { error } = await supabase.from("pos_expense_categories").delete().eq("id", id);
  if (error) throw error;
}
async function deleteCategoryMy(id: string): Promise<void> {
  await apiClient.delete(`/api/pos/expense-categories/${encodeURIComponent(id)}`);
}

// ---------------- Expenses ----------------

export interface ListExpensesParams {
  date_from?: string; date_to?: string; category_id?: string; limit?: number;
}

async function listExpensesSb(p: ListExpensesParams = {}): Promise<PosExpense[]> {
  let q = supabase.from("pos_expenses").select("*, category:pos_expense_categories(*)")
    .order("expense_date", { ascending: false });
  if (p.category_id) q = q.eq("category_id", p.category_id);
  if (p.date_from) q = q.gte("expense_date", p.date_from);
  if (p.date_to) q = q.lte("expense_date", p.date_to);
  if (p.limit) q = q.limit(p.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(normExpense);
}

async function listExpensesMy(p: ListExpensesParams = {}): Promise<PosExpense[]> {
  const qs = new URLSearchParams();
  if (p.category_id) qs.set("category_id", p.category_id);
  if (p.date_from) qs.set("date_from", p.date_from);
  if (p.date_to) qs.set("date_to", p.date_to);
  qs.set("limit", String(p.limit ?? 200));
  const res = await apiClient.get<{ expenses: any[] }>(`/api/pos/expenses?${qs.toString()}`);
  return (res.expenses || []).map(normExpense);
}

export interface CreateExpenseInput {
  category_id?: string | null;
  amount: number;
  description?: string | null;
  expense_date: string;
  payment_method?: string;
  reference_no?: string | null;
}

async function createExpenseSb(input: CreateExpenseInput, userId: string): Promise<PosExpense> {
  const { data, error } = await supabase.from("pos_expenses")
    .insert([{ ...input, user_id: userId }])
    .select("*, category:pos_expense_categories(*)").single();
  if (error) throw error;
  return normExpense(data);
}
async function createExpenseMy(input: CreateExpenseInput): Promise<PosExpense> {
  const res = await apiClient.post<{ expense: any }>("/api/pos/expenses", input);
  return normExpense(res.expense);
}

async function deleteExpenseSb(id: string): Promise<void> {
  const { error } = await supabase.from("pos_expenses").delete().eq("id", id);
  if (error) throw error;
}
async function deleteExpenseMy(id: string): Promise<void> {
  await apiClient.delete(`/api/pos/expenses/${encodeURIComponent(id)}`);
}

// ---------------- Public facade ----------------

export const posRepo = {
  // Sales
  sales: {
    source: () => getDataSource("pos_sales"),
    list: (p: ListSalesParams = {}) =>
      getDataSource("pos_sales") === "mysql" ? listSalesMy(p) : listSalesSb(p),
    get: (id: string) =>
      getDataSource("pos_sales") === "mysql" ? getSaleMy(id) : getSaleSb(id),
    create: (input: CreateSaleInput, userId: string) =>
      getDataSource("pos_sales") === "mysql"
        ? createSaleMy(input)
        : createSaleSb(input, userId),
    addDuePayment: (saleId: string, payload: {
      amount: number; payment_method?: string;
      mobile_banking_provider?: string | null; transaction_id?: string | null; notes?: string | null;
    }, userId: string) =>
      getDataSource("pos_sales") === "mysql"
        ? apiClient.post<{ payment: any; paid_amount: number; due_amount: number }>(
            `/api/pos/sales/${encodeURIComponent(saleId)}/due-payments`, payload)
        : supabase.from("pos_due_payments").insert([{
            sale_id: saleId, collected_by: userId, ...payload,
          }]).then((r) => { if (r.error) throw r.error; return r.data; }),
    listDuePayments: async (saleId: string): Promise<any[]> => {
      if (getDataSource("pos_sales") === "mysql") {
        const res = await apiClient.get<{ sale: any }>(`/api/pos/sales/${encodeURIComponent(saleId)}`);
        return res.sale?.due_payments || [];
      }
      const { data, error } = await supabase
        .from("pos_due_payments").select("*").eq("sale_id", saleId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    updateAfterDuePayment: async (
      saleId: string,
      patch: { paid_amount: number; due_amount: number; payment_type?: string },
    ): Promise<void> => {
      // MySQL backend already updates the sale row inside the due-payment txn.
      if (getDataSource("pos_sales") === "mysql") return;
      const { error } = await supabase.from("pos_sales").update(patch).eq("id", saleId);
      if (error) throw error;
    },
  },

  // Shifts
  shifts: {
    source: () => getDataSource("pos_shifts"),
    list: (status?: string) =>
      getDataSource("pos_shifts") === "mysql" ? listShiftsMy(status) : listShiftsSb(status),
    active: (userId: string) =>
      getDataSource("pos_shifts") === "mysql" ? activeShiftMy() : activeShiftSb(userId),
    open: (userId: string, opening_amount: number, notes?: string) =>
      getDataSource("pos_shifts") === "mysql"
        ? openShiftMy(opening_amount, notes)
        : openShiftSb(userId, opening_amount, notes),
    close: (id: string, closing_amount: number, notes?: string) =>
      getDataSource("pos_shifts") === "mysql"
        ? closeShiftMy(id, closing_amount, notes)
        : closeShiftSb(id, closing_amount, notes),
  },

  // Expenses + categories
  expenseCategories: {
    source: () => getDataSource("pos_expenses"),
    list: () => getDataSource("pos_expenses") === "mysql" ? listCategoriesMy() : listCategoriesSb(),
    create: (c: { name: string; name_bn: string; description?: string }) =>
      getDataSource("pos_expenses") === "mysql" ? createCategoryMy(c) : createCategorySb(c),
    update: (id: string, patch: Partial<PosExpenseCategory>) =>
      getDataSource("pos_expenses") === "mysql" ? updateCategoryMy(id, patch) : updateCategorySb(id, patch),
    delete: (id: string) =>
      getDataSource("pos_expenses") === "mysql" ? deleteCategoryMy(id) : deleteCategorySb(id),
  },

  expenses: {
    source: () => getDataSource("pos_expenses"),
    list: (p?: ListExpensesParams) =>
      getDataSource("pos_expenses") === "mysql" ? listExpensesMy(p) : listExpensesSb(p),
    create: (input: CreateExpenseInput, userId: string) =>
      getDataSource("pos_expenses") === "mysql"
        ? createExpenseMy(input)
        : createExpenseSb(input, userId),
    delete: (id: string) =>
      getDataSource("pos_expenses") === "mysql" ? deleteExpenseMy(id) : deleteExpenseSb(id),
  },
};