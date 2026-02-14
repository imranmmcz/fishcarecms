import { useWishlist } from "@/contexts/WishlistContext";
import { useProducts, getDiscountedPrice } from "@/contexts/ProductsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProductCard, DisplayProduct } from "@/components/ProductCard";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Wishlist = () => {
  const { wishlist } = useWishlist();
  const { products } = useProducts();
  const { language } = useLanguage();

  const wishlistProducts: DisplayProduct[] = products
    .filter((p) => wishlist.includes(p.id))
    .map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description || "",
      price: product.discount_percentage && product.discount_percentage > 0
        ? getDiscountedPrice(product.price, product.discount_percentage)
        : product.price,
      originalPrice: product.discount_percentage && product.discount_percentage > 0 ? product.price : undefined,
      image_url: product.image_url || undefined,
      category: product.category as "medicine" | "food" | "accessories",
      categoryLabel: product.category === "medicine" ? (language === "bn" ? "ঔষধ" : "Medicine")
        : product.category === "food" ? (language === "bn" ? "খাদ্য" : "Food")
        : (language === "bn" ? "সরঞ্জাম" : "Accessories"),
      external_link: product.external_link || undefined,
      discount_percentage: product.discount_percentage || 0,
      isFromDatabase: true,
    }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-7 w-7 text-destructive fill-destructive" />
          <h1 className="text-3xl font-bold text-foreground">
            {language === "bn" ? "আমার উইশলিস্ট" : "My Wishlist"}
          </h1>
          <span className="bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full">
            {wishlistProducts.length}
          </span>
        </div>

        {wishlistProducts.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto" />
            <h2 className="text-xl font-semibold text-muted-foreground">
              {language === "bn" ? "আপনার উইশলিস্ট খালি" : "Your wishlist is empty"}
            </h2>
            <p className="text-muted-foreground">
              {language === "bn"
                ? "পছন্দের পণ্যে হার্ট আইকনে ক্লিক করে উইশলিস্টে যোগ করুন"
                : "Click the heart icon on products to add them to your wishlist"}
            </p>
            <Link to="/shop">
              <Button className="mt-4">
                {language === "bn" ? "শপে যান" : "Go to Shop"}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistProducts.map((product) => (
              <ProductCard key={String(product.id)} product={product} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Wishlist;
