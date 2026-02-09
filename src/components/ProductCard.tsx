import { ExternalLink, Pill, Utensils, Wrench, ShoppingCart, Plus, Minus, Check, Eye, Package } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button3D } from "@/components/ui/button-3d";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Product } from "@/contexts/ProductsContext";

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

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart, isInCart, getItemQuantity, updateQuantity, removeFromCart } = useCart();
  const { formatPrice } = useCurrency();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const imageUrl = product.image_url || product.image;
  const hasValidImage = isValidImage(imageUrl);
  const config = categoryConfig[product.category] || categoryConfig.medicine;
  const inCart = product.isFromDatabase && isInCart(String(product.id));
  const quantity = product.isFromDatabase ? getItemQuantity(String(product.id)) : 0;
  const externalLink = product.external_link || product.externalLink;

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
      {/* Product Image or Category Icon */}
      <Link 
        to={product.isFromDatabase ? `/product/${product.id}` : "#"} 
        className="block relative aspect-square overflow-hidden bg-muted"
        onClick={(e) => !product.isFromDatabase && e.preventDefault()}
      >
        {hasValidImage ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${config.bgClass}`}>
            <div className="text-primary/60 group-hover:scale-110 transition-transform duration-500">
              {config.icon}
            </div>
          </div>
        )}
        
        {/* Category Badge */}
        <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-md">
          {product.categoryLabel}
        </span>

        {/* Discount Badge */}
        {(product.originalPrice || (product.discount_percentage && product.discount_percentage > 0)) && (
          <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-destructive text-destructive-foreground shadow-md">
            {product.originalPrice 
              ? `${Math.round((1 - product.price / product.originalPrice) * 100)}%`
              : `${product.discount_percentage}%`
            } {translations.discount}
          </span>
        )}

        {/* In Cart Badge */}
        {inCart && (
          <div className="absolute bottom-3 right-3 bg-primary text-primary-foreground rounded-full p-2 shadow-lg">
            <Check className="h-4 w-4" />
          </div>
        )}

        {/* View Details Overlay */}
        {product.isFromDatabase && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="bg-white/90 text-foreground px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {translations.viewDetails}
            </span>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-5 space-y-3">
        <div>
          <h3 className="text-lg font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          {product.nameEn && (
            <p className="text-xs text-muted-foreground mt-0.5">{product.nameEn}</p>
          )}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Add to Cart / Quantity Controls (for database products) */}
          {product.isFromDatabase && (
            <>
              {inCart ? (
                <div className="flex items-center justify-between bg-muted rounded-lg p-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(String(product.id), quantity - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-bold text-lg">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(String(product.id), quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button3D 
                  variant="primary" 
                  size="sm" 
                  className="w-full gap-2"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {translations.addToCart}
                </Button3D>
              )}

              {/* Order Now Button */}
              <Button3D 
                variant="success"
                size="sm" 
                className="w-full gap-2"
                onClick={handleOrderNow}
              >
                <Package className="h-4 w-4" />
                {translations.orderNow}
              </Button3D>
            </>
          )}

          {/* External Order Button */}
          {externalLink && (
            <Button3D 
              variant="warning"
              size="sm" 
              className="w-full gap-2"
              onClick={handleOrderClick}
            >
              <ExternalLink className="h-4 w-4" />
              {language === "bn" ? "বাহ্যিক লিংক" : "External Link"}
            </Button3D>
          )}
        </div>
      </div>
    </div>
  );
};
