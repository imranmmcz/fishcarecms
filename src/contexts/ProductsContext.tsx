/**
 * ProductsContext - Supabase/Lovable Cloud Version
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

interface ProductsContextType {
  products: Product[];
  isLoading: boolean;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  refreshProducts: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, discount_percentage, category, image_url, external_link, stock_quantity, sku, unit, reorder_level, company_id, brand_id, cost_price, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProducts((data || []).map(p => ({
        ...p,
        cost_price: p.cost_price || 0,
      })));
    } catch (error) {
      // Anonymous visitors don't have access to cost_price; retry without it
      try {
        const { data, error: retryError } = await supabase
          .from("products")
          .select("id, name, description, price, discount_percentage, category, image_url, external_link, stock_quantity, sku, unit, reorder_level, company_id, brand_id, created_at, updated_at")
          .order("created_at", { ascending: false });
        if (retryError) throw retryError;
        setProducts((data || []).map(p => ({ ...p, cost_price: 0 })));
      } catch (retryErr) {
        console.error("Error fetching products:", retryErr);
        toast.error("পণ্য লোড করতে সমস্যা হয়েছে");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      const { error } = await supabase.from("products").insert(product);
      if (error) throw error;
      toast.success("পণ্য সফলভাবে যোগ করা হয়েছে");
      await fetchProducts();
      return true;
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("পণ্য যোগ করতে সমস্যা হয়েছে");
      return false;
    }
  };

  const updateProduct = async (id: string, product: Partial<Product>): Promise<boolean> => {
    try {
      const { error } = await supabase.from("products").update(product).eq("id", id);
      if (error) throw error;
      toast.success("পণ্য সফলভাবে আপডেট হয়েছে");
      await fetchProducts();
      return true;
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("পণ্য আপডেট করতে সমস্যা হয়েছে");
      return false;
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      toast.success("পণ্য সফলভাবে মুছে ফেলা হয়েছে");
      await fetchProducts();
      return true;
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("পণ্য মুছতে সমস্যা হয়েছে");
      return false;
    }
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        isLoading,
        addProduct,
        updateProduct,
        deleteProduct,
        refreshProducts: fetchProducts,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error("useProducts must be used within a ProductsProvider");
  }
  return context;
};

// Helper to calculate discounted price
export const getDiscountedPrice = (price: number, discountPercentage: number): number => {
  if (discountPercentage <= 0) return price;
  return Math.round(price * (1 - discountPercentage / 100));
};
