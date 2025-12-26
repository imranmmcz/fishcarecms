import { ExternalLink } from "lucide-react";
import { Button3D } from "@/components/ui/button-3d";
import { FishProduct } from "@/data/fishProductData";

interface ProductCardProps {
  product: FishProduct;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const handleOrderClick = () => {
    window.open(product.externalLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="group relative bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-300 border border-border/50">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Category Badge */}
        <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-md">
          {product.categoryLabel}
        </span>

        {/* Discount Badge */}
        {product.originalPrice && (
          <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-destructive text-destructive-foreground shadow-md">
            {Math.round((1 - product.price / product.originalPrice) * 100)}% ছাড়
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="p-5 space-y-3">
        <div>
          <h3 className="text-lg font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{product.nameEn}</p>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary">৳{product.price}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">৳{product.originalPrice}</span>
          )}
        </div>

        {/* Order Button */}
        <Button3D 
          variant="success" 
          size="sm" 
          className="w-full gap-2"
          onClick={handleOrderClick}
        >
          <ExternalLink className="h-4 w-4" />
          এখনই অর্ডার করুন
        </Button3D>
      </div>
    </div>
  );
};
