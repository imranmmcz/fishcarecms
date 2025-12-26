import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { Button3D } from "@/components/ui/button-3d";
import { fishProducts } from "@/data/fishProductData";
import { Link } from "react-router-dom";

export const ProductSlider = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const featuredProducts = fishProducts.filter((p) => p.featured);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener("scroll", checkScroll);
      return () => ref.removeEventListener("scroll", checkScroll);
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-16 bg-gradient-to-b from-muted/30 to-background">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-500" />
              <span className="text-sm font-bold text-amber-600 uppercase tracking-wider">
                জনপ্রিয় পণ্য
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              বিশেষ পণ্য সমূহ
            </h2>
            <p className="text-muted-foreground max-w-xl">
              মাছ চাষের জন্য প্রয়োজনীয় সেরা ঔষধ, খাবার ও সরঞ্জাম - সবকিছু এক জায়গায়
            </p>
          </div>

          <Link to="/shop">
            <Button3D variant="primary" size="md">
              সকল পণ্য দেখুন
            </Button3D>
          </Link>
        </div>

        {/* Slider Container */}
        <div className="relative">
          {/* Left Arrow */}
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 rounded-full bg-background shadow-elegant border border-border flex items-center justify-center transition-all duration-200 ${
              canScrollLeft
                ? "hover:bg-primary hover:text-primary-foreground hover:scale-110"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Products */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-[280px] snap-start"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 rounded-full bg-background shadow-elegant border border-border flex items-center justify-center transition-all duration-200 ${
              canScrollRight
                ? "hover:bg-primary hover:text-primary-foreground hover:scale-110"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {featuredProducts.map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-primary/30 transition-all"
            />
          ))}
        </div>
      </div>
    </section>
  );
};
