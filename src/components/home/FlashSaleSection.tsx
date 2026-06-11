import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Zap, Clock, ShoppingCart, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useActiveFlashSale } from "@/hooks/useFlashSales";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/contexts/ProductsContext";

function CountdownTimer({ endTime }: { endTime: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };
    setTimeLeft(calc());
    const timer = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-1.5">
      {[
        { val: timeLeft.days, label: "দিন" },
        { val: timeLeft.hours, label: "ঘণ্টা" },
        { val: timeLeft.minutes, label: "মিনিট" },
        { val: timeLeft.seconds, label: "সেকেন্ড" },
      ].map((item, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="bg-background/90 backdrop-blur text-foreground font-bold text-lg md:text-xl px-2.5 py-1 rounded-lg min-w-[44px] text-center shadow-sm border border-border/50">
            {pad(item.val)}
          </div>
          <span className="text-[10px] text-white/80 mt-0.5">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function FlashSaleSection() {
  const { flashSale, isLoading } = useActiveFlashSale();
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const { language } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  if (isLoading || !flashSale || flashSale.items.length === 0) return null;

  const isBn = language === "bn";
  const title = isBn && flashSale.title_bn ? flashSale.title_bn : flashSale.title;

  const getDiscountedPrice = (price: number, item: typeof flashSale.items[0]) => {
    const dType = item.override_discount_type || flashSale.discount_type;
    const dValue = item.override_discount_value ?? flashSale.discount_value;
    if (dType === "percentage") return Math.round(price * (1 - dValue / 100));
    return Math.max(0, price - dValue);
  };

  const getDiscountLabel = (item: typeof flashSale.items[0]) => {
    const dType = item.override_discount_type || flashSale.discount_type;
    const dValue = item.override_discount_value ?? flashSale.discount_value;
    return dType === "percentage" ? `${dValue}%` : `৳${dValue}`;
  };

  const handleAddToCart = (item: typeof flashSale.items[0]) => {
    if (!item.product) return;
    const p = item.product;
    const discountedPrice = getDiscountedPrice(p.price, item);
    const dbProduct: Product = {
      id: p.id,
      name: p.name,
      description: null,
      price: p.price,
      cost_price: 0,
      discount_percentage: flashSale.discount_type === "percentage"
        ? (item.override_discount_value ?? flashSale.discount_value)
        : Math.round(((p.price - discountedPrice) / p.price) * 100),
      category: "",
      image_url: p.image_url,
      external_link: null,
      stock_quantity: p.stock_quantity,
      sku: null,
      unit: null,
      reorder_level: null,
      company_id: null,
      brand_id: null,
      created_at: "",
      updated_at: "",
    };
    addToCart(dbProduct, 1);
  };

  return (
    <section className="py-8 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute animate-pulse" style={{
            left: `${15 + i * 15}%`, top: `${10 + (i % 3) * 30}%`,
            animationDelay: `${i * 0.3}s`,
          }}>
            <Zap className="h-8 w-8 text-white/10" />
          </div>
        ))}
      </div>

      <div className="container relative z-10">
        {/* Header */}
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          aria-controls="flash-sale-panel"
          aria-label={isBn
            ? `${expanded ? "ফ্ল্যাশ সেল লুকান" : "ফ্ল্যাশ সেল দেখুন"}: ${title}`
            : `${expanded ? "Hide" : "Show"} flash sale: ${title}`}
          onKeyDown={(e) => {
            if (e.key === "Escape" && expanded) {
              e.preventDefault();
              setExpanded(false);
            }
          }}
          className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur rounded-xl p-2.5 animate-pulse">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>
              {flashSale.description_bn && isBn && (
                <p className="text-white/80 text-sm">{flashSale.description_bn}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white/90">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">{isBn ? "শেষ হবে:" : "Ends in:"}</span>
            </div>
            <CountdownTimer endTime={flashSale.end_time} />
            <span className="ml-2 bg-white/20 backdrop-blur rounded-full p-1.5 text-white" aria-hidden>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </div>
        </button>

        {/* Products Slider — visible on click */}
        <div
          id="flash-sale-panel"
          role="region"
          aria-label={isBn ? "ফ্ল্যাশ সেল পণ্য" : "Flash sale products"}
          hidden={!expanded}
        >
        {expanded && (
        <>
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory animate-fade-in" style={{ scrollbarWidth: "none" }}>
          {flashSale.items.map(item => {
            if (!item.product) return null;
            const p = item.product;
            const discounted = getDiscountedPrice(p.price, item);
            const soldOut = item.stock_limit ? item.sold_count >= item.stock_limit : false;

            return (
              <div key={item.id} className="flex-shrink-0 w-[220px] md:w-[240px] snap-start">
                <div className="bg-background rounded-xl overflow-hidden shadow-lg border border-border/50 group hover:shadow-xl transition-all">
                  <Link to={`/product/${p.id}`} className="block relative aspect-square overflow-hidden bg-muted">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ShoppingCart className="h-12 w-12" />
                      </div>
                    )}
                    <Badge className="absolute top-2 left-2 bg-red-600 text-white border-0 text-xs font-bold animate-pulse">
                      <Zap className="h-3 w-3 mr-1" />
                      {getDiscountLabel(item)} {isBn ? "ছাড়" : "OFF"}
                    </Badge>
                    {soldOut && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{isBn ? "স্টক শেষ" : "Sold Out"}</span>
                      </div>
                    )}
                  </Link>
                  <div className="p-3 space-y-2">
                    <Link to={`/product/${p.id}`}>
                      <h3 className="text-sm font-medium text-foreground line-clamp-2 hover:text-primary transition-colors">{p.name}</h3>
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-red-600">{formatPrice(discounted)}</span>
                      <span className="text-sm text-muted-foreground line-through">{formatPrice(p.price)}</span>
                    </div>
                    {item.stock_limit && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{isBn ? "বিক্রিত" : "Sold"}: {item.sold_count}</span>
                          <span>{isBn ? "বাকি" : "Left"}: {item.stock_limit - item.sold_count}</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (item.sold_count / item.stock_limit) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="w-full gap-1 text-xs"
                      disabled={soldOut}
                      onClick={() => handleAddToCart(item)}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      {isBn ? "কার্টে যোগ করুন" : "Add to Cart"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All link */}
        <div className="flex justify-center mt-4">
          <Link to="/shop" className="inline-flex items-center gap-2 text-white/90 hover:text-white text-sm font-medium transition-colors">
            {isBn ? "সকল পণ্য দেখুন" : "View All Products"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        </>
        )}
        </div>
      </div>
    </section>
  );
}
