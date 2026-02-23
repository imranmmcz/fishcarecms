import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";

interface FeaturedProduct {
  id: string;
  name: string;
  price: number;
  discount_percentage: number | null;
  image_url: string | null;
  category: string;
}

export function HeroFeaturedProduct() {
  const { language } = useLanguage();
  const [product, setProduct] = useState<FeaturedProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, price, discount_percentage, image_url, category")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      setProduct(data);
      setLoading(false);
    };
    fetchProduct();
  }, []);

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-medium p-4 h-full flex flex-col gap-3">
        <Skeleton className="w-full aspect-square rounded-lg" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    );
  }

  if (!product) return null;

  const discountedPrice = product.discount_percentage
    ? product.price - (product.price * product.discount_percentage) / 100
    : product.price;

  return (
    <Link
      to={`/product/${product.id}`}
      className="bg-card rounded-xl border border-border shadow-medium p-4 h-full flex flex-col justify-between hover:shadow-elegant transition-all duration-300 group"
    >
      {/* Badge */}
      {product.discount_percentage && product.discount_percentage > 0 ? (
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full">
            -{product.discount_percentage}%
          </span>
        </div>
      ) : null}

      {/* Image */}
      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted mb-3">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {language === "bn" ? "ফিচার্ড প্রোডাক্ট" : "Featured Product"}
        </p>
        <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">
            ৳{Math.round(discountedPrice)}
          </span>
          {product.discount_percentage && product.discount_percentage > 0 && (
            <span className="text-sm text-muted-foreground line-through">
              ৳{product.price}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-amber-500">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-3 w-3 fill-current" />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-3 w-full bg-primary text-primary-foreground text-center text-sm font-medium py-2 rounded-lg group-hover:opacity-90 transition-opacity">
        {language === "bn" ? "এখনই কিনুন" : "Buy Now"}
      </div>
    </Link>
  );
}
