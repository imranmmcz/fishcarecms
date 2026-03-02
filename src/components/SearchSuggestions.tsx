import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDiscountedPrice } from "@/contexts/ProductsContext";
import { useCurrency } from "@/contexts/CurrencyContext";

interface SuggestedProduct {
  id: string;
  name: string;
  price: number;
  discount_percentage: number | null;
  image_url: string | null;
  category: string;
}

interface SearchSuggestionsProps {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export const SearchSuggestions = ({ placeholder, className, inputClassName }: SearchSuggestionsProps) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestedProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase
          .from("products")
          .select("id, name, price, discount_percentage, image_url, category")
          .ilike("name", `%${query.trim()}%`)
          .limit(6);
        setSuggestions(data || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelect = (product: SuggestedProduct) => {
    setShowSuggestions(false);
    setQuery("");
    navigate(`/product/${product.id}`);
  };

  return (
    <div ref={containerRef} className={`relative ${className || ""}`}>
      <form onSubmit={handleSubmit} className="relative w-full">
        <Input
          type="text"
          placeholder={placeholder || (language === "bn" ? "পণ্য খুঁজুন..." : "Search products...")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          className={`w-full pr-10 h-10 border-border bg-background text-sm rounded-md ${inputClassName || ""}`}
        />
        {query ? (
          <button type="button" onClick={() => { setQuery(""); setSuggestions([]); setShowSuggestions(false); }} className="absolute right-8 top-0 h-full px-1 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <button type="submit" className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground transition-colors">
          <Search className="h-4 w-4" />
        </button>
      </form>

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-[100] max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              {language === "bn" ? "খুঁজছে..." : "Searching..."}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              {language === "bn" ? "কোন পণ্য পাওয়া যায়নি" : "No products found"}
            </div>
          ) : (
            <>
              {suggestions.map((product) => {
                const finalPrice = product.discount_percentage && product.discount_percentage > 0
                  ? getDiscountedPrice(product.price, product.discount_percentage)
                  : product.price;
                return (
                  <button
                    key={product.id}
                    onClick={() => handleSelect(product)}
                    className="w-full flex items-center gap-3 p-2.5 hover:bg-accent transition-colors text-left"
                  >
                    <div className="h-10 w-10 rounded bg-muted flex-shrink-0 overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                          <Search className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-primary">{formatPrice(finalPrice)}</span>
                        {product.discount_percentage && product.discount_percentage > 0 && (
                          <span className="text-[10px] line-through text-muted-foreground">{formatPrice(product.price)}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
              <button
                onClick={handleSubmit}
                className="w-full p-2.5 text-center text-sm text-primary hover:bg-accent transition-colors border-t border-border"
              >
                {language === "bn" ? `"${query}" এর সব ফলাফল দেখুন` : `See all results for "${query}"`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
