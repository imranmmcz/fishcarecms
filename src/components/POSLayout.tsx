import { ReactNode, useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  LayoutDashboard, ShoppingCart, History, Clock, Home, MonitorSmartphone,
  ArrowLeft, Package, Warehouse, UserCheck, Building2, ChevronDown,
  ArrowLeftRight, Layers, Tag, Award, Ruler,
  ShoppingBag, FileText, RotateCcw, ListOrdered, Globe, Menu, X,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainMenuItems = [
  { title: "POS ড্যাশবোর্ড", url: "/pos", icon: LayoutDashboard },
  { title: "অনলাইন অর্ডার", url: "/pos/online-orders", icon: Globe },
  { title: "শিফট ইতিহাস", url: "/pos/shifts", icon: Clock },
];

const salesSubItems = [
  { title: "দ্রুত বিক্রি", url: "/pos/sell", icon: ShoppingCart },
  { title: "বিক্রি ইতিহাস", url: "/pos/history", icon: History },
  { title: "বিক্রি রিটার্ন", url: "/pos/sales/returns", icon: RotateCcw },
  { title: "বিক্রি রিপোর্ট", url: "/pos/sales/report", icon: FileText },
];

const productSubItems = [
  { title: "সকল পণ্য", url: "/pos/products", icon: Package },
  { title: "ইনভেন্টরি", url: "/pos/inventory", icon: Warehouse },
  { title: "স্টক ট্রান্সফার", url: "/pos/stock-transfers", icon: ArrowLeftRight },
  { title: "ভ্যারিয়েশন", url: "/pos/variations", icon: Layers },
  { title: "ক্যাটাগরি", url: "/pos/categories", icon: Tag },
  { title: "ব্র্যান্ড", url: "/pos/brands", icon: Award },
  { title: "ইউনিট", url: "/pos/units", icon: Ruler },
];

const purchaseSubItems = [
  { title: "ক্রয় তালিকা", url: "/pos/purchases", icon: ListOrdered },
  { title: "নতুন ক্রয়", url: "/pos/purchases/new", icon: ShoppingBag },
  { title: "ক্রয় রিটার্ন", url: "/pos/purchases/returns", icon: RotateCcw },
  { title: "ক্রয় রিপোর্ট", url: "/pos/purchases/report", icon: FileText },
];

const bottomMenuItems = [
  { title: "কাস্টমার", url: "/pos/customers", icon: UserCheck },
  { title: "সাপ্লায়ার", url: "/pos/suppliers", icon: Building2 },
];

// --- Collapsible Group ---
function POSCollapsibleGroup({ label, icon: GroupIcon, items, currentPath, onNavigate, collapsed }: {
  label: string; icon: any; items: typeof salesSubItems; currentPath: string; onNavigate?: () => void; collapsed?: boolean;
}) {
  const hasActive = items.some(i => currentPath === i.url);
  const [open, setOpen] = useState(hasActive);
  useEffect(() => { if (hasActive) setOpen(true); }, [hasActive]);

  if (collapsed) {
    return (
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = currentPath === item.url;
          return (
            <Link key={item.url} to={item.url} onClick={onNavigate} title={item.title}
              className={cn(
                "flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all duration-200",
                isActive
                  ? "bg-emerald-500 text-white shadow-md"
                  : "text-emerald-300 hover:bg-white/10 hover:text-white"
              )}>
              <item.icon className="h-[18px] w-[18px]" />
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button type="button" className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer",
          hasActive ? "text-white bg-emerald-800/60" : "text-emerald-200 hover:bg-white/10 hover:text-white"
        )}>
          <GroupIcon className={cn("h-[18px] w-[18px] shrink-0", hasActive ? "text-emerald-300" : "text-emerald-400")} />
          <span className="flex-1 text-left truncate">{label}</span>
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out duration-200">
        <div className="ml-4 pl-3 mt-1 space-y-0.5 border-l-2 border-emerald-700/50">
          {items.map((item) => {
            const isActive = currentPath === item.url;
            return (
              <Link key={item.url} to={item.url} onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200",
                  isActive ? "bg-emerald-500/20 text-white font-medium" : "text-emerald-300 hover:bg-white/5 hover:text-white"
                )}>
                <item.icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-emerald-300" : "text-emerald-500")} />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// --- Single Nav Item ---
function POSNavItem({ to, icon: Icon, label, isActive, onNavigate, collapsed }: {
  to: string; icon: any; label: string; isActive: boolean; onNavigate?: () => void; collapsed?: boolean;
}) {
  if (collapsed) {
    return (
      <Link to={to} onClick={onNavigate} title={label}
        className={cn(
          "flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all duration-200",
          isActive
            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md"
            : "text-emerald-300 hover:bg-white/10 hover:text-white"
        )}>
        <Icon className="h-[18px] w-[18px]" />
      </Link>
    );
  }

  return (
    <Link to={to} onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200",
        isActive
          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg"
          : "text-emerald-200 hover:bg-white/10 hover:text-white"
      )}>
      <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-white" : "text-emerald-400")} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

interface POSLayoutProps { children: ReactNode; }

export function POSLayout({ children }: POSLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, userRole } = useAuth();
  const isMobileView = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isStaff = userRole === "manager" || userRole === "cashier" || userRole === "delivery_staff";
  const canAccess = isAdmin || isStaff;

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
    else if (!isLoading && user && !canAccess) navigate("/");
  }, [user, canAccess, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 relative overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10 text-white flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-sm text-emerald-200">লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  if (!user || !canAccess) return null;

  const allItems = [...mainMenuItems, ...salesSubItems, ...productSubItems, ...purchaseSubItems, ...bottomMenuItems];
  const currentTitle = allItems.find(i => i.url === location.pathname)?.title || "POS";

  const renderMenu = (onNavigate?: () => void, collapsed?: boolean) => (
    <>
      {mainMenuItems.map(item => (
        <POSNavItem key={item.url} to={item.url} icon={item.icon} label={item.title}
          isActive={location.pathname === item.url} onNavigate={onNavigate} collapsed={collapsed} />
      ))}

      {!collapsed && <div className="h-px bg-white/10 mx-2 my-2" />}

      <POSCollapsibleGroup label="বিক্রয় ব্যবস্থাপনা" icon={ShoppingCart} items={salesSubItems}
        currentPath={location.pathname} onNavigate={onNavigate} collapsed={collapsed} />
      <POSCollapsibleGroup label="পণ্য ব্যবস্থাপনা" icon={Package} items={productSubItems}
        currentPath={location.pathname} onNavigate={onNavigate} collapsed={collapsed} />
      <POSCollapsibleGroup label="ক্রয় ব্যবস্থাপনা" icon={ShoppingBag} items={purchaseSubItems}
        currentPath={location.pathname} onNavigate={onNavigate} collapsed={collapsed} />

      {!collapsed && <div className="h-px bg-white/10 mx-2 my-2" />}

      {bottomMenuItems.map(item => (
        <POSNavItem key={item.url} to={item.url} icon={item.icon} label={item.title}
          isActive={location.pathname === item.url} onNavigate={onNavigate} collapsed={collapsed} />
      ))}
    </>
  );

  const renderFooter = (onNavigate?: () => void, collapsed?: boolean) => (
    <div className={cn("border-t border-white/10 pt-3 space-y-1", collapsed && "flex flex-col items-center")}>
      <Link to="/admin" onClick={onNavigate} title="অ্যাডমিন প্যানেল"
        className={cn(
          "flex items-center rounded-xl text-emerald-300 hover:bg-white/10 hover:text-white transition-all duration-200",
          collapsed ? "justify-center w-10 h-10" : "gap-3 px-3 py-2",
        )}>
        <ArrowLeft className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span className="text-sm truncate">অ্যাডমিন প্যানেল</span>}
      </Link>
      <Link to="/" onClick={onNavigate} title="হোম পেজ"
        className={cn(
          "flex items-center rounded-xl text-emerald-300 hover:bg-white/10 hover:text-white transition-all duration-200",
          collapsed ? "justify-center w-10 h-10" : "gap-3 px-3 py-2",
        )}>
        <Home className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span className="text-sm truncate">হোম পেজ</span>}
      </Link>
    </div>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 relative overflow-hidden">
        <AnimatedBackground />

        {/* ===== Desktop Sidebar (Fixed) ===== */}
        {!isMobileView && (
          <aside className={cn(
            "fixed inset-y-0 left-0 z-30 flex flex-col border-r-0 transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "w-[68px]" : "w-[260px]"
          )}>
            <div className="h-full bg-gradient-to-b from-emerald-950/95 via-teal-900/95 to-emerald-950/95 backdrop-blur-sm flex flex-col">
              {/* Sidebar Header */}
              <div className={cn(
                "flex items-center border-b border-white/10 shrink-0",
                sidebarCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
              )}>
                {!sidebarCollapsed && (
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="p-2 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/30 shrink-0">
                      <MonitorSmartphone className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="font-bold text-white text-sm leading-tight truncate">POS সিস্টেম</h1>
                      <p className="text-[10px] text-emerald-300 leading-tight">পয়েন্ট অফ সেল</p>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className={cn(
                    "p-1.5 rounded-lg hover:bg-white/10 transition-colors text-emerald-300 hover:text-white shrink-0",
                    sidebarCollapsed && "mx-auto"
                  )}
                >
                  {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </button>
              </div>

              {/* Sidebar Navigation */}
              <nav className={cn(
                "flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-1 scrollbar-thin scrollbar-thumb-emerald-700 scrollbar-track-transparent",
                sidebarCollapsed ? "px-1.5" : "px-2.5"
              )}>
                {renderMenu(undefined, sidebarCollapsed)}
              </nav>

              {/* Sidebar Footer */}
              <div className={cn("pb-3", sidebarCollapsed ? "px-1.5" : "px-2.5")}>
                {renderFooter(undefined, sidebarCollapsed)}
              </div>
            </div>
          </aside>
        )}

        {/* ===== Main Content ===== */}
        <div className={cn(
          "flex-1 flex flex-col min-h-screen relative z-10 transition-all duration-300 ease-in-out",
          !isMobileView && (sidebarCollapsed ? "ml-[68px]" : "ml-[260px]")
        )}>
          {/* Top Bar */}
          <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-sm border-b border-border">
            <div className="flex items-center gap-3 px-4 py-2.5">
              {/* Mobile hamburger */}
              {isMobileView && (
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <button className="p-2 rounded-lg hover:bg-accent transition-colors">
                      <Menu className="h-5 w-5 text-foreground" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px] p-0 bg-gradient-to-b from-emerald-950 via-teal-900 to-emerald-950 border-r-0">
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/30">
                            <MonitorSmartphone className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h1 className="font-bold text-white text-lg">POS সিস্টেম</h1>
                            <p className="text-xs text-emerald-300">পয়েন্ট অফ সেল</p>
                          </div>
                        </div>
                        <SheetClose asChild>
                          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                            <X className="h-5 w-5 text-emerald-300" />
                          </button>
                        </SheetClose>
                      </div>
                    </div>

                    <div className="px-3 py-4 overflow-y-auto max-h-[calc(100vh-160px)] space-y-1">
                      {renderMenu(() => setMobileMenuOpen(false), false)}
                      <div className="pt-4 mt-4 border-t border-white/10 space-y-1">
                        {renderFooter(() => setMobileMenuOpen(false), false)}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              )}

              <span className="text-xs md:text-sm font-medium text-muted-foreground">{currentTitle}</span>
            </div>
          </header>

          <div className="p-4 md:p-6 bg-background/80 backdrop-blur-sm min-h-[calc(100vh-49px)]">
            {children}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
