import { useState, useEffect } from "react";
import { Fish, Menu, LogIn, Shield, LogOut, User, LayoutDashboard, Settings, ChevronDown, Heart, ShoppingCart, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CartSheet } from "@/components/CartSheet";
import { useWishlist } from "@/contexts/WishlistContext";
import { usePageContent } from "@/hooks/usePageContent";
import { SearchSuggestions } from "@/components/SearchSuggestions";

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
      if (link) {
        link.href = headerData.faviconUrl;
      }
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
  const userName = (user as any)?.full_name || user?.email?.split('@')[0] || defaultUserName;
  const userRole = isAdmin ? (language === "bn" ? "অ্যাডমিন" : "Admin") : (language === "bn" ? "ব্যবহারকারী" : "User");
  const userInitials = userName.slice(0, 2).toUpperCase();


  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
      {/* Top Row: Logo + Search + Actions */}
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 transition-transform hover:scale-[1.02]">
          {headerData?.logoUrl ? (
            <img src={headerData.logoUrl} alt={companyName} className="h-10 w-10 rounded-lg object-contain" />
          ) : (
            <div className="rounded-lg bg-foreground p-2">
              <span className="text-sm font-bold text-background">FC</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-base font-bold text-foreground leading-tight">{companyName}</span>
            <span className="text-xs text-muted-foreground leading-tight">{companySubtitle}</span>
          </div>
        </Link>

        {/* Search Bar - Desktop */}
        <SearchSuggestions
          className="hidden md:block flex-1 max-w-lg mx-4"
          placeholder={language === "bn" ? "মাছের ওষুধ, চিকিৎসা খুঁজুন..." : "Search for fish medicines, treatments..."}
        />

        {/* Right Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Cart */}
          <CartSheet />

          {/* Wishlist - logged in only */}
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

          {/* User / Auth */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 px-2">
                  {isAdmin ? <Shield className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
                  <span className="hidden sm:inline text-sm font-medium">{isAdmin ? (language === "bn" ? "অ্যাডমিন" : "Admin") : userName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover border border-border shadow-lg z-50">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium text-foreground">{userName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                    <LayoutDashboard className="h-4 w-4" />
                    {t.dashboard}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    {t.profile}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    {t.settings}
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2 cursor-pointer text-primary">
                        <Shield className="h-4 w-4" />
                        {t.adminPanel}
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={signOut}
                  className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  {t.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="gap-2">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">{t.login}</span>
              </Button>
            </Link>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col gap-4 mt-8">
                {/* Mobile Search */}
                <SearchSuggestions
                  placeholder={language === "bn" ? "খুঁজুন..." : "Search..."}
                />

                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`text-base font-medium transition-colors hover:text-primary px-2 py-1 rounded-md ${
                      location.pathname === item.path
                        ? "text-primary bg-primary/10"
                        : "text-foreground"
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
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">{userName}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                          <Badge variant={isAdmin ? "default" : "secondary"} className="text-xs w-fit mt-1">
                            {userRole}
                          </Badge>
                        </div>
                      </div>
                      <Link to="/dashboard" className="block">
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <LayoutDashboard className="h-4 w-4" />
                          {t.dashboard}
                        </Button>
                      </Link>
                      <Link to="/dashboard/profile" className="block">
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <User className="h-4 w-4" />
                          {t.profile}
                        </Button>
                      </Link>
                      <Link to="/dashboard/settings" className="block">
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <Settings className="h-4 w-4" />
                          {t.settings}
                        </Button>
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" className="block">
                          <Button variant="ghost" className="w-full justify-start gap-2 text-primary">
                            <Shield className="h-4 w-4" />
                            {t.adminPanel}
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                        onClick={signOut}
                      >
                        <LogOut className="h-4 w-4" />
                        {t.logout}
                      </Button>
                    </>
                  ) : (
                    <Link to="/auth">
                      <Button variant="default" size="sm" className="w-full gap-2">
                        <LogIn className="h-4 w-4" />
                        {t.loginSignup}
                      </Button>
                    </Link>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Bottom Row: Navigation Links - Desktop */}
      <nav className="hidden md:block border-t border-border">
        <div className="container flex items-center gap-8 h-10">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium transition-colors hover:text-primary pb-0.5 ${
                location.pathname === item.path
                  ? "text-foreground border-b-2 border-primary"
                  : "text-muted-foreground"
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
