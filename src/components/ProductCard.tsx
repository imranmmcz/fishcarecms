import { useState, useEffect, useCallback } from "react";
import { Zap as ZapIcon } from "lucide-react";
import { ExternalLink, Pill, Utensils, Wrench, ShoppingCart, Plus, Minus, Check, Eye, Package, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button3D } from "@/components/ui/button-3d";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Product } from "@/contexts/ProductsContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { supabase } from "@/integrations/supabase/client";
import QuickViewModal from "@/components/QuickViewModal";
import { useFlashSaleForProduct } from "@/hooks/useFlashSales";

// Extended product type that can come from database or static data
export interface DisplayProduct {
  id: number | string;
  name: string;
  nameEn?: string;
  description: string;
  price: number;
  originalPrice?: number;
  image?: string;
  image_url?: string;
  category: "medicine" | "food" | "accessories";
  categoryLabel: string;
  externalLink?: string;
  external_link?: string;
  discount_percentage?: number;
  isFromDatabase?: boolean;
}

interface ProductCardProps {
  product: DisplayProduct;
}

// Category-specific icons and colors
const categoryConfig: Record<string, { icon: React.ReactNode; bgClass: string }> = {
  medicine: {
    icon: <Pill className="h-16 w-16" />,
    bgClass: "from-emerald-500/20 to-teal-500/20",
  },
  food: {
    icon: <Utensils className="h-16 w-16" />,
    bgClass: "from-orange-500/20 to-amber-500/20",
  },
  accessories: {
    icon: <Wrench className="h-16 w-16" />,
    bgClass: "from-blue-500/20 to-indigo-500/20",
  },
};

// Check if image URL is valid (not a placeholder or empty)
const isValidImage = (imageUrl: string | undefined): boolean => {
  if (!imageUrl) return false;
  if (imageUrl.includes("placeholder")) return false;
  if (imageUrl.includes("unsplash.com/photo-1544551763-46a013bb70d5")) return false;
  return true;
};

