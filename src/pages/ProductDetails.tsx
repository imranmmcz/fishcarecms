import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import SeoHead from "@/components/SeoHead";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  Heart,
  ZoomIn,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import ShareButtons from "@/components/ShareButtons";

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
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0, pxX: 0, pxY: 0 });
  const [isLensActive, setIsLensActive] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [galleryImages, setGalleryImages] = useState<{ id: string; image_url: string; is_primary: boolean; alt_text: string | null }[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Reset lens when image changes
  useEffect(() => {
    setIsLensActive(false);
    setNaturalSize(null);
  }, [selectedImageIndex]);

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

        // Fetch gallery images
        const { data: images } = await supabase
          .from("product_images")
          .select("id, image_url, is_primary, alt_text")
          .eq("product_id", id)
          .order("display_order", { ascending: true });

        if (images && images.length > 0) {
          setGalleryImages(images);
          const primaryIdx = images.findIndex(img => img.is_primary);
          setSelectedImageIndex(primaryIdx >= 0 ? primaryIdx : 0);
        } else if (data?.image_url) {
          // Fallback: use main product image
          setGalleryImages([{ id: 'main', image_url: data.image_url, is_primary: true, alt_text: data.name }]);
          setSelectedImageIndex(0);
        } else {
          setGalleryImages([]);
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
      cost_price: 0,
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

  const handleOrderNow = () => {
    if (!product) return;
    if (!inCart) {
      addToCart({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        cost_price: 0,
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
    }
    navigate("/checkout");
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

  const currentImage = galleryImages[selectedImageIndex]?.image_url || product.image_url;
  const hasValidImage = currentImage && !currentImage.includes("placeholder");

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title={(product as any).meta_title || product.name}
        description={(product as any).meta_description || product.description || undefined}
        image={product.image_url || undefined}
        url={`/product/${(product as any).seo_url || product.id}`}
        type="product"
        keywords={(product as any).focus_keyword || undefined}
        imageAlt={(product as any).image_alt_text || product.name}
      />
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
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Product Image with Zoom & Gallery */}
          <div className="relative lg:sticky lg:top-24 space-y-3">
            {/* Main Image */}
            <div 
              ref={imageContainerRef}
              className="aspect-square rounded-3xl overflow-hidden bg-muted cursor-zoom-in group relative"
              onClick={() => hasValidImage && setIsZoomOpen(true)}
              onMouseMove={(e) => {
                if (!imageContainerRef.current || !hasValidImage || !naturalSize) return;
                const rect = imageContainerRef.current.getBoundingClientRect();
                const cursorX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                const cursorY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
                const xPct = (cursorX / rect.width) * 100;
                const yPct = (cursorY / rect.height) * 100;
                setZoomPosition({ x: xPct, y: yPct, pxX: cursorX, pxY: cursorY });
                setIsLensActive(true);
              }}
              onMouseLeave={() => setIsLensActive(false)}
            >
              {hasValidImage ? (
                <>
                  <img
                    src={currentImage!}
                    alt={galleryImages[selectedImageIndex]?.alt_text || product.name}
                    className="w-full h-full object-cover transition-transform duration-300"
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
                    }}
                  />
                  {/* Hover lens effect */}
                  {isLensActive && naturalSize && imageContainerRef.current && (() => {
                    const LENS = 192;
                    const ZOOM = 2.5;
                    const cW = imageContainerRef.current!.offsetWidth;
                    const cH = imageContainerRef.current!.offsetHeight;
                    // object-cover geometry
                    const scale = Math.max(cW / naturalSize.w, cH / naturalSize.h);
                    const renderW = naturalSize.w * scale;
                    const renderH = naturalSize.h * scale;
                    const offsetX = (cW - renderW) / 2;
                    const offsetY = (cH - renderH) / 2;
                    // cursor → image-space coords
                    const imgX = Math.max(0, Math.min(zoomPosition.pxX - offsetX, renderW));
                    const imgY = Math.max(0, Math.min(zoomPosition.pxY - offsetY, renderH));
                    // zoom image dimensions & position
                    const zoomW = renderW * ZOOM;
                    const zoomH = renderH * ZOOM;
                    let left = LENS / 2 - imgX * ZOOM;
                    let top = LENS / 2 - imgY * ZOOM;
                    left = Math.max(LENS - zoomW, Math.min(0, left));
                    top = Math.max(LENS - zoomH, Math.min(0, top));
                    return (
                      <div 
                        className="absolute border-2 border-white/80 rounded-full pointer-events-none shadow-lg overflow-hidden z-50"
                        style={{
                          width: LENS,
                          height: LENS,
                          left: `${zoomPosition.x}%`,
                          top: `${zoomPosition.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <img
                          src={currentImage!}
                          alt=""
                          className="absolute"
                          style={{
                            width: `${zoomW}px`,
                            height: `${zoomH}px`,
                            left: `${left}px`,
                            top: `${top}px`,
                            maxWidth: 'none',
                          }}
                        />
                      </div>
                    );
                  })()}
                  {/* Zoom hint */}
                  <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="h-3.5 w-3.5" />
                    {language === "bn" ? "জুম করুন" : "Click to zoom"}
                  </div>
                  {/* Gallery nav arrows on main image */}
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/90"
                        onClick={(e) => { e.stopPropagation(); setSelectedImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length); }}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/90"
                        onClick={(e) => { e.stopPropagation(); setSelectedImageIndex((prev) => (prev + 1) % galleryImages.length); }}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      {/* Image counter */}
                      <div className="absolute bottom-4 right-4 bg-background/70 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium">
                        {selectedImageIndex + 1} / {galleryImages.length}
                      </div>
                    </>
                  )}
                </>
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

            {/* Thumbnail Gallery */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {galleryImages.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      idx === selectedImageIndex 
                        ? "border-primary ring-2 ring-primary/30 scale-105" 
                        : "border-border/50 hover:border-primary/50 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt={img.alt_text || `${product.name} - ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Fullscreen Zoom Dialog */}
            <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
              <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none overflow-hidden">
                <div className="relative w-full h-[90vh] flex items-center justify-center">
                  <img
                    src={currentImage!}
                    alt={product.name}
                    className="max-w-none w-[150%] h-auto object-contain select-none"
                    draggable={false}
                  />
                  {/* Fullscreen gallery nav */}
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/40 transition-colors"
                        onClick={() => setSelectedImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)}
                      >
                        <ChevronLeft className="h-6 w-6 text-white" />
                      </button>
                      <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/40 transition-colors"
                        onClick={() => setSelectedImageIndex((prev) => (prev + 1) % galleryImages.length)}
                      >
                        <ChevronRight className="h-6 w-6 text-white" />
                      </button>
                    </>
                  )}
                  {/* Fullscreen thumbnails */}
                  {galleryImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
                      {galleryImages.map((img, idx) => (
                        <button
                          key={img.id}
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                            idx === selectedImageIndex ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"
                          }`}
                        >
                          <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category Badge */}
            <Badge className={`${config.color} gap-2`}>
              {config.icon}
              {config.label[language]}
            </Badge>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{product.name}</h1>

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
            <div className="flex items-baseline gap-2 sm:gap-4 flex-wrap">
              <span className="text-3xl sm:text-4xl font-bold text-primary">
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
              
              <Button3D 
                variant="success"
                size="lg" 
                className="flex-1 gap-2"
                onClick={handleOrderNow}
              >
                <Package className="h-5 w-5" />
                {translations.orderNow}
              </Button3D>

              {product.external_link && (
                <Button3D 
                  variant="warning"
                  size="lg" 
                  className="flex-1 gap-2"
                  onClick={handleExternalOrder}
                >
                  <ExternalLink className="h-5 w-5" />
                  {language === "bn" ? "বাহ্যিক লিংক" : "External Link"}
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{translations.relatedProducts}</h2>
              <Link to="/shop" className="text-sm text-primary hover:underline flex items-center gap-1">
                {language === "bn" ? "সব দেখুন" : "View All"}
                <ArrowLeft className="h-3 w-3 rotate-180" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {relatedProducts.map((p) => {
                const pDiscounted = getDiscountedPrice(p.price, p.discount_percentage);
                const pInCart = isInCart(p.id);
                return (
                  <div 
                    key={p.id} 
                    className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-300 border border-border/50 flex flex-col"
                  >
                    <Link to={`/product/${p.id}`} className="relative">
                      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${
                            p.category === "medicine" ? "from-emerald-500/10 to-teal-500/10" :
                            p.category === "food" ? "from-orange-500/10 to-amber-500/10" :
                            "from-blue-500/10 to-indigo-500/10"
                          }`}>
                            <Package className="h-12 w-12 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      {/* Discount Badge */}
                      {p.discount_percentage && p.discount_percentage > 0 && (
                        <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs">
                          -{p.discount_percentage}%
                        </Badge>
                      )}
                      {/* Stock Badge */}
                      {p.stock_quantity <= 0 && (
                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                          <Badge variant="destructive" className="text-sm">
                            {language === "bn" ? "স্টক শেষ" : "Out of Stock"}
                          </Badge>
                        </div>
                      )}
                    </Link>
                    
                    <div className="p-4 flex flex-col flex-1">
                      {/* Category */}
                      <span className="text-xs text-muted-foreground mb-1">
                        {categoryConfig[p.category]?.label[language] || p.category}
                      </span>
                      
                      <Link to={`/product/${p.id}`}>
                        <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors text-sm leading-snug">
                          {p.name}
                        </h3>
                      </Link>
                      
                      {/* Price */}
                      <div className="mt-auto pt-3 flex items-baseline gap-2">
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(pDiscounted)}
                        </span>
                        {p.discount_percentage && p.discount_percentage > 0 && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatPrice(p.price)}
                          </span>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="mt-3 flex gap-2">
                        {pInCart ? (
                          <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs" asChild>
                            <Link to="/shop">
                              <Check className="h-3 w-3 text-primary" />
                              {language === "bn" ? "কার্টে আছে" : "In Cart"}
                            </Link>
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 gap-1 text-xs"
                            disabled={p.stock_quantity <= 0}
                            onClick={() => addToCart({
                              ...p,
                              reorder_level: p.reorder_level ?? null,
                              company_id: p.company_id ?? null,
                              brand_id: p.brand_id ?? null,
                            }, 1)}
                          >
                            <ShoppingCart className="h-3 w-3" />
                            {language === "bn" ? "কার্ট" : "Cart"}
                          </Button>
                        )}
                        <Button3D
                          variant="success"
                          size="sm"
                          className="flex-1 gap-1 text-xs"
                          onClick={() => {
                            if (!pInCart) {
                              addToCart({
                                ...p,
                                reorder_level: p.reorder_level ?? null,
                                company_id: p.company_id ?? null,
                                brand_id: p.brand_id ?? null,
                              }, 1);
                            }
                            navigate("/checkout");
                          }}
                        >
                          <Package className="h-3 w-3" />
                          {language === "bn" ? "অর্ডার" : "Order"}
                        </Button3D>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Ad */}
        <div className="mt-8">
          <AdUnit position="footer" />
        </div>
      </div>
      <Footer />
      <ShareButtons
        title={product.name}
        description={product.description || undefined}
        image={product.image_url || undefined}
        url={`/product/${(product as any).seo_url || product.id}`}
      />
    </div>
  );
};

export default ProductDetails;
