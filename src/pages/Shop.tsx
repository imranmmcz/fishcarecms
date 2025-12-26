import { useState } from "react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { useProducts, getDiscountedPrice } from "@/contexts/ProductsContext";
import { fishProducts as staticProducts, productCategories } from "@/data/fishProductData";
import { ShoppingBag, Loader2 } from "lucide-react";

const Shop = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const { products: dbProducts, isLoading } = useProducts();

  // Combine database products with static products (db products take priority)
  const allProducts = [
    // Convert DB products to the format expected by ProductCard
    ...dbProducts.map((p) => ({
      id: p.id,
      name: p.name,
      nameEn: p.name,
      description: p.description || "",
      price: getDiscountedPrice(p.price, p.discount_percentage),
      originalPrice: p.discount_percentage > 0 ? p.price : undefined,
      image: p.image_url || "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop",
      category: p.category as "medicine" | "food" | "accessories",
      categoryLabel: p.category === "medicine" ? "ঔষধ" : p.category === "food" ? "খাবার" : "সরঞ্জাম",
      featured: false,
      externalLink: p.external_link || "https://fishcare.com.bd",
    })),
    // Include static products as fallback
    ...staticProducts,
  ];

  const filteredProducts = activeCategory === "all" 
    ? allProducts 
    : allProducts.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero */}
      <section className="bg-gradient-hero py-12 text-white">
        <div className="container text-center">
          <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h1 className="text-3xl md:text-4xl font-bold">পণ্য সমূহ</h1>
          <p className="text-white/80 mt-2">মাছ চাষের জন্য প্রয়োজনীয় সব পণ্য</p>
        </div>
      </section>

      {/* Filters */}
      <div className="container py-8">
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

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            এই ক্যাটাগরিতে কোন পণ্য নেই
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
