/**
 * MySQL Backend ProductsContext
 * Hostinger-এ ডেপ্লয় করার সময় এই Context ব্যবহার করুন
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiClient, Product } from "@/lib/api-client";
import { toast } from "sonner";

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
      const response = await apiClient.getProducts({ limit: 100 });
      if (response.data?.products) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
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
      const response = await apiClient.createProduct(product);
      if (response.error) {
        toast.error(response.error);
        return false;
      }
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
      const response = await apiClient.updateProduct(id, product);
      if (response.error) {
        toast.error(response.error);
        return false;
      }
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
      const response = await apiClient.deleteProduct(id);
      if (response.error) {
        toast.error(response.error);
        return false;
      }
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
