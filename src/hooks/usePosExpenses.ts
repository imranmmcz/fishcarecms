import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { posRepo, PosExpenseCategory as RepoCategory, PosExpense as RepoExpense } from '@/repositories/pos';
import { useModulePolling } from '@/hooks/useModulePolling';

export type ExpenseCategory = RepoCategory;
export type PosExpense = RepoExpense;

export function usePosExpenses() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<PosExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCategories = async () => {
    try {
      const data = await posRepo.expenseCategories.list();
      setCategories(data);
    } catch (e) { /* ignore */ }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await posRepo.expenses.list();
      setExpenses(data);
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  // Category CRUD
  const createCategory = async (cat: { name: string; name_bn: string; description?: string }) => {
    try {
      const data = await posRepo.expenseCategories.create(cat);
      setCategories(prev => [...prev, data]);
      toast({ title: 'সফল', description: 'ক্যাটাগরি যোগ হয়েছে' });
      return data;
    } catch (error: any) {
      toast({ title: 'ত্রুটি', description: error?.message || 'ব্যর্থ', variant: 'destructive' });
      throw error;
    }
  };

  const updateCategory = async (id: string, cat: Partial<ExpenseCategory>) => {
    try {
      const data = await posRepo.expenseCategories.update(id, cat);
      setCategories(prev => prev.map(c => c.id === id ? data : c));
      toast({ title: 'সফল', description: 'ক্যাটাগরি আপডেট হয়েছে' });
    } catch (error: any) {
      toast({ title: 'ত্রুটি', description: error?.message || 'ব্যর্থ', variant: 'destructive' });
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await posRepo.expenseCategories.delete(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast({ title: 'সফল', description: 'ক্যাটাগরি মুছে ফেলা হয়েছে' });
    } catch (error: any) {
      toast({ title: 'ত্রুটি', description: error?.message || 'ব্যর্থ', variant: 'destructive' });
      throw error;
    }
  };

  // Expense CRUD
  const createExpense = async (exp: { category_id?: string; amount: number; description?: string; expense_date: string; payment_method: string; reference_no?: string }) => {
    if (!user) return;
    try {
      const data = await posRepo.expenses.create(exp as any, user.id);
      setExpenses(prev => [data, ...prev]);
      toast({ title: 'সফল', description: 'খরচ যোগ হয়েছে' });
      return data;
    } catch (error: any) {
      toast({ title: 'ত্রুটি', description: error?.message || 'ব্যর্থ', variant: 'destructive' });
      throw error;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await posRepo.expenses.delete(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast({ title: 'সফল', description: 'খরচ মুছে ফেলা হয়েছে' });
    } catch (error: any) {
      toast({ title: 'ত্রুটি', description: error?.message || 'ব্যর্থ', variant: 'destructive' });
      throw error;
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchExpenses();
  }, []);

  // MySQL routing → polling replaces realtime.
  useModulePolling('pos_expenses', fetchExpenses, 20000);

  return { categories, expenses, loading, fetchCategories, fetchExpenses, createCategory, updateCategory, deleteCategory, createExpense, deleteExpense };
}
