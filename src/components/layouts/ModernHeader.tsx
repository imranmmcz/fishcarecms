import { useState, useEffect } from "react";
import { Menu, LogIn, LogOut, User, Heart, Search, X, ShoppingCart, Globe, Shield, LayoutDashboard, Settings } from "lucide-react";
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

export const ModernHeader = () => {
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { wishlistCount } = useWishlist();
  const { getSectionContent } = usePageContent();
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const headerData = getSectionContent<Record<string, any>>("header");
  const companyName = headerData?.companyName || t.appTitle;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        { path: "/modules", label: t.allModules },
      ];

  const userName = (user as any)?.full_name || user?.email?.split("@")[0] || "User";
  const userInitials = userName.slice(0, 2).toUpperCase();

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? "shadow-lg" : ""}`}
      style={{ backgroundColor: 'hsl(var(--header-bg, var(--background)))' }}>
      <div className="container flex h-16 items-center justify-between gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          {headerData?.logoUrl ? (
            <img src={headerData.logoUrl} alt={companyName} className="h-9 w-9 rounded-lg object-contain" />
          ) : (
            <div className="rounded-lg bg-primary p-2">
              <span className="text-sm font-bold text-primary-foreground">FC</span>
            </div>
          )}
          <span className="text-lg font-bold text-foreground hidden sm:inline">{companyName}</span>
        </Link>

        {/* Center Nav - Desktop */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 text-sm font-medium rounded-full transition-all ${
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:text-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          {/* Search Toggle */}
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(!searchOpen)} className="rounded-full">
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>

          {/* Language */}
          <Button variant="ghost" size="icon" onClick={() => setLanguage(language === "bn" ? "en" : "bn")} className="rounded-full text-xs font-bold">
            {language === "bn" ? "EN" : "বাং"}
          </Button>

          {/* Wishlist */}
          {user && (
            <Link to="/wishlist">
              <Button variant="ghost" size="icon" className="rounded-full relative">
                <Heart className={`h-5 w-5 ${wishlistCount > 0 ? "text-destructive fill-destructive" : ""}`} />
                {wishlistCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">{wishlistCount}</Badge>
                )}
              </Button>
            </Link>
          )}

          {user && <NotificationBell />}

          <CartSheet />

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2"><Shield className="h-4 w-4" />{t.adminPanel}</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4" />{t.dashboard}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/profile" className="flex items-center gap-2"><User className="h-4 w-4" />{t.profile}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />{t.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="rounded-full gap-1.5">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">{t.loginSignup}</span>
              </Button>
            </Link>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-2 mt-8">
                <SearchSuggestions placeholder={language === "bn" ? "খুঁজুন..." : "Search..."} />
                <div className="mt-4 space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === item.path ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {searchOpen && (
        <div className="border-t border-border animate-fade-in" style={{ backgroundColor: 'hsl(var(--header-bg, var(--background)))' }}>
          <div className="container py-3">
            <SearchSuggestions
              placeholder={language === "bn" ? "পণ্য, ঔষধ, সরঞ্জাম খুঁজুন..." : "Search products, medicines, accessories..."}
              className="max-w-2xl mx-auto"
            />
          </div>
        </div>
      )}
    </header>
  );
};
