import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FlashSale {
  id: string;
  title: string;
  title_bn: string | null;
  description: string | null;
  description_bn: string | null;
  discount_type: string;
  discount_value: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  max_quantity_per_user: number | null;
  banner_image_url: string | null;
  created_at: string;
}

export interface FlashSaleItem {
  id: string;
  flash_sale_id: string;
  product_id: string;
  override_discount_type: string | null;
  override_discount_value: number | null;
  stock_limit: number | null;
  sold_count: number;
  product?: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    stock_quantity: number;
  };
}

export interface FlashSaleWithItems extends FlashSale {
  items: FlashSaleItem[];
}

export function useFlashSales() {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFlashSales = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("flash_sales")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setFlashSales((data || []) as unknown as FlashSale[]);
    } catch (err) {
      console.error("Error fetching flash sales:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchFlashSales(); }, [fetchFlashSales]);

  return { flashSales, isLoading, refetch: fetchFlashSales };
}

export function useActiveFlashSale() {
  const [flashSale, setFlashSale] = useState<FlashSaleWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const now = new Date().toISOString();
        const { data: sales, error } = await supabase
          .from("flash_sales")
          .select("*")
          .eq("is_active", true)
          .lte("start_time", now)
          .gt("end_time", now)
          .order("start_time", { ascending: false })
          .limit(1);

        if (error) throw error;
        if (!sales || sales.length === 0) {
          setFlashSale(null);
          return;
        }

        const sale = sales[0] as unknown as FlashSale;

        const { data: items, error: itemsError } = await supabase
          .from("flash_sale_items")
          .select("*, product:products(id, name, price, image_url, stock_quantity)")
          .eq("flash_sale_id", sale.id);

        if (itemsError) throw itemsError;

        setFlashSale({
          ...sale,
          items: (items || []) as unknown as FlashSaleItem[],
        });
      } catch (err) {
        console.error("Error fetching active flash sale:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  return { flashSale, isLoading };
}

// Get flash sale discount for a specific product
export function useFlashSaleForProduct(productId: string) {
  const [discount, setDiscount] = useState<{ type: string; value: number; endTime: string } | null>(null);

  useEffect(() => {
    if (!productId) return;
    const fetch = async () => {
      try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from("flash_sale_items")
          .select(`
            override_discount_type,
            override_discount_value,
            stock_limit,
            sold_count,
            flash_sale:flash_sales!inner(discount_type, discount_value, end_time, is_active, start_time)
          `)
          .eq("product_id", productId)
          .eq("flash_sale.is_active", true)
          .lte("flash_sale.start_time", now)
          .gt("flash_sale.end_time", now)
          .limit(1);

        if (error || !data || data.length === 0) return;

        const item = data[0] as any;
        const sale = item.flash_sale;
        
        // Check stock limit
        if (item.stock_limit && item.sold_count >= item.stock_limit) return;

        setDiscount({
          type: item.override_discount_type || sale.discount_type,
          value: item.override_discount_value ?? sale.discount_value,
          endTime: sale.end_time,
        });
      } catch (err) {
        console.error("Error fetching flash sale for product:", err);
      }
    };
    fetch();
  }, [productId]);

  return discount;
}
