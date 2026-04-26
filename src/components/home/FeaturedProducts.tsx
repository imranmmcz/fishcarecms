import { useProducts } from "@/contexts/ProductsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProductCard, DisplayProduct } from "@/components/ProductCard";
import { Link } from "react-router-dom";
import { Button3D } from "@/components/ui/button-3d";
import { ShoppingBag, ArrowRight, Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const categoryLabels: Record<string, { bn: string; en: string }> = {
  medicine: { bn: "ঔষধ", en: "Medicine" },
  food: { bn: "খাদ্য", en: "Food" },
  accessories: { bn: "সরঞ্জাম", en: "Accessories" },
};

export const FeaturedProducts = () => {
  const { products, isLoading } = useProducts();
  const { language } = useLanguage();

  // Show products with discount first, then newest — max 8
  const featured = [...products]
    .filter((p) => p.stock_quantity > 0)
    .sort((a, b) => {
      const discA = a.discount_percentage || 0;
      const discB = b.discount_percentage || 0;
      if (discB !== discA) return discB - discA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 8);

  if (isLoading || featured.length === 0) return null;

  const toDisplay = (p: typeof products[0]): DisplayProduct => {
    const disc = p.discount_percentage || 0;
    const cat = (p.category || "medicine") as "medicine" | "food" | "accessories";
    return {
      id: p.id,
      name: p.name,
      description: p.description || "",
      price: disc > 0 ? p.price * (1 - disc / 100) : p.price,
      originalPrice: disc > 0 ? p.price : undefined,
      image_url: p.image_url || undefined,
      category: cat,
      categoryLabel: categoryLabels[cat]?.[language] || cat,
      discount_percentage: disc,
      isFromDatabase: true,
    };
  };

  return (
    <section className="py-16 bg-muted/20">
      <div className="container">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-primary/80 to-primary p-2.5 shadow-md">
              <Star className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                {language === "bn" ? "জনপ্রিয় পণ্য" : "Featured Products"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {language === "bn"
                  ? "সেরা ডিসকাউন্ট ও নতুন পণ্য"
                  : "Best deals & new arrivals"}
              </p>
            </div>
          </div>
          <Link to="/shop">
            <Button3D variant="primary" size="sm" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              {language === "bn" ? "সব দেখুন" : "View All"}
              <ArrowRight className="h-4 w-4" />
            </Button3D>
          </Link>
        </div>

        {/* Products Carousel */}
        <Carousel
          opts={{ align: "start", loop: true }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 sm:-ml-3 md:-ml-4">
            {featured.map((product) => (
              <CarouselItem
                key={product.id}
                className="pl-2 sm:pl-3 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
              >
                <ProductCard product={toDisplay(product)} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-center gap-2 mt-6">
            <CarouselPrevious className="static translate-y-0 bg-background hover:bg-primary hover:text-primary-foreground" />
            <CarouselNext className="static translate-y-0 bg-background hover:bg-primary hover:text-primary-foreground" />
          </div>
        </Carousel>
      </div>
    </section>
  );
};
