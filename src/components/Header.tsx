import { useState, useEffect } from "react";
import { Menu, LogIn, Shield, LogOut, User, LayoutDashboard, Settings, Heart, ShoppingCart, Search, X, Phone, Mail, Bell } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
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
const TopBar = ({ headerData }: { headerData: Record<string, any> | null }) => {
  const { user, isAdmin, signOut } = useAuth();
  const { t, language } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);

  const email = headerData?.topBarEmail || "info@fishcare.com.bd";

  return (
    <div className="w-full relative" style={{ backgroundColor: 'hsl(var(--header-utility-bg, var(--primary)))', color: 'hsl(var(--header-utility-text, var(--primary-foreground)))' }}>
      <div className="container flex items-center justify-between h-8 text-xs font-medium">
        {/* Left: Mail */}
        <a href={`mailto:${email}`} className="flex items-center gap-1.5 hover:underline truncate">
          <Mail className="h-3 w-3 shrink-0" />
          <span className="truncate">{email}</span>
        </a>

        {/* Right: Desktop full links, Mobile icon toggle */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="hover:underline flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {t.adminPanel}
                </Link>
              )}
              <Link to="/dashboard" className="hover:underline">{t.dashboard}</Link>
              <Link to="/dashboard/profile" className="hover:underline">{t.profile}</Link>
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

        {/* Mobile: User icon to toggle dropdown */}
        <button
          className="md:hidden flex items-center gap-1 hover:opacity-80"
          onClick={() => setShowMenu((v) => !v)}
        >
          <User className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Mobile dropdown */}
      {showMenu && (
        <div className="md:hidden absolute left-0 right-0 top-full z-50 shadow-lg animate-fade-in border-t border-white/20" style={{ backgroundColor: 'hsl(var(--header-utility-bg, var(--primary)))', color: 'hsl(var(--header-utility-text, var(--primary-foreground)))' }}>
          <div className="container py-2 flex flex-col gap-1.5 text-xs font-medium">
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="py-1.5 px-2 rounded hover:bg-primary-foreground/10 flex items-center gap-2" onClick={() => setShowMenu(false)}>
                    <Shield className="h-3 w-3" /> {t.adminPanel}
                  </Link>
                )}
                <Link to="/dashboard" className="py-1.5 px-2 rounded hover:bg-primary-foreground/10 flex items-center gap-2" onClick={() => setShowMenu(false)}>
                  <LayoutDashboard className="h-3 w-3" /> {t.dashboard}
                </Link>
                <Link to="/dashboard/profile" className="py-1.5 px-2 rounded hover:bg-primary-foreground/10 flex items-center gap-2" onClick={() => setShowMenu(false)}>
                  <User className="h-3 w-3" /> {t.profile}
                </Link>
                <button onClick={() => { signOut(); setShowMenu(false); }} className="py-1.5 px-2 rounded hover:bg-primary-foreground/10 flex items-center gap-2 text-left">
                  <LogOut className="h-3 w-3" /> {t.logout}
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" className="py-1.5 px-2 rounded hover:bg-primary-foreground/10 flex items-center gap-2" onClick={() => setShowMenu(false)}>
                  <LogIn className="h-3 w-3" /> {language === "bn" ? "লগইন / সাইনআপ" : "Login / Signup"}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
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
  const [hideNav, setHideNav] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastY;
        // Only toggle if scroll delta exceeds threshold to prevent jitter
        if (Math.abs(delta) > 5) {
          setHideNav(delta > 0 && currentY > 80);
          lastY = currentY;
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      <TopBar headerData={headerData} />

      {/* ─── Row 2: Logo + Search + Actions ─── */}
      <div className="border-b border-border" style={{ backgroundColor: 'hsl(var(--header-bg, var(--background)))' }}>
        <div className="container flex h-16 md:h-20 items-center justify-between gap-2 overflow-hidden">
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
          <div className="flex items-center gap-1 md:gap-4 shrink-0">
            {/* Phone - always visible */}
            <a href={`tel:${headerData?.topBarPhone || "01978865277"}`} className="flex items-center gap-1.5 shrink-0">
              <Phone className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <span className="hidden sm:inline text-xs md:text-sm font-bold text-foreground">
                {headerData?.topBarPhone || "01978865277"}
              </span>
            </a>

            {/* Mobile Search */}
            <MobileSearchToggle />

            {/* Notifications */}
            {user && <NotificationBell />}

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
      <nav className={`hidden md:block transition-all duration-300 ${hideNav ? "max-h-0 overflow-hidden opacity-0" : "max-h-20 opacity-100"}`} style={{ backgroundColor: 'hsl(var(--header-nav-bg, var(--foreground)))' }}>
        <div className="container flex items-center gap-1 h-10">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-semibold px-4 h-full flex items-center transition-colors uppercase tracking-wide ${
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-white/10"
              }`}
              style={location.pathname !== item.path ? { color: 'hsl(var(--header-nav-text, var(--background)) / 0.85)' } : undefined}
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
