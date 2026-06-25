/**
 * ProductsContext - thin wrapper around `productsRepo` facade.
 * Routes to Supabase or Hostinger MySQL based on /admin/database-config.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "sonner";
import { productsRepo, type Product } from "@/repositories/products";

// Re-export so existing imports (`from "@/contexts/ProductsContext"`) keep working.
export type { Product } from "@/repositories/products";
export { getDiscountedPrice } from "@/repositories/products";

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
      const list = await productsRepo.list();
      setProducts(list);
    } catch (error) {
      console.error(`Error fetching products from ${productsRepo.source()}:`, error);
      toast.error("পণ্য লোড করতে সমস্যা হয়েছে");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      await productsRepo.create(product);
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
      await productsRepo.update(id, product);
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
      await productsRepo.remove(id);
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