interface ProductImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const { addToCart, isInCart, getItemQuantity, updateQuantity } = useCart();
  const { formatPrice } = useCurrency();
  const { language } = useLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();
  const wishlisted = product.isFromDatabase && isInWishlist(String(product.id));
  const flashSaleDiscount = useFlashSaleForProduct(product.isFromDatabase ? String(product.id) : "");
  
  const mainImageUrl = product.image_url || product.image;
  const config = categoryConfig[product.category] || categoryConfig.medicine;
  const inCart = product.isFromDatabase && isInCart(String(product.id));
  const quantity = product.isFromDatabase ? getItemQuantity(String(product.id)) : 0;
  const externalLink = product.external_link || product.externalLink;

  // Calculate flash sale price
  const flashPrice = flashSaleDiscount
    ? flashSaleDiscount.type === "percentage"
      ? Math.round((product.originalPrice || product.price) * (1 - flashSaleDiscount.value / 100))
      : Math.max(0, (product.originalPrice || product.price) - flashSaleDiscount.value)
    : null;
  const displayPrice = flashPrice ?? product.price;
  const showFlashBadge = !!flashSaleDiscount;

  // Fetch product gallery images
  useEffect(() => {
    if (!product.isFromDatabase) return;
    
    const fetchImages = async () => {
      const { data } = await supabase
        .from("product_images")
        .select("image_url, display_order, is_primary")
        .eq("product_id", String(product.id))
        .order("display_order", { ascending: true });
      
      if (data && data.length > 0) {
        const urls = data.map(img => img.image_url);
        // If main image exists and not already in gallery, prepend it
        if (mainImageUrl && isValidImage(mainImageUrl) && !urls.includes(mainImageUrl)) {
          setGalleryImages([mainImageUrl, ...urls]);
        } else {
          setGalleryImages(urls);
        }
      } else if (mainImageUrl && isValidImage(mainImageUrl)) {
        setGalleryImages([mainImageUrl]);
      }
    };
    
    fetchImages();
  }, [product.id, product.isFromDatabase, mainImageUrl]);

  const images = galleryImages.length > 0 ? galleryImages : (isValidImage(mainImageUrl) ? [mainImageUrl!] : []);
  const hasMultipleImages = images.length > 1;

  const goToPrev = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const handleOrderClick = () => {
    if (externalLink) {
      window.open(externalLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleAddToCart = () => {
    if (product.isFromDatabase) {
      const dbProduct: Product = {
        id: String(product.id),
        name: product.name,
        description: product.description || null,
        price: product.originalPrice || product.price,
        cost_price: 0,
        discount_percentage: product.discount_percentage || 0,
        category: product.category,
        image_url: product.image_url || null,
        external_link: product.external_link || null,
        stock_quantity: 0,
        sku: null,
        unit: null,
        reorder_level: null,
        company_id: null,
        brand_id: null,
        created_at: '',
        updated_at: '',
      };
      addToCart(dbProduct, 1);
    }
  };

  const handleOrderNow = () => {
    if (product.isFromDatabase) {
      if (!inCart) {
        handleAddToCart();
      }
      navigate("/checkout");
    }
  };

  const translations = {
    orderNow: language === "bn" ? "অর্ডার করুন" : "Order Now",
    addToCart: language === "bn" ? "কার্টে যোগ করুন" : "Add to Cart",
    inCart: language === "bn" ? "কার্টে আছে" : "In Cart",
    discount: language === "bn" ? "ছাড়" : "OFF",
    viewDetails: language === "bn" ? "বিস্তারিত দেখুন" : "View Details",
  };

  return (
    <div className="group relative bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-300 border border-border/50">
      {/* Product Image Gallery */}
      <Link 
        to={product.isFromDatabase ? `/product/${product.id}` : "#"} 
        className="block relative aspect-square overflow-hidden bg-muted"
        onClick={(e) => !product.isFromDatabase && e.preventDefault()}
      >
        {images.length > 0 ? (
          <div className="relative w-full h-full">
            {images.map((imgUrl, idx) => (
              <img
                key={idx}
                src={imgUrl}
                alt={`${product.name} - ${idx + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  idx === currentImageIndex ? "opacity-100" : "opacity-0"
                } group-hover:scale-110 transition-transform duration-500`}
              />
            ))}
            
            {/* Navigation Arrows */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={goToPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background text-foreground rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background text-foreground rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Dot Indicators */}
            {hasMultipleImages && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentImageIndex 
                        ? "bg-primary w-4" 
                        : "bg-background/70 hover:bg-background"
                    }`}
                    aria-label={`Image ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Image Counter */}
            {hasMultipleImages && (
              <span className="absolute bottom-2 right-2 z-10 bg-background/80 text-foreground text-xs px-2 py-0.5 rounded-full">
                {currentImageIndex + 1}/{images.length}
              </span>
            )}
          </div>
        ) : (
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${config.bgClass}`}>
            <div className="text-primary/60 group-hover:scale-110 transition-transform duration-500">
              {config.icon}
            </div>
          </div>
        )}
        
        {/* Category Badge */}
        <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-md z-10">
          {product.categoryLabel}
        </span>

        {/* Wishlist Heart Button */}
        {product.isFromDatabase && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(String(product.id));
            }}
            className="absolute top-12 left-3 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-all z-10"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`h-4 w-4 transition-colors ${wishlisted ? "text-destructive fill-destructive" : "text-muted-foreground"}`} />
          </button>
        )}

        {/* Flash Sale Badge */}
        {showFlashBadge && (
          <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-destructive text-destructive-foreground shadow-md z-10 animate-pulse flex items-center gap-1">
            <ZapIcon className="h-3 w-3" />
            {flashSaleDiscount.type === "percentage" ? `${flashSaleDiscount.value}%` : `৳${flashSaleDiscount.value}`} {translations.discount}
          </span>
        )}

        {/* Discount Badge (only if no flash sale) */}
        {!showFlashBadge && (product.originalPrice || (product.discount_percentage && product.discount_percentage > 0)) && (
          <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-destructive text-destructive-foreground shadow-md z-10">
            {product.originalPrice 
              ? `${Math.round((1 - product.price / product.originalPrice) * 100)}%`
              : `${product.discount_percentage}%`
            } {translations.discount}
          </span>
        )}

        {/* In Cart Badge */}
        {inCart && (
          <div className="absolute bottom-3 right-3 bg-primary text-primary-foreground rounded-full p-2 shadow-lg z-10">
            <Check className="h-4 w-4" />
          </div>
        )}

        {/* View Details & Quick View Overlay */}
        {product.isFromDatabase && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-[5]">
            <span className="bg-white/90 text-foreground px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {translations.viewDetails}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setQuickViewOpen(true);
              }}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <Eye className="h-4 w-4" />
              {language === "bn" ? "কুইক ভিউ" : "Quick View"}
            </button>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-3 flex flex-col">
        <div className="min-h-[2.25rem] sm:min-h-[3rem] md:min-h-[3.5rem]">
          {product.isFromDatabase ? (
            <Link to={`/product/${product.id}`}>
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-foreground line-clamp-1 sm:line-clamp-2 leading-snug min-h-[1.25rem] sm:min-h-[2.75rem] md:min-h-[3rem] hover:text-primary transition-colors cursor-pointer">
                {product.name}
              </h3>
            </Link>
          ) : (
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-foreground line-clamp-1 sm:line-clamp-2 leading-snug min-h-[1.25rem] sm:min-h-[2.75rem] md:min-h-[3rem]">
              {product.name}
            </h3>
          )}
          {product.nameEn && (
            <p className="text-xs text-muted-foreground mt-0.5">{product.nameEn}</p>
          )}
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed hidden sm:block min-h-[2.5rem]">
          {product.description}
        </p>

        {/* Price */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-h-[1.75rem] sm:min-h-[2.25rem]">
          <span className="text-base sm:text-xl md:text-2xl font-bold text-primary">{formatPrice(displayPrice)}</span>
          {(flashPrice || product.originalPrice) && (
            <span className="text-xs sm:text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice || product.price)}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {product.isFromDatabase && (
            <>
              {inCart ? (
                <div className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1 flex-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 sm:h-7 sm:w-7"
                    onClick={() => updateQuantity(String(product.id), quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="font-bold text-sm flex-1 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 sm:h-7 sm:w-7"
                    onClick={() => updateQuantity(String(product.id), quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button3D 
                  variant="primary" 
                  size="sm" 
                  className="flex-1 gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{translations.addToCart}</span>
                </Button3D>
              )}

              <Button3D 
                variant="success"
                size="sm" 
                className="flex-1 gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5"
                onClick={handleOrderNow}
              >
                <Package className="h-3.5 w-3.5" />
                {translations.orderNow}
              </Button3D>
            </>
          )}

          {externalLink && (
            <Button3D 
              variant="warning"
              size="sm" 
              className="flex-1 gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5"
              onClick={handleOrderClick}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{language === "bn" ? "বাহ্যিক লিংক" : "External Link"}</span>
            </Button3D>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal product={product} open={quickViewOpen} onOpenChange={setQuickViewOpen} />
    </div>
  );
};
