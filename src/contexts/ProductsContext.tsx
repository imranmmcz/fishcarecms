/**
 * ProductsContext - MySQL Backend API Version
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiClient, Product as ApiProduct } from "@/lib/api-client";
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

// Convert API product (number id) to local Product (string id)
const mapApiProduct = (p: ApiProduct): Product => ({
  id: String(p.id),
  name: p.name,
  description: p.description,
  price: p.price,
  cost_price: 0,
  discount_percentage: p.discount_percentage || null,
  category: p.category,
  image_url: p.image_url,
  external_link: p.external_link,
  stock_quantity: p.stock_quantity || 0,
  sku: p.sku || null,
  unit: p.unit || null,
  reorder_level: p.reorder_level || null,
  company_id: p.company_id ? String(p.company_id) : null,
  brand_id: p.brand_id ? String(p.brand_id) : null,
  created_at: p.created_at,
  updated_at: p.updated_at,
});

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
      const response = await apiClient.getProducts({ limit: 1000 });
      if (response.data?.products) {
        setProducts(response.data.products.map(mapApiProduct));
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
      const response = await apiClient.createProduct(product as unknown as Omit<ApiProduct, 'id' | 'created_at' | 'updated_at'>);
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
      const response = await apiClient.updateProduct(id, product as unknown as Partial<ApiProduct>);
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
