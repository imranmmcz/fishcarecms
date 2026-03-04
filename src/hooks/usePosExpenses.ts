import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface ExpenseCategory {
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
  category?: ExpenseCategory;
}

export function usePosExpenses() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<PosExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('pos_expense_categories')
      .select('*')
      .order('name');
    if (!error) setCategories(data || []);
  };

  const fetchExpenses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pos_expenses')
      .select('*, category:pos_expense_categories(*)')
      .order('expense_date', { ascending: false });
    if (!error) setExpenses(data || []);
    setLoading(false);
  };

  // Category CRUD
  const createCategory = async (cat: { name: string; name_bn: string; description?: string }) => {
    const { data, error } = await supabase.from('pos_expense_categories').insert([cat]).select().single();
    if (error) { toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' }); throw error; }
    setCategories(prev => [...prev, data]);
    toast({ title: 'সফল', description: 'ক্যাটাগরি যোগ হয়েছে' });
    return data;
  };

  const updateCategory = async (id: string, cat: Partial<ExpenseCategory>) => {
    const { data, error } = await supabase.from('pos_expense_categories').update(cat).eq('id', id).select().single();
    if (error) { toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' }); throw error; }
    setCategories(prev => prev.map(c => c.id === id ? data : c));
    toast({ title: 'সফল', description: 'ক্যাটাগরি আপডেট হয়েছে' });
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('pos_expense_categories').delete().eq('id', id);
    if (error) { toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' }); throw error; }
    setCategories(prev => prev.filter(c => c.id !== id));
    toast({ title: 'সফল', description: 'ক্যাটাগরি মুছে ফেলা হয়েছে' });
  };

  // Expense CRUD
  const createExpense = async (exp: { category_id?: string; amount: number; description?: string; expense_date: string; payment_method: string; reference_no?: string }) => {
    if (!user) return;
    const { data, error } = await supabase.from('pos_expenses').insert([{ ...exp, user_id: user.id }]).select('*, category:pos_expense_categories(*)').single();
    if (error) { toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' }); throw error; }
    setExpenses(prev => [data, ...prev]);
    toast({ title: 'সফল', description: 'খরচ যোগ হয়েছে' });
    return data;
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from('pos_expenses').delete().eq('id', id);
    if (error) { toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' }); throw error; }
    setExpenses(prev => prev.filter(e => e.id !== id));
    toast({ title: 'সফল', description: 'খরচ মুছে ফেলা হয়েছে' });
  };

  useEffect(() => {
    fetchCategories();
    fetchExpenses();
  }, []);

  return { categories, expenses, loading, fetchCategories, fetchExpenses, createCategory, updateCategory, deleteCategory, createExpense, deleteExpense };
}
