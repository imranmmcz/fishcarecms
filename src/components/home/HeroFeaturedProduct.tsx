import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface FeaturedProduct {
  id: string;
  name: string;
  price: number;
  discount_percentage: number | null;
  image_url: string | null;
}

export function HeroFeaturedProduct() {
  const { language } = useLanguage();
  const [product, setProduct] = useState<FeaturedProduct | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      // Check if enabled
      const { data: enabledSetting } = await supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "hero_featured_product_enabled")
        .single();

      if (enabledSetting?.setting_value !== "true") {
        setLoading(false);
        return;
      }
      setEnabled(true);

      // Check if specific product is set
      const { data: productIdSetting } = await supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "hero_featured_product_id")
        .single();

      let query = supabase
        .from("products")
        .select("id, name, price, discount_percentage, image_url");

      if (productIdSetting?.setting_value && productIdSetting.setting_value !== "auto") {
        query = query.eq("id", productIdSetting.setting_value);
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data } = await query.limit(1).single();
      setProduct(data);
      setLoading(false);
    };
    fetchSettings();
  }, []);

  if (loading || !enabled || !product) return null;

  const discountedPrice = product.discount_percentage
    ? product.price - (product.price * product.discount_percentage) / 100
    : product.price;

  return (
    <Link
      to={`/product/${product.id}`}
      className="relative block backdrop-blur-md bg-white/10 rounded-lg p-2.5 hover:bg-white/20 transition-all duration-300 group max-w-[180px]"
    >
      {/* Discount badge */}
      {product.discount_percentage && product.discount_percentage > 0 && (
        <span className="absolute -top-1.5 -right-1.5 z-10 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          -{product.discount_percentage}%
        </span>
      )}

      {/* Image */}
      <div className="w-full aspect-[4/3] rounded overflow-hidden mb-2">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <ShoppingCart className="h-8 w-8 text-white/30" />
          </div>
        )}
      </div>

      {/* Info */}
      <h3 className="text-white text-xs font-medium leading-tight line-clamp-2 mb-1 group-hover:text-white/90">
        {product.name}
      </h3>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-bold text-white">
          ৳{Math.round(discountedPrice)}
        </span>
        {product.discount_percentage && product.discount_percentage > 0 && (
          <span className="text-[10px] text-white/50 line-through">
            ৳{product.price}
          </span>
        )}
      </div>
    </Link>
  );
}
