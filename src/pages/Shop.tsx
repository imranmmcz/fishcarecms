import { useState, useMemo, useRef, useEffect } from "react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { ProductCard, DisplayProduct } from "@/components/ProductCard";
import { useProducts, getDiscountedPrice } from "@/contexts/ProductsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { fishProducts as staticProducts, productCategories } from "@/data/fishProductData";
import { ShoppingBag, Loader2, Search, X, SlidersHorizontal, Pill, Utensils, Wrench, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import AdUnit from "@/components/AdUnit";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

const PRODUCTS_PER_PAGE = 12;

const categoryIcons: Record<string, React.ReactNode> = {
  medicine: <Pill className="h-5 w-5" />,
  food: <Utensils className="h-5 w-5" />,
  accessories: <Wrench className="h-5 w-5" />,
};

const categoryLabels: Record<string, { bn: string; en: string }> = {
  medicine: { bn: "ঔষধ", en: "Medicine" },
  food: { bn: "খাবার", en: "Food" },
  accessories: { bn: "সরঞ্জাম", en: "Accessories" },
};

const Shop = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [appliedPriceRange, setAppliedPriceRange] = useState<[number, number]>([0, 5000]);
  const [sortBy, setSortBy] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);
  const searchRef = useRef<HTMLDivElement>(null);
  const { products: dbProducts, isLoading } = useProducts();
  const { t, language } = useLanguage();

  // Combine database products with static products
  const allProducts = useMemo((): DisplayProduct[] => [
    ...dbProducts.map((p) => ({
      id: p.id,
      name: p.name,
      nameEn: p.name,
      description: p.description || "",
      price: getDiscountedPrice(p.price, p.discount_percentage),
      originalPrice: p.discount_percentage > 0 ? p.price : undefined,
      image: p.image_url || undefined,
      image_url: p.image_url || undefined,
      category: p.category as "medicine" | "food" | "accessories",
      categoryLabel: p.category === "medicine" ? (language === "bn" ? "ঔষধ" : "Medicine") : p.category === "food" ? (language === "bn" ? "খাবার" : "Food") : (language === "bn" ? "সরঞ্জাম" : "Accessories"),
      featured: false,
      externalLink: p.external_link || undefined,
      external_link: p.external_link || undefined,
      discount_percentage: p.discount_percentage,
      company: "FishCare BD",
      isFromDatabase: true,
    })),
    ...staticProducts.map((p) => ({
      id: p.id,
      name: p.name,
      nameEn: p.nameEn,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      image: p.image,
      category: p.category as "medicine" | "food" | "accessories",
      categoryLabel: p.categoryLabel,
      featured: p.featured,
      externalLink: p.externalLink,
      company: "FishCare BD",
      isFromDatabase: false,
    })),
  ], [dbProducts, language]);

  // Calculate max price for slider
  const maxPrice = useMemo(() => {
    const prices = allProducts.map((p) => p.price);
    return Math.max(...prices, 5000);
  }, [allProducts]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate search suggestions
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const results: { type: string; value: string; label: string }[] = [];
    
    const productLabel = language === "bn" ? "পণ্য" : "Product";
    const categoryLabel = language === "bn" ? "ক্যাটাগরি" : "Category";
    const companyLabel = language === "bn" ? "কোম্পানি" : "Company";

    // Product name matches
    allProducts.forEach((p) => {
      if (p.name.toLowerCase().includes(query) || (p.nameEn && p.nameEn.toLowerCase().includes(query))) {
        if (!results.find((r) => r.value === p.name)) {
          results.push({ type: productLabel, value: p.name, label: p.name });
        }
      }
    });

    // Category matches
    productCategories.forEach((cat) => {
      if (cat.label.toLowerCase().includes(query) && cat.value !== "all") {
        if (!results.find((r) => r.value === cat.value)) {
          results.push({ type: categoryLabel, value: cat.value, label: cat.label });
        }
      }
    });

    return results.slice(0, 8);
  }, [searchQuery, allProducts, language]);

  // Filter products based on all criteria
  const filteredProducts = useMemo(() => {
    let result = allProducts.filter((product) => {
      if (activeCategory !== "all" && product.category !== activeCategory) return false;
      if (product.price < appliedPriceRange[0] || product.price > appliedPriceRange[1]) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query) || 
                           (product.nameEn && product.nameEn.toLowerCase().includes(query));
        const matchesCategory = product.categoryLabel.toLowerCase().includes(query);
        const matchesDescription = product.description.toLowerCase().includes(query);
        if (!matchesName && !matchesCategory && !matchesDescription) return false;
      }
      return true;
    });

    // Sort
    switch (sortBy) {
      case "price-low":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "discount":
        result = [...result].sort((a, b) => (b.discount_percentage || 0) - (a.discount_percentage || 0));
        break;
      case "name-az":
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [allProducts, activeCategory, appliedPriceRange, searchQuery, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, appliedPriceRange, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);


  // Group filtered products by category
  const groupedProducts = useMemo(() => {
    const groups: Record<string, typeof filteredProducts> = {
      medicine: [],
      food: [],
      accessories: [],
    };

    filteredProducts.forEach((product) => {
      if (groups[product.category]) {
        groups[product.category].push(product);
      }
    });

    return groups;
  }, [filteredProducts]);

  const handleSuggestionClick = (suggestion: { type: string; value: string; label: string }) => {
    const categoryLabelText = language === "bn" ? "ক্যাটাগরি" : "Category";
    if (suggestion.type === categoryLabelText) {
      setActiveCategory(suggestion.value);
      setSearchQuery("");
    } else {
      setSearchQuery(suggestion.label);
    }
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const applyPriceFilter = () => {
    setAppliedPriceRange(priceRange);
  };

  const resetFilters = () => {
    setActiveCategory("all");
    setSearchQuery("");
    setPriceRange([0, maxPrice]);
    setAppliedPriceRange([0, maxPrice]);
    setSortBy("default");
    setCurrentPage(1);
  };

  const filterLabel = language === "bn" ? "ফিল্টার" : "Filter";
  const resetLabel = language === "bn" ? "রিসেট" : "Reset";

  // Check if we should show category-wise view
  const showCategoryWise = activeCategory === "all" && !searchQuery.trim();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Header Ad */}
      <div className="container mx-auto px-4 py-4">
        <AdUnit position="header" className="mb-4" />
      </div>
      
      {/* Hero */}
      <section className="bg-gradient-hero py-12 text-white">
        <div className="container text-center">
          <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h1 className="text-3xl md:text-4xl font-bold">{t.products}</h1>
          <p className="text-white/80 mt-2">{t.productsForFishing}</p>
        </div>
      </section>

      <div className="container py-8">
        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search Input with Suggestions */}
          <div ref={searchRef} className="relative flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="pl-10 pr-10 h-12 text-base rounded-xl border-2 focus:border-primary"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-card border rounded-xl shadow-xl overflow-hidden">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.value}-${index}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors text-left"
                  >
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {suggestion.type}
                    </span>
                    <span className="font-medium">{suggestion.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price Filter Button (Mobile) */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-12 px-6 rounded-xl border-2 md:hidden">
                <SlidersHorizontal className="h-5 w-5 mr-2" />
                {filterLabel}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto rounded-t-3xl">
              <SheetHeader>
                <SheetTitle>{t.priceFilter}</SheetTitle>
              </SheetHeader>
              <div className="py-6 space-y-6">
                <div>
                  <div className="flex justify-between mb-4 text-sm font-medium">
                    <span>৳{priceRange[0]}</span>
                    <span>৳{priceRange[1]}</span>
                  </div>
                  <Slider
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    max={maxPrice}
                    step={50}
                    className="mb-4"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={resetFilters} className="flex-1">
                    {resetLabel}
                  </Button>
                  <Button onClick={applyPriceFilter} className="flex-1">
                    {t.applyFilter}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Price Filter (Desktop) */}
          <div className="hidden md:flex items-center gap-4 bg-card border-2 rounded-xl px-4 py-2">
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">{t.price}:</span>
              <span className="font-medium whitespace-nowrap">৳{priceRange[0]} - ৳{priceRange[1]}</span>
            </div>
            <Slider
              value={priceRange}
              onValueChange={(value) => {
                setPriceRange(value as [number, number]);
                setAppliedPriceRange(value as [number, number]);
              }}
              max={maxPrice}
              step={50}
              className="w-40"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {productCategories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-5 py-2.5 rounded-xl font-bold transition-all duration-200 border-b-4 ${
                activeCategory === cat.value
                  ? "bg-primary text-primary-foreground border-primary/70 shadow-md"
                  : "bg-muted text-muted-foreground border-muted-foreground/20 hover:bg-muted/80"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results Count & Sort */}
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-muted-foreground">
            {filteredProducts.length} {t.productsFound}
            {(searchQuery || activeCategory !== "all" || appliedPriceRange[0] > 0 || appliedPriceRange[1] < maxPrice || sortBy !== "default") && (
              <button
                onClick={resetFilters}
                className="ml-3 text-primary hover:underline font-medium"
              >
                {t.resetFilters}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] h-9 rounded-lg">
                <SelectValue placeholder={language === "bn" ? "সাজানো" : "Sort by"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">{language === "bn" ? "ডিফল্ট" : "Default"}</SelectItem>
                <SelectItem value="price-low">{language === "bn" ? "দাম: কম → বেশি" : "Price: Low → High"}</SelectItem>
                <SelectItem value="price-high">{language === "bn" ? "দাম: বেশি → কম" : "Price: High → Low"}</SelectItem>
                <SelectItem value="discount">{language === "bn" ? "বেশি ছাড়" : "Most Discount"}</SelectItem>
                <SelectItem value="name-az">{language === "bn" ? "নাম: ক → হ" : "Name: A → Z"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Products Display */}
        {!isLoading && (
          <>
            {showCategoryWise ? (
              // Category-wise grouped view
              <div className="space-y-12">
                {Object.entries(groupedProducts).map(([category, products]) => {
                  if (products.length === 0) return null;
                  
                  const categoryInfo = categoryLabels[category];
                  const label = language === "bn" ? categoryInfo.bn : categoryInfo.en;
                  
                  return (
                    <section key={category}>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                          {categoryIcons[category]}
                        </div>
                        <h2 className="text-2xl font-bold">{label}</h2>
                        <span className="text-muted-foreground">({products.length})</span>
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => (
                          <ProductCard key={`${product.isFromDatabase ? 'db' : 'static'}-${product.id}`} product={product} />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : (
              // Filtered view (non-grouped) with pagination
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedProducts.map((product) => (
                  <ProductCard key={`${product.isFromDatabase ? 'db' : 'static'}-${product.id}`} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!showCategoryWise && totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((page, idx, arr) => {
                      const elements: React.ReactNode[] = [];
                      if (idx > 0 && page - arr[idx - 1] > 1) {
                        elements.push(
                          <PaginationItem key={`ellipsis-${page}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      elements.push(
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={page === currentPage}
                            onClick={() => setCurrentPage(page)}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                      return elements;
                    })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2">{t.noProductFound}</h3>
            <p className="text-muted-foreground mb-4">
              {language === "bn" ? "অন্য কীওয়ার্ড দিয়ে খুঁজুন অথবা ফিল্টার পরিবর্তন করুন" : "Try a different keyword or change filters"}
            </p>
            <Button variant="outline" onClick={resetFilters}>
              {t.resetFilters}
            </Button>
          </div>
        )}
        
        {/* Footer Ad */}
        <div className="mt-8">
          <AdUnit position="footer" />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Shop;
