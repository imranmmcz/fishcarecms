import { DisplayProduct } from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Product } from "@/contexts/ProductsContext";
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button3D } from "@/components/ui/button-3d";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart, Plus, Minus, Package, ExternalLink, Pill, Utensils, Wrench, X, Eye,
} from "lucide-react";

const categoryConfig: Record<string, { icon: React.ReactNode; bgClass: string; label: string }> = {
  medicine: { icon: <Pill className="h-20 w-20" />, bgClass: "from-emerald-500/20 to-teal-500/20", label: "Medicine" },
  food: { icon: <Utensils className="h-20 w-20" />, bgClass: "from-orange-500/20 to-amber-500/20", label: "Food" },
  accessories: { icon: <Wrench className="h-20 w-20" />, bgClass: "from-blue-500/20 to-indigo-500/20", label: "Accessories" },
};

const isValidImage = (imageUrl: string | undefined): boolean => {
  if (!imageUrl) return false;
  if (imageUrl.includes("placeholder")) return false;
  if (imageUrl.includes("unsplash.com/photo-1544551763-46a013bb70d5")) return false;
  return true;
};

interface QuickViewModalProps {
  product: DisplayProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuickViewModal = ({ product, open, onOpenChange }: QuickViewModalProps) => {
  const { addToCart, isInCart, getItemQuantity, updateQuantity } = useCart();
  const { formatPrice } = useCurrency();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const imageUrl = product.image_url || product.image;
  const hasValidImage = isValidImage(imageUrl);
  const config = categoryConfig[product.category] || categoryConfig.medicine;
  const inCart = product.isFromDatabase && isInCart(String(product.id));
  const quantity = product.isFromDatabase ? getItemQuantity(String(product.id)) : 0;
  const externalLink = product.external_link || product.externalLink;

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
        created_at: "",
        updated_at: "",
      };
      addToCart(dbProduct, 1);
    }
  };

  const handleOrderNow = () => {
    if (product.isFromDatabase) {
      if (!inCart) handleAddToCart();
      onOpenChange(false);
      navigate("/checkout");
    }
  };

  const t = {
    orderNow: language === "bn" ? "অর্ডার করুন" : "Order Now",
    addToCart: language === "bn" ? "কার্টে যোগ করুন" : "Add to Cart",
    inCart: language === "bn" ? "কার্টে আছে" : "In Cart",
    discount: language === "bn" ? "ছাড়" : "OFF",
    viewDetails: language === "bn" ? "বিস্তারিত দেখুন" : "View Full Details",
    description: language === "bn" ? "বিবরণ" : "Description",
    category: language === "bn" ? "ক্যাটাগরি" : "Category",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl">
        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Image */}
          <div className="relative aspect-square bg-muted">
            {hasValidImage ? (
              <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${config.bgClass}`}>
                <div className="text-primary/60">{config.icon}</div>
              </div>
            )}
            {(product.originalPrice || (product.discount_percentage && product.discount_percentage > 0)) && (
              <Badge variant="destructive" className="absolute top-3 right-3 text-sm">
                {product.originalPrice
                  ? `${Math.round((1 - product.price / product.originalPrice) * 100)}%`
                  : `${product.discount_percentage}%`}{" "}
                {t.discount}
              </Badge>
            )}
          </div>

          {/* Info */}
          <div className="p-6 flex flex-col gap-4">
            <div>
              <Badge variant="secondary" className="mb-2">{product.categoryLabel}</Badge>
              <h2 className="text-xl font-bold text-foreground">{product.name}</h2>
              {product.nameEn && <p className="text-sm text-muted-foreground">{product.nameEn}</p>}
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{product.description}</p>

            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-primary">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
              )}
            </div>

            <div className="space-y-2 mt-auto">
              {product.isFromDatabase && (
                <>
                  {inCart ? (
                    <div className="flex items-center justify-between bg-muted rounded-lg p-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(String(product.id), quantity - 1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-bold text-lg">{quantity}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(String(product.id), quantity + 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button3D variant="primary" size="sm" className="w-full gap-2" onClick={handleAddToCart}>
                      <ShoppingCart className="h-4 w-4" /> {t.addToCart}
                    </Button3D>
                  )}
                  <Button3D variant="success" size="sm" className="w-full gap-2" onClick={handleOrderNow}>
                    <Package className="h-4 w-4" /> {t.orderNow}
                  </Button3D>
                </>
              )}
              {externalLink && (
                <Button3D variant="warning" size="sm" className="w-full gap-2" onClick={() => window.open(externalLink, "_blank", "noopener,noreferrer")}>
                  <ExternalLink className="h-4 w-4" /> {language === "bn" ? "বাহ্যিক লিংক" : "External Link"}
                </Button3D>
              )}
              {product.isFromDatabase && (
                <Link to={`/product/${product.id}`} onClick={() => onOpenChange(false)}>
                  <Button variant="outline" size="sm" className="w-full gap-2 mt-1">
                    <Eye className="h-4 w-4" /> {t.viewDetails}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickViewModal;
