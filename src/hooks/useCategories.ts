import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Category {
  id: string;
  name: string;
  name_bn: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryFormData {
  name: string;
  name_bn: string;
  slug?: string;
  description?: string;
  icon?: string;
  is_active?: boolean;
  display_order?: number;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'ত্রুটি',
        description: 'ক্যাটাগরি লোড করতে ব্যর্থ',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData: CategoryFormData) => {
    try {
      // Generate slug from name if not provided
      const slug = categoryData.slug || categoryData.name.toLowerCase().replace(/\s+/g, '-');
      
      const { data, error } = await supabase
        .from('categories')
        .insert([{ ...categoryData, slug }])
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      toast({
        title: 'সফল',
        description: 'ক্যাটাগরি সফলভাবে যোগ করা হয়েছে',
      });
      return data;
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast({
        title: 'ত্রুটি',
        description: error.message || 'ক্যাটাগরি যোগ করতে ব্যর্থ',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<CategoryFormData>) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => prev.map(cat => cat.id === id ? data : cat));
      toast({
        title: 'সফল',
        description: 'ক্যাটাগরি সফলভাবে আপডেট করা হয়েছে',
      });
      return data;
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast({
        title: 'ত্রুটি',
        description: error.message || 'ক্যাটাগরি আপডেট করতে ব্যর্থ',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategories(prev => prev.filter(cat => cat.id !== id));
      toast({
        title: 'সফল',
        description: 'ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে',
      });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: 'ত্রুটি',
        description: error.message || 'ক্যাটাগরি মুছতে ব্যর্থ',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const toggleCategoryStatus = async (id: string, isActive: boolean) => {
    return updateCategory(id, { is_active: isActive });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
  };
}
