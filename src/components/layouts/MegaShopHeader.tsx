import { useState, useEffect } from "react";
import { Menu, LogIn, LogOut, User, Heart, Search, ShoppingCart, Phone, Mail, Globe, Shield, LayoutDashboard, ChevronDown, Zap, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CartSheet } from "@/components/CartSheet";
import { useWishlist } from "@/contexts/WishlistContext";
import { usePageContent } from "@/hooks/usePageContent";
import { SearchSuggestions } from "@/components/SearchSuggestions";
import { NotificationBell } from "@/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const MegaShopHeader = () => {
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { wishlistCount } = useWishlist();
  const { getSectionContent } = usePageContent();

  const headerData = getSectionContent<Record<string, any>>("header");
  const companyName = headerData?.companyName || t.appTitle;
  const companySubtitle = headerData
    ? (language === "bn" ? headerData.companySubtitle_bn : headerData.companySubtitle_en)
    : t.appSubtitle;

  const navItems = headerData?.navItems
    ? headerData.navItems.map((item: any) => ({
        path: item.path,
        label: language === "bn" ? item.label_bn : item.label_en,
      }))
    : [
        { path: "/", label: t.home },
        { path: "/shop", label: t.shop },
        { path: "/disease-advice", label: language === "bn" ? "রোগ ও পরামর্শ" : "Disease & Advice" },
        { path: "/blog", label: language === "bn" ? "ব্লগ" : "Blog" },
        { path: "/market-price", label: t.marketPrice },
        { path: "/fish-advice", label: t.fishAdvice },
        { path: "/modules", label: t.allModules },
      ];

  const userName = (user as any)?.full_name || user?.email?.split("@")[0] || "User";
  const userInitials = userName.slice(0, 2).toUpperCase();
  const email = headerData?.topBarEmail || "info@fishcare.com.bd";
  const phone = headerData?.topBarPhone || "01978865277";

  return (
    <header className="sticky top-0 z-50 w-full shadow-sm">
      {/* Top Utility Bar - Slim */}
      <div className="h-8 text-xs" style={{ backgroundColor: 'hsl(var(--header-utility-bg, var(--primary)))', color: 'hsl(var(--header-utility-text, var(--primary-foreground)))' }}>
        <div className="container flex items-center justify-between h-full">
          <div className="flex items-center gap-4">
            <a href={`tel:${phone}`} className="flex items-center gap-1 hover:opacity-80">
              <Phone className="h-3 w-3" />{phone}
            </a>
            <a href={`mailto:${email}`} className="hidden sm:flex items-center gap-1 hover:opacity-80">
              <Mail className="h-3 w-3" />{email}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setLanguage(language === "bn" ? "en" : "bn")} className="flex items-center gap-1 hover:opacity-80 font-semibold">
              <Globe className="h-3 w-3" />{language === "bn" ? "EN" : "বাংলা"}
            </button>
            {user ? (
              <button onClick={signOut} className="flex items-center gap-1 hover:opacity-80">
                <LogOut className="h-3 w-3" />{language === "bn" ? "লগআউট" : "Logout"}
              </button>
            ) : (
              <Link to="/auth" className="hover:opacity-80">{language === "bn" ? "লগইন / রেজিস্ট্রেশন" : "Login / Register"}</Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Header - Logo + Mega Search */}
      <div className="border-b border-border py-3" style={{ backgroundColor: 'hsl(var(--header-bg, var(--background)))' }}>
        <div className="container flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            {headerData?.logoUrl ? (
              <img src={headerData.logoUrl} alt={companyName} className="h-10 w-10 md:h-12 md:w-12 rounded-lg object-contain" />
            ) : (
              <div className="rounded-lg bg-primary p-2 md:p-2.5">
                <span className="text-sm md:text-base font-bold text-primary-foreground">FC</span>
              </div>
            )}
            <div className="hidden sm:flex flex-col">
              <span className="text-base md:text-xl font-bold text-foreground leading-tight">{companyName}</span>
              <span className="text-[10px] md:text-xs text-muted-foreground">{companySubtitle}</span>
            </div>
          </Link>

          {/* Mega Search Bar */}
          <div className="flex-1 max-w-2xl">
            <SearchSuggestions
              placeholder={language === "bn" ? "পণ্য খুঁজুন — ঔষধ, খাদ্য, সরঞ্জাম..." : "Search products — medicines, food, accessories..."}
              className="w-full"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            {user && (
              <Link to="/wishlist">
                <Button variant="ghost" size="icon" className="relative">
                  <Heart className={`h-5 w-5 ${wishlistCount > 0 ? "text-destructive fill-destructive" : ""}`} />
                  {wishlistCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">{wishlistCount}</Badge>
                  )}
                </Button>
              </Link>
            )}
            {user && <NotificationBell />}
            <CartSheet />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{userName}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {isAdmin && <DropdownMenuItem asChild><Link to="/admin"><Shield className="h-4 w-4 mr-2" />{t.adminPanel}</Link></DropdownMenuItem>}
                  <DropdownMenuItem asChild><Link to="/dashboard"><LayoutDashboard className="h-4 w-4 mr-2" />{t.dashboard}</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/dashboard/profile"><User className="h-4 w-4 mr-2" />{t.profile}</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive"><LogOut className="h-4 w-4 mr-2" />{t.logout}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth" className="hidden md:block">
                <Button size="sm" className="gap-1.5"><LogIn className="h-4 w-4" />{t.loginSignup}</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Bar with Categories + Deals */}
      <div className="hidden md:block" style={{ backgroundColor: 'hsl(var(--header-nav-bg, var(--foreground)))' }}>
        <div className="container flex items-center h-10 gap-1">
          {/* Category Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-4 h-full text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                <Menu className="h-4 w-4" />
                {language === "bn" ? "সকল ক্যাটাগরি" : "All Categories"}
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem asChild><Link to="/shop?category=medicine">{language === "bn" ? "ঔষধ" : "Medicine"}</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/shop?category=food">{language === "bn" ? "মাছের খাদ্য" : "Fish Food"}</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/shop?category=accessories">{language === "bn" ? "সরঞ্জাম" : "Accessories"}</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Nav Links */}
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium px-3 h-full flex items-center transition-colors ${
                location.pathname === item.path
                  ? "bg-white/20"
                  : "hover:bg-white/10"
              }`}
              style={{ color: 'hsl(var(--header-nav-text, var(--background)) / 0.9)' }}
            >
              {item.label}
            </Link>
          ))}

          {/* Deals Badge */}
          <div className="ml-auto flex items-center gap-1.5 px-3 h-full">
            <Zap className="h-3.5 w-3.5 text-yellow-400" />
            <span className="text-xs font-bold text-yellow-400 animate-pulse">
              {language === "bn" ? "🔥 হট ডিল" : "🔥 HOT DEALS"}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Nav Button */}
      <div className="md:hidden border-b border-border" style={{ backgroundColor: 'hsl(var(--header-nav-bg, var(--foreground)))' }}>
        <div className="container flex items-center h-10">
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex items-center gap-2 text-sm font-semibold px-3 h-full"
                style={{ color: 'hsl(var(--header-nav-text, var(--background)))' }}>
                <Menu className="h-4 w-4" />
                {language === "bn" ? "মেনু" : "Menu"}
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <nav className="flex flex-col gap-1 mt-8">
                {navItems.map((item) => (
                  <Link key={item.path} to={item.path}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.path ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="ml-auto flex items-center gap-1.5 px-3">
            <Zap className="h-3.5 w-3.5 text-yellow-400" />
            <span className="text-xs font-bold text-yellow-400">
              {language === "bn" ? "🔥 ডিল" : "🔥 DEALS"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
