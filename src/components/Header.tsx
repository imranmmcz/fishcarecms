import { Fish, Menu, LogIn, Shield, LogOut, User, LayoutDashboard, Settings, ChevronDown, TrendingUp, Package, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Button3D } from "@/components/ui/button-3d";
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

  // Get user display name from Supabase user metadata
  const defaultUserName = language === "bn" ? "ব্যবহারকারী" : "User";
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || defaultUserName;
  const userRole = isAdmin ? (language === "bn" ? "অ্যাডমিন" : "Admin") : (language === "bn" ? "ব্যবহারকারী" : "User");
  const userInitials = userName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          {headerData?.logoUrl ? (
            <img src={headerData.logoUrl} alt={companyName} className="h-10 w-10 rounded-lg object-contain" />
          ) : (
            <div className="rounded-lg bg-gradient-primary p-2">
              <Fish className="h-6 w-6 text-primary-foreground" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">{companyName}</span>
            <span className="text-xs text-muted-foreground">{companySubtitle}</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === item.path
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          
          {/* Cart & Auth Section */}
          <div className="flex items-center gap-2 ml-4 border-l border-border pl-4">
            {/* Wishlist & Cart & Auth Section */}
            <CartSheet />
            
            {/* Wishlist Button */}
            <Link to="/wishlist" className="relative">
              <Button variant="ghost" size="icon" className="relative">
                <Heart className={`h-5 w-5 ${wishlistCount > 0 ? "text-destructive fill-destructive" : ""}`} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Button>
            </Link>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium text-foreground">{userName}</span>
                      <Badge variant={isAdmin ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                        {userRole}
                      </Badge>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
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
                <Button3D variant="primary" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  {t.login}
                </Button3D>
              </Link>
            )}
          </div>
        </nav>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <nav className="flex flex-col gap-4 mt-8">
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
              
              {/* Mobile Auth */}
              <div className="border-t border-border pt-4 mt-4 space-y-2">
                {/* Mobile Wishlist */}
                <Link to="/wishlist" className="block">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Heart className={`h-4 w-4 ${wishlistCount > 0 ? "text-destructive fill-destructive" : ""}`} />
                    {language === "bn" ? "উইশলিস্ট" : "Wishlist"}
                    {wishlistCount > 0 && (
                      <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0">{wishlistCount}</Badge>
                    )}
                  </Button>
                </Link>
                
                {user ? (
                  <>
                    {/* User Info */}
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
                    <Button3D variant="primary" size="sm" className="w-full gap-2">
                      <LogIn className="h-4 w-4" />
                      {t.loginSignup}
                    </Button3D>
                  </Link>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
