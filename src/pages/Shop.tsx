import { useState } from "react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { fishProducts, productCategories } from "@/data/fishProductData";
import { ShoppingBag } from "lucide-react";

const Shop = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredProducts = activeCategory === "all" 
    ? fishProducts 
    : fishProducts.filter((p) => p.category === activeCategory);

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

        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Shop;
