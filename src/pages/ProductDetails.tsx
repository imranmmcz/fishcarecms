import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useProducts, getDiscountedPrice } from "@/contexts/ProductsContext";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button3D } from "@/components/ui/button-3d";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import AdUnit from "@/components/AdUnit";
import { StarRating } from "@/components/StarRating";
import { ProductReviews } from "@/components/ProductReviews";
import { 
  ArrowLeft, 
  ShoppingCart, 
  ExternalLink, 
  Plus, 
  Minus, 
  Package, 
  Tag, 
  Pill, 
  Utensils, 
  Wrench,
  Check,
  Truck,
  Shield,
  Clock,
  Loader2,
  Share2,
  Heart
} from "lucide-react";
import { toast } from "sonner";

interface ProductDetails {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discount_percentage: number | null;
  category: string;
  image_url: string | null;
  external_link: string | null;
  stock_quantity?: number;
  sku?: string | null;
  unit?: string | null;
  brand_name?: string;
  company_name?: string;
  created_at: string;
  updated_at: string;
}

const categoryConfig: Record<string, { icon: React.ReactNode; label: { bn: string; en: string }; color: string }> = {
  medicine: {
    icon: <Pill className="h-5 w-5" />,
    label: { bn: "ঔষধ", en: "Medicine" },
    color: "bg-emerald-100 text-emerald-800",
  },
  food: {
    icon: <Utensils className="h-5 w-5" />,
    label: { bn: "খাবার", en: "Food" },
    color: "bg-orange-100 text-orange-800",
  },
  accessories: {
    icon: <Wrench className="h-5 w-5" />,
    label: { bn: "সরঞ্জাম", en: "Accessories" },
    color: "bg-blue-100 text-blue-800",
  },
};

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { addToCart, isInCart, getItemQuantity, updateQuantity } = useCart();
  const { products } = useProducts();
  
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        if (data) {
          setProduct(data as ProductDetails);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error(language === "bn" ? "পণ্য লোড করতে সমস্যা হয়েছে" : "Failed to load product");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, language]);

  const config = product ? categoryConfig[product.category] || categoryConfig.medicine : categoryConfig.medicine;
  const discountedPrice = product ? getDiscountedPrice(product.price, product.discount_percentage) : 0;
  const inCart = product ? isInCart(product.id) : false;
  const cartQuantity = product ? getItemQuantity(product.id) : 0;

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      discount_percentage: product.discount_percentage,
      category: product.category,
      image_url: product.image_url,
      external_link: product.external_link,
      stock_quantity: product.stock_quantity || 0,
      sku: product.sku || null,
      unit: product.unit || null,
      reorder_level: null,
      company_id: null,
      brand_id: null,
      created_at: product.created_at,
      updated_at: product.updated_at,
    }, quantity);
    
    toast.success(language === "bn" ? "কার্টে যোগ করা হয়েছে" : "Added to cart");
  };

  const handleExternalOrder = () => {
    if (product?.external_link) {
      window.open(product.external_link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = product?.name || "Product";
    
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(language === "bn" ? "লিংক কপি হয়েছে" : "Link copied");
    }
  };

  // Get related products
  const relatedProducts = product 
    ? products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4)
    : [];

  const translations = {
    backToShop: language === "bn" ? "শপে ফিরে যান" : "Back to Shop",
    addToCart: language === "bn" ? "কার্টে যোগ করুন" : "Add to Cart",
    orderNow: language === "bn" ? "এখনই অর্ডার করুন" : "Order Now",
    inStock: language === "bn" ? "স্টকে আছে" : "In Stock",
    outOfStock: language === "bn" ? "স্টক শেষ" : "Out of Stock",
    quantity: language === "bn" ? "পরিমাণ" : "Quantity",
    category: language === "bn" ? "ক্যাটাগরি" : "Category",
    sku: language === "bn" ? "স্কু" : "SKU",
    unit: language === "bn" ? "একক" : "Unit",
    brand: language === "bn" ? "ব্র্যান্ড" : "Brand",
    company: language === "bn" ? "কোম্পানি" : "Company",
    description: language === "bn" ? "বিবরণ" : "Description",
    features: language === "bn" ? "সুবিধাসমূহ" : "Features",
    freeShipping: language === "bn" ? "বিনামূল্যে শিপিং" : "Free Shipping",
    securePayment: language === "bn" ? "নিরাপদ পেমেন্ট" : "Secure Payment",
    fastDelivery: language === "bn" ? "দ্রুত ডেলিভারি" : "Fast Delivery",
    relatedProducts: language === "bn" ? "সম্পর্কিত পণ্য" : "Related Products",
    productNotFound: language === "bn" ? "পণ্য পাওয়া যায়নি" : "Product not found",
    off: language === "bn" ? "ছাড়" : "OFF",
    share: language === "bn" ? "শেয়ার" : "Share",
    wishlist: language === "bn" ? "পছন্দের তালিকা" : "Wishlist",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <Package className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">{translations.productNotFound}</h1>
          <Button3D variant="primary" onClick={() => navigate("/shop")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {translations.backToShop}
          </Button3D>
        </div>
        <Footer />
      </div>
    );
  }

  const hasValidImage = product.image_url && !product.image_url.includes("placeholder");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Header Ad */}
      <div className="container mx-auto px-4 py-4">
        <AdUnit position="header" className="mb-4" />
      </div>

      <div className="container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/shop" className="hover:text-primary transition-colors">
            {language === "bn" ? "শপ" : "Shop"}
          </Link>
          <span>/</span>
          <span>{config.label[language]}</span>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{product.name}</span>
        </div>

        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate("/shop")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {translations.backToShop}
        </Button>

        {/* Main Product Section */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <div className="relative">
            <div className="aspect-square rounded-3xl overflow-hidden bg-muted sticky top-24">
              {hasValidImage ? (
                <img
                  src={product.image_url!}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${
                  product.category === "medicine" ? "from-emerald-500/20 to-teal-500/20" :
                  product.category === "food" ? "from-orange-500/20 to-amber-500/20" :
                  "from-blue-500/20 to-indigo-500/20"
                }`}>
                  <div className="text-primary/60 scale-150">
                    {config.icon}
                  </div>
                </div>
              )}
              
              {/* Discount Badge */}
              {product.discount_percentage > 0 && (
                <Badge className="absolute top-4 right-4 bg-destructive text-destructive-foreground text-lg px-4 py-2">
                  {product.discount_percentage}% {translations.off}
                </Badge>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category Badge */}
            <Badge className={`${config.color} gap-2`}>
              {config.icon}
              {config.label[language]}
            </Badge>

            {/* Title */}
            <h1 className="text-3xl lg:text-4xl font-bold">{product.name}</h1>

            {/* SKU & Stock */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {product.sku && (
                <span className="text-muted-foreground">
                  {translations.sku}: <strong>{product.sku}</strong>
                </span>
              )}
              {product.stock_quantity !== undefined && (
                <Badge variant={product.stock_quantity > 0 ? "outline" : "destructive"} className="gap-1">
                  {product.stock_quantity > 0 ? (
                    <>
                      <Check className="h-3 w-3" />
                      {translations.inStock} ({product.stock_quantity})
                    </>
                  ) : translations.outOfStock}
                </Badge>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-bold text-primary">
                {formatPrice(discountedPrice)}
              </span>
              {product.discount_percentage > 0 && (
                <span className="text-xl text-muted-foreground line-through">
                  {formatPrice(product.price)}
                </span>
              )}
              {product.unit && (
                <span className="text-muted-foreground">/ {product.unit}</span>
              )}
            </div>

            <Separator />

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="font-semibold mb-2">{translations.description}</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}

            {/* Brand & Company */}
            {(product.brand_name || product.company_name) && (
              <div className="flex flex-wrap gap-4 text-sm">
                {product.brand_name && (
                  <span className="text-muted-foreground">
                    {translations.brand}: <strong>{product.brand_name}</strong>
                  </span>
                )}
                {product.company_name && (
                  <span className="text-muted-foreground">
                    {translations.company}: <strong>{product.company_name}</strong>
                  </span>
                )}
              </div>
            )}

            <Separator />

            {/* Quantity Selector */}
            <div className="space-y-3">
              <label className="font-semibold">{translations.quantity}</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={product.stock_quantity !== undefined && quantity >= product.stock_quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Quick quantity buttons */}
                <div className="flex gap-2">
                  {[1, 5, 10].map(q => (
                    <Button
                      key={q}
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(q)}
                      className={quantity === q ? "border-primary" : ""}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {inCart ? (
                <div className="flex items-center justify-between bg-muted rounded-xl p-4 flex-1">
                  <span className="font-medium flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    {language === "bn" ? "কার্টে আছে" : "In Cart"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(product.id, cartQuantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="font-bold text-lg w-8 text-center">{cartQuantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(product.id, cartQuantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button3D 
                  variant="primary" 
                  size="lg" 
                  className="flex-1 gap-2"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {translations.addToCart}
                </Button3D>
              )}
              
              {product.external_link && (
                <Button3D 
                  variant="success"
                  size="lg" 
                  className="flex-1 gap-2"
                  onClick={handleExternalOrder}
                >
                  <ExternalLink className="h-5 w-5" />
                  {translations.orderNow}
                </Button3D>
              )}
            </div>

            {/* Share & Wishlist */}
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                {translations.share}
              </Button>
              <Button variant="outline" className="gap-2">
                <Heart className="h-4 w-4" />
                {translations.wishlist}
              </Button>
            </div>

            {/* Features */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-xs font-medium">{translations.freeShipping}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-xs font-medium">{translations.securePayment}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-xs font-medium">{translations.fastDelivery}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reviews Section */}
        {product && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">
              {language === "bn" ? "রিভিউ ও রেটিং" : "Reviews & Ratings"}
            </h2>
            <ProductReviews productId={product.id} />
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">{translations.relatedProducts}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <Link 
                  key={p.id} 
                  to={`/product/${p.id}`}
                  className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-300 border border-border/50"
                >
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <Package className="h-16 w-16 text-muted-foreground" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">{p.name}</h3>
                    <p className="text-lg font-bold text-primary mt-1">
                      {formatPrice(getDiscountedPrice(p.price, p.discount_percentage))}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
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

export default ProductDetails;
