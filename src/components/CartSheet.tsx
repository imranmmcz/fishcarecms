/**
 * Cart Sheet Component - Slide-out Shopping Cart
 */

import { ShoppingCart, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Link } from "react-router-dom";
import { useState } from "react";

export function CartSheet() {
  const { items, itemCount, subtotal, updateQuantity, removeFromCart } = useCart();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [open, setOpen] = useState(false);

  const getDiscountedPrice = (price: number, discountPercentage: number) => {
    return price * (1 - discountPercentage / 100);
  };

  const translations = {
    cart: language === "bn" ? "কার্ট" : "Cart",
    yourCart: language === "bn" ? "আপনার কার্ট" : "Your Cart",
    emptyCart: language === "bn" ? "আপনার কার্ট খালি" : "Your cart is empty",
    addProducts: language === "bn" ? "পণ্য যোগ করুন" : "Add products to continue",
    continueShopping: language === "bn" ? "শপিং চালিয়ে যান" : "Continue Shopping",
    subtotal: language === "bn" ? "সাবটোটাল" : "Subtotal",
    checkout: language === "bn" ? "চেকআউট করুন" : "Proceed to Checkout",
    remove: language === "bn" ? "সরান" : "Remove",
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            {translations.yourCart}
            {itemCount > 0 && (
              <Badge variant="secondary">{itemCount}</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <ShoppingCart className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">{translations.emptyCart}</h3>
            <p className="text-muted-foreground text-sm mb-6">{translations.addProducts}</p>
            <Button variant="outline" onClick={() => setOpen(false)} asChild>
              <Link to="/shop">{translations.continueShopping}</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                {items.map((item) => {
                  const discountedPrice = getDiscountedPrice(
                    item.product.price,
                    item.product.discount_percentage || 0
                  );
                  const itemTotal = discountedPrice * item.quantity;

                  return (
                    <div key={item.product.id} className="flex gap-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ShoppingBag className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2 mb-1">
                          {item.product.name}
                        </h4>
                        <div className="flex items-center gap-2 text-sm mb-2">
                          <span className="font-semibold text-primary">
                            {formatPrice(discountedPrice)}
                          </span>
                          {item.product.discount_percentage > 0 && (
                            <span className="text-muted-foreground line-through text-xs">
                              {formatPrice(item.product.price)}
                            </span>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-medium text-sm">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              {formatPrice(itemTotal)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => removeFromCart(item.product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>{translations.subtotal}</span>
                <span className="text-primary">{formatPrice(subtotal)}</span>
              </div>
              <Button className="w-full" size="lg" onClick={() => setOpen(false)} asChild>
                <Link to="/checkout">{translations.checkout}</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default CartSheet;
