/**
 * MySQL Backend MarketPricesContext
 * Hostinger-এ ডেপ্লয় করার সময় এই Context ব্যবহার করুন
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiClient, MarketPrice } from "@/lib/api-client";
import { toast } from "sonner";

interface MarketPricesContextType {
  prices: MarketPrice[];
  isLoading: boolean;
  addPrice: (price: Omit<MarketPrice, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updatePrice: (id: string, price: Partial<MarketPrice>) => Promise<boolean>;
  deletePrice: (id: string) => Promise<boolean>;
  refreshPrices: () => Promise<void>;
  filterByLocation: (division?: string, district?: string, upazila?: string) => Promise<void>;
}

const MarketPricesContext = createContext<MarketPricesContextType | undefined>(undefined);

export const MarketPricesProvider = ({ children }: { children: ReactNode }) => {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrices = async (params?: { division?: string; district?: string; upazila?: string }) => {
    setIsLoading(true);
    try {
      const response = await apiClient.getMarketPrices({ ...params, limit: 100 });
      if (response.data?.prices) {
        setPrices(response.data.prices);
      }
    } catch (error) {
      console.error("Error fetching market prices:", error);
      toast.error("বাজার দর লোড করতে সমস্যা হয়েছে");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  const filterByLocation = async (division?: string, district?: string, upazila?: string) => {
    await fetchPrices({ division, district, upazila });
  };

  const addPrice = async (price: Omit<MarketPrice, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      const response = await apiClient.createMarketPrice(price);
      if (response.error) {
        toast.error(response.error);
        return false;
      }
      toast.success("বাজার দর সফলভাবে যোগ করা হয়েছে");
      await fetchPrices();
      return true;
    } catch (error) {
      console.error("Error adding market price:", error);
      toast.error("বাজার দর যোগ করতে সমস্যা হয়েছে");
      return false;
    }
  };

  const updatePrice = async (id: string, price: Partial<MarketPrice>): Promise<boolean> => {
    try {
      const response = await apiClient.updateMarketPrice(id, price);
      if (response.error) {
        toast.error(response.error);
        return false;
      }
      toast.success("বাজার দর সফলভাবে আপডেট হয়েছে");
      await fetchPrices();
      return true;
    } catch (error) {
      console.error("Error updating market price:", error);
      toast.error("বাজার দর আপডেট করতে সমস্যা হয়েছে");
      return false;
    }
  };

  const deletePrice = async (id: string): Promise<boolean> => {
    try {
      const response = await apiClient.deleteMarketPrice(id);
      if (response.error) {
        toast.error(response.error);
        return false;
      }
      toast.success("বাজার দর সফলভাবে মুছে ফেলা হয়েছে");
      await fetchPrices();
      return true;
    } catch (error) {
      console.error("Error deleting market price:", error);
      toast.error("বাজার দর মুছতে সমস্যা হয়েছে");
      return false;
    }
  };

  return (
    <MarketPricesContext.Provider
      value={{
        prices,
        isLoading,
        addPrice,
        updatePrice,
        deletePrice,
        refreshPrices: () => fetchPrices(),
        filterByLocation,
      }}
    >
      {children}
    </MarketPricesContext.Provider>
  );
};

export const useMarketPrices = () => {
  const context = useContext(MarketPricesContext);
  if (context === undefined) {
    throw new Error("useMarketPrices must be used within a MarketPricesProvider");
  }
  return context;
};
