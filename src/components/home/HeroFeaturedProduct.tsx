import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FeaturedProduct {
  id: string;
  name: string;
  price: number;
  discount_percentage: number | null;
  image_url: string | null;
}

interface HeroFeaturedProductProps {
  productId?: string | null;
}

export function HeroFeaturedProduct({ productId }: HeroFeaturedProductProps) {
  const [product, setProduct] = useState<FeaturedProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("id, name, price, discount_percentage, image_url")
        .eq("id", productId)
        .single();
      setProduct(data);
      setLoading(false);
    };
    fetchProduct();
  }, [productId]);

  if (loading || !product) return null;

  const discountedPrice = product.discount_percentage
    ? product.price - (product.price * product.discount_percentage) / 100
    : product.price;

  return (
    <Link
      to={`/product/${product.id}`}
      className="relative block bg-white/5 backdrop-blur-sm rounded-xl p-1.5 sm:p-2 md:p-3 hover:bg-white/10 transition-all duration-300 group w-[100px] sm:w-[130px] md:w-[160px] lg:w-[180px]"
    >
      {product.discount_percentage && product.discount_percentage > 0 && (
        <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 z-10 bg-destructive text-destructive-foreground text-[8px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full">
          -{product.discount_percentage}%
        </span>
      )}

      <div className="w-full aspect-square rounded overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white/30" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1 sm:gap-1.5 mt-1 sm:mt-1.5">
        <span className="text-[11px] sm:text-xs md:text-sm font-bold text-white">
          ৳{Math.round(discountedPrice)}
        </span>
        {product.discount_percentage && product.discount_percentage > 0 && (
          <span className="text-[8px] sm:text-[10px] text-white/50 line-through">
            ৳{product.price}
          </span>
        )}
      </div>
    </Link>
  );
}
