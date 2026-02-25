import { useState, useEffect } from "react";
import { Menu, LogIn, Shield, LogOut, User, LayoutDashboard, Settings, Heart, ShoppingCart, Search, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CartSheet } from "@/components/CartSheet";
import { useWishlist } from "@/contexts/WishlistContext";
import { usePageContent } from "@/hooks/usePageContent";
import { SearchSuggestions } from "@/components/SearchSuggestions";

/* ── Mobile search toggle ── */
const MobileSearchToggle = () => {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)}>
        {open ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
      </Button>
      {open && (
        <div className="absolute left-0 right-0 top-full bg-background border-b border-border p-2 z-50">
          <SearchSuggestions
            placeholder={language === "bn" ? "পণ্য খুঁজুন..." : "Search products..."}
          />
        </div>
      )}
    </div>
  );
};

/* ── Top utility bar ── */
const TopBar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { t, language } = useLanguage();

  return (
    <div className="w-full bg-primary text-primary-foreground">
      <div className="container flex items-center justify-end gap-4 h-8 text-xs font-medium">
        {user ? (
          <>
            {isAdmin && (
              <Link to="/admin" className="hover:underline flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {t.adminPanel}
              </Link>
            )}
            <Link to="/dashboard" className="hover:underline">
              {t.dashboard}
            </Link>
            <Link to="/dashboard/profile" className="hover:underline">
              {t.profile}
            </Link>
            <button onClick={signOut} className="hover:underline flex items-center gap-1">
              <LogOut className="h-3 w-3" />
              {t.logout}
            </button>
          </>
        ) : (
          <>
            <Link to="/auth" className="hover:underline">
              {language === "bn" ? "আমার অ্যাকাউন্ট" : "MY ACCOUNT"}
            </Link>
            <Link to="/auth" className="hover:underline">
              {language === "bn" ? "অ্যাকাউন্ট তৈরি করুন" : "CREATE AN ACCOUNT"}
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

/* ── Main header ── */
export const Header = () => {
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const { t, language } = useLanguage();
  const { wishlistCount } = useWishlist();
  const { getSectionContent } = usePageContent();

  const headerData = getSectionContent<Record<string, any>>("header");

  const companyName = headerData?.companyName || t.appTitle;
  const companySubtitle = headerData
    ? (language === "bn" ? headerData.companySubtitle_bn : headerData.companySubtitle_en)
    : t.appSubtitle;

  useEffect(() => {
    if (headerData?.faviconUrl) {
      const link = document.querySelector<HTMLLinkElement>("link[rel='shortcut icon']")
        || document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (link) link.href = headerData.faviconUrl;
    }
  }, [headerData?.faviconUrl]);

  const navItems = headerData?.navItems
    ? headerData.navItems.map((item: any) => ({
        path: item.path,
        label: language === "bn" ? item.label_bn : item.label_en,
      }))
    : [
        { path: "/", label: t.home },
        { path: "/shop", label: t.shop },
        { path: "/market-price", label: t.marketPrice },
        { path: "/pond-calculator", label: t.pondMeasurement },
        { path: "/fish-advice", label: t.fishAdvice },
        { path: "/modules", label: t.allModules },
      ];

  const defaultUserName = language === "bn" ? "ব্যবহারকারী" : "User";
  const userName = (user as any)?.full_name || user?.email?.split("@")[0] || defaultUserName;
  const userRole = isAdmin ? (language === "bn" ? "অ্যাডমিন" : "Admin") : (language === "bn" ? "ব্যবহারকারী" : "User");
  const userInitials = userName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* ─── Row 1: Utility bar ─── */}
      <TopBar />

      {/* ─── Row 2: Logo + Search + Actions ─── */}
      <div className="bg-background border-b border-border">
        <div className="container flex h-16 md:h-20 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 transition-transform hover:scale-[1.02]">
            {headerData?.logoUrl ? (
              <img src={headerData.logoUrl} alt={companyName} className="h-10 w-10 md:h-12 md:w-12 rounded-lg object-contain" />
            ) : (
              <div className="rounded-lg bg-foreground p-2 md:p-2.5">
                <span className="text-sm md:text-base font-bold text-background">FC</span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-base md:text-lg font-bold text-foreground leading-tight">{companyName}</span>
              <span className="text-[10px] md:text-xs text-muted-foreground leading-tight">{companySubtitle}</span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <SearchSuggestions
            className="hidden md:block flex-1 max-w-xl mx-6"
            placeholder={language === "bn" ? "মাছের ওষুধ, চিকিৎসা খুঁজুন..." : "Search for fish medicines, treatments..."}
          />

          {/* Right side: phone + actions */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {/* Phone - desktop only */}
            <div className="hidden lg:flex items-center gap-2 text-right mr-2">
              <Phone className="h-5 w-5 text-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground leading-tight uppercase tracking-wide">
                  {language === "bn" ? "কল করুন" : "CALL US NOW"}
                </span>
                <span className="text-sm font-bold text-foreground leading-tight">
                  {headerData?.phone || "01XXX-XXXXXX"}
                </span>
              </div>
            </div>

            {/* Mobile Search */}
            <MobileSearchToggle />

            {/* Wishlist */}
            {user && (
              <Link to="/wishlist">
                <Button variant="ghost" size="icon" className="relative">
                  <Heart className={`h-5 w-5 ${wishlistCount > 0 ? "text-destructive fill-destructive" : ""}`} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            {/* Cart */}
            <CartSheet />

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <MobileNav
                  navItems={navItems}
                  location={location}
                  user={user}
                  isAdmin={isAdmin}
                  userName={userName}
                  userInitials={userInitials}
                  userRole={userRole}
                  wishlistCount={wishlistCount}
                  signOut={signOut}
                  t={t}
                  language={language}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* ─── Row 3: Navigation - Desktop ─── */}
      <nav className="hidden md:block bg-foreground">
        <div className="container flex items-center gap-1 h-10">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-semibold px-4 h-full flex items-center transition-colors uppercase tracking-wide ${
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-background/80 hover:text-background hover:bg-background/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
};

/* ── Mobile navigation (Sheet content) ── */
interface MobileNavProps {
  navItems: { path: string; label: string }[];
  location: ReturnType<typeof useLocation>;
  user: any;
  isAdmin: boolean;
  userName: string;
  userInitials: string;
  userRole: string;
  wishlistCount: number;
  signOut: () => void;
  t: Record<string, any>;
  language: string;
}

const MobileNav = ({ navItems, location, user, isAdmin, userName, userInitials, userRole, wishlistCount, signOut, t, language }: MobileNavProps) => (
  <nav className="flex flex-col gap-4 mt-8">
    <SearchSuggestions placeholder={language === "bn" ? "খুঁজুন..." : "Search..."} />

    {navItems.map((item) => (
      <Link
        key={item.path}
        to={item.path}
        className={`text-base font-medium transition-colors hover:text-primary px-2 py-1 rounded-md ${
          location.pathname === item.path ? "text-primary bg-primary/10" : "text-foreground"
        }`}
      >
        {item.label}
      </Link>
    ))}

    <div className="border-t border-border pt-4 mt-4 space-y-2">
      {user && (
        <Link to="/wishlist" className="block">
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Heart className={`h-4 w-4 ${wishlistCount > 0 ? "text-destructive fill-destructive" : ""}`} />
            {language === "bn" ? "উইশলিস্ট" : "Wishlist"}
            {wishlistCount > 0 && (
              <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0">{wishlistCount}</Badge>
            )}
          </Button>
        </Link>
      )}

      {user ? (
        <>
          <div className="flex items-center gap-3 px-2 py-3 bg-muted rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{userName}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
              <Badge variant={isAdmin ? "default" : "secondary"} className="text-xs w-fit mt-1">{userRole}</Badge>
            </div>
          </div>
          <Link to="/dashboard" className="block">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <LayoutDashboard className="h-4 w-4" /> {t.dashboard}
            </Button>
          </Link>
          <Link to="/dashboard/profile" className="block">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <User className="h-4 w-4" /> {t.profile}
            </Button>
          </Link>
          <Link to="/dashboard/settings" className="block">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Settings className="h-4 w-4" /> {t.settings}
            </Button>
          </Link>
          {isAdmin && (
            <Link to="/admin" className="block">
              <Button variant="ghost" className="w-full justify-start gap-2 text-primary">
                <Shield className="h-4 w-4" /> {t.adminPanel}
              </Button>
            </Link>
          )}
          <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive" onClick={signOut}>
            <LogOut className="h-4 w-4" /> {t.logout}
          </Button>
        </>
      ) : (
        <Link to="/auth">
          <Button variant="default" size="sm" className="w-full gap-2">
            <LogIn className="h-4 w-4" /> {t.loginSignup}
          </Button>
        </Link>
      )}
    </div>
  </nav>
);
