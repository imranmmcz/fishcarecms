import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronLeft, ChevronRight, Pill, ShoppingCart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discount_percentage: number | null;
  image_url: string | null;
}

interface RecommendedProductsSliderProps {
  category?: string;
  diseaseIds?: string[];
  title?: string;
  titleBn?: string;
  showAiBadge?: boolean;
}

const RecommendedProductsSlider = ({ 
  category,
  diseaseIds,
  title = 'Recommended Products',
  titleBn = 'এই হিসাবের জন্য প্রস্তাবিত পণ্য',
  showAiBadge = false,
}: RecommendedProductsSliderProps) => {
  const { language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start', slidesToScroll: 1 },
    [Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      let finalProducts: Product[] = [];

      // Priority 1: Fetch products linked to specific diseases
      if (diseaseIds && diseaseIds.length > 0) {
        const { data: recData } = await supabase
          .from('disease_recommended_products')
          .select('product_id, products:product_id(id, name, description, price, discount_percentage, image_url)')
          .in('disease_id', diseaseIds)
          .order('display_order', { ascending: true });

        if (recData) {
          const seen = new Set<string>();
          for (const item of recData as any[]) {
            if (item.products && !seen.has(item.products.id)) {
              seen.add(item.products.id);
              finalProducts.push(item.products);
            }
          }
        }
      }

      // Priority 2: Fetch by tag/category
      if (finalProducts.length < 4 && category) {
        try {
          const { data } = await (supabase
            .from('products')
            .select('id, name, description, price, discount_percentage, image_url') as any)
            .gt('stock_quantity', 0)
            .contains('recommendation_tags', [category])
            .limit(12);
          
          const existing = new Set(finalProducts.map(p => p.id));
          for (const p of (data as Product[]) || []) {
            if (!existing.has(p.id)) {
              finalProducts.push(p);
              existing.add(p.id);
            }
          }
        } catch {
          // tag column might not exist
        }
      }

      // Priority 3: Fallback to popular products
      if (finalProducts.length < 4) {
        const { data: fallback } = await (supabase
          .from('products')
          .select('id, name, description, price, discount_percentage, image_url') as any)
          .limit(8);
        
        const existing = new Set(finalProducts.map(p => p.id));
        for (const p of (fallback as Product[]) || []) {
          if (!existing.has(p.id)) {
            finalProducts.push(p);
            existing.add(p.id);
          }
        }
      }

      setProducts(finalProducts);
      setLoading(false);
    };
    fetchProducts();
  }, [category, diseaseIds?.join(',')]);

  if (loading || products.length === 0) return null;

  return (
    <section className="mt-10 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <Pill className="h-5 w-5 text-primary" />
          <h2 className="text-lg md:text-xl font-bold text-foreground">
            {language === 'bn' ? titleBn : title}
          </h2>
          {showAiBadge && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Sparkles className="h-3 w-3" /> AI সুপারিশ
            </Badge>
          )}
        </div>
        <div className="flex gap-1.5">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={scrollPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={scrollNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {products.map(product => {
            const discountedPrice = product.discount_percentage
              ? product.price * (1 - product.discount_percentage / 100)
              : product.price;

            return (
              <div
                key={product.id}
                className="flex-none w-[220px] sm:w-[240px] md:w-[260px]"
              >
                <Link
                  to={`/product/${product.id}`}
                  className="group block rounded-2xl border bg-card overflow-hidden hover:shadow-lg transition-all hover:border-primary/30 h-full"
                >
                  <div className="aspect-square bg-muted overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Pill className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-primary">৳{Math.round(discountedPrice)}</span>
                      {product.discount_percentage && product.discount_percentage > 0 && (
                        <span className="text-xs line-through text-muted-foreground">৳{product.price}</span>
                      )}
                    </div>
                    <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs h-8">
                      <ShoppingCart className="h-3.5 w-3.5" />
                      {language === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}
                    </Button>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RecommendedProductsSlider;
