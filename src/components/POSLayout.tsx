import { ReactNode, useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LayoutDashboard, ShoppingCart, History, Clock, Home, MonitorSmartphone,
  ArrowLeft, Package, Warehouse, UserCheck, Building2, ChevronDown,
  ArrowLeftRight, Layers, Tag, Award, Ruler,
  ShoppingBag, FileText, RotateCcw, ListOrdered, Globe, Menu, X,
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

// --- Collapsible Group for Desktop ---
function POSCollapsibleGroup({ label, icon: GroupIcon, items, currentPath }: {
  label: string; icon: any; items: typeof salesSubItems; currentPath: string;
}) {
  const hasActive = items.some(i => currentPath === i.url);
  const [open, setOpen] = useState(hasActive);
  useEffect(() => { if (hasActive) setOpen(true); }, [hasActive]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <CollapsibleTrigger className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all cursor-pointer",
            hasActive ? "bg-emerald-800/60 text-white" : "text-emerald-200 hover:bg-white/10 hover:text-white"
          )}>
            <div className={cn("p-1.5 rounded-lg shrink-0", hasActive ? "bg-emerald-600/50" : "bg-emerald-800/50")}>
              <GroupIcon className={cn("h-[18px] w-[18px]", hasActive ? "text-emerald-300" : "text-emerald-400")} />
            </div>
            <span className="font-medium text-sm flex-1 text-left group-data-[collapsible=icon]:hidden">{label}</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden", open && "rotate-180")} />
          </CollapsibleTrigger>
        </TooltipTrigger>
        <TooltipContent side="right" className="group-data-[collapsible=open]:hidden">{label}</TooltipContent>
      </Tooltip>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out duration-200">
        <div className="ml-4 border-l-2 border-emerald-700/50 pl-2 space-y-0.5 mt-1 group-data-[collapsible=icon]:hidden">
          {items.map((item) => {
            const isActive = currentPath === item.url;
            return (
              <Tooltip key={item.url}>
                <TooltipTrigger asChild>
                  <Link to={item.url} className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm",
                    isActive ? "bg-emerald-500/20 text-white font-semibold" : "text-emerald-300 hover:bg-white/5 hover:text-white"
                  )}>
                    <item.icon className={cn("h-3.5 w-3.5", isActive ? "text-emerald-300" : "text-emerald-500")} />
                    <span>{item.title}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="group-data-[collapsible=open]:hidden">{item.title}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// --- Collapsible Group for Mobile ---
function MobilePOSCollapsibleGroup({ label, icon: GroupIcon, items, currentPath, onClose }: {
  label: string; icon: any; items: typeof salesSubItems; currentPath: string; onClose: () => void;
}) {
  const hasActive = items.some(i => currentPath === i.url);
  const [open, setOpen] = useState(hasActive);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer",
        hasActive ? "bg-emerald-800/60 text-white" : "text-emerald-200 hover:bg-white/10 hover:text-white"
      )}>
        <div className={cn("p-2 rounded-lg shrink-0", hasActive ? "bg-emerald-600/50" : "bg-emerald-800/50")}>
          <GroupIcon className={cn("h-5 w-5", hasActive ? "text-emerald-300" : "text-emerald-400")} />
        </div>
        <span className="font-semibold flex-1 text-left">{label}</span>
        <ChevronDown className={cn("h-4 w-4 text-emerald-400 transition-transform duration-300", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out duration-200">
        <div className="ml-6 pl-3 border-l-2 border-emerald-700/50 mt-1 space-y-0.5">
          {items.map((item) => {
            const isActive = currentPath === item.url;
            return (
              <Link key={item.url} to={item.url} onClick={onClose}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all",
                  isActive ? "bg-emerald-500/20 text-white font-medium" : "text-emerald-300/80 hover:bg-white/5 hover:text-white"
                )}>
                <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-emerald-300" : "text-emerald-500")} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

interface POSLayoutProps { children: ReactNode; }

export function POSLayout({ children }: POSLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, userRole } = useAuth();
  const isMobileView = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const renderDesktopMenuItem = (item: typeof mainMenuItems[0]) => {
    const isActive = location.pathname === item.url;
    return (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
          <Link to={item.url} className={cn(
            "flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all",
            isActive ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg" : "text-emerald-200 hover:bg-white/10 hover:text-white"
          )}>
            <div className={cn("p-1.5 rounded-lg shrink-0", isActive ? "bg-white/20" : "bg-emerald-800/50")}>
              <item.icon className={cn("h-[18px] w-[18px]", isActive ? "text-white" : "text-emerald-400")} />
            </div>
            <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const renderMobileMenuItem = (item: typeof mainMenuItems[0]) => {
    const isActive = location.pathname === item.url;
    return (
      <Link key={item.url} to={item.url} onClick={() => setMobileMenuOpen(false)}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
          isActive ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg" : "text-emerald-200 hover:bg-white/10 hover:text-white"
        )}>
        <div className={cn("p-2 rounded-lg shrink-0", isActive ? "bg-white/20" : "bg-emerald-800/50")}>
          <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-emerald-400")} />
        </div>
        <span className="font-medium">{item.title}</span>
      </Link>
    );
  };

  return (
    <TooltipProvider delayDuration={300}>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 relative overflow-hidden">
          <AnimatedBackground />

          {/* Desktop Sidebar only */}
          {!isMobileView && (
          <Sidebar collapsible="icon" className="border-r-0 relative z-10 hidden md:flex">
            <div className="h-full bg-gradient-to-b from-emerald-950/95 via-teal-900/95 to-emerald-950/95 backdrop-blur-sm flex flex-col">
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/30">
                    <MonitorSmartphone className="h-5 w-5 text-white" />
                  </div>
                  <div className="group-data-[collapsible=icon]:hidden">
                    <h1 className="font-bold text-white text-base leading-tight">POS সিস্টেম</h1>
                    <p className="text-[10px] text-emerald-300">পয়েন্ট অফ সেল</p>
                  </div>
                </div>
              </div>

              <SidebarContent className="px-2 py-3 flex flex-col h-[calc(100%-72px)]">
                <SidebarGroup className="flex-1 overflow-y-auto space-y-1">
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {mainMenuItems.map(renderDesktopMenuItem)}
                      <POSCollapsibleGroup label="বিক্রয় ব্যবস্থাপনা" icon={ShoppingCart} items={salesSubItems} currentPath={location.pathname} />
                      <POSCollapsibleGroup label="পণ্য ব্যবস্থাপনা" icon={Package} items={productSubItems} currentPath={location.pathname} />
                      <POSCollapsibleGroup label="ক্রয় ব্যবস্থাপনা" icon={ShoppingBag} items={purchaseSubItems} currentPath={location.pathname} />
                      {bottomMenuItems.map(renderDesktopMenuItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                <div className="pt-3 border-t border-white/10 mt-auto space-y-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link to="/admin" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-emerald-300 hover:bg-white/10 hover:text-white transition-all">
                        <div className="p-1.5 rounded-lg bg-emerald-800/50 shrink-0"><ArrowLeft className="h-[18px] w-[18px]" /></div>
                        <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">অ্যাডমিন প্যানেল</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="group-data-[collapsible=open]:hidden">অ্যাডমিন প্যানেল</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link to="/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-emerald-300 hover:bg-white/10 hover:text-white transition-all">
                        <div className="p-1.5 rounded-lg bg-emerald-800/50 shrink-0"><Home className="h-[18px] w-[18px]" /></div>
                        <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">হোম পেজ</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="group-data-[collapsible=open]:hidden">হোম পেজ</TooltipContent>
                  </Tooltip>
                </div>
              </SidebarContent>
            </div>
          </Sidebar>
          )}

          <main className="flex-1 overflow-auto relative z-10">
            <div className="p-3 md:p-4 border-b bg-card/80 backdrop-blur-sm flex items-center gap-3 md:gap-4 sticky top-0 z-20">
              {/* Mobile hamburger */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <button className="p-2 rounded-lg hover:bg-accent transition-colors">
                    <Menu className="h-5 w-5 text-foreground" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0 bg-gradient-to-b from-emerald-950 via-teal-900 to-emerald-950 border-r-0">
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
                    {mainMenuItems.map(renderMobileMenuItem)}

                    <div className="h-px bg-white/10 mx-2 my-2" />

                    <MobilePOSCollapsibleGroup label="বিক্রয় ব্যবস্থাপনা" icon={ShoppingCart} items={salesSubItems} currentPath={location.pathname} onClose={() => setMobileMenuOpen(false)} />
                    <MobilePOSCollapsibleGroup label="পণ্য ব্যবস্থাপনা" icon={Package} items={productSubItems} currentPath={location.pathname} onClose={() => setMobileMenuOpen(false)} />
                    <MobilePOSCollapsibleGroup label="ক্রয় ব্যবস্থাপনা" icon={ShoppingBag} items={purchaseSubItems} currentPath={location.pathname} onClose={() => setMobileMenuOpen(false)} />

                    <div className="h-px bg-white/10 mx-2 my-2" />

                    {bottomMenuItems.map(renderMobileMenuItem)}

                    <div className="pt-4 mt-4 border-t border-white/10 space-y-1">
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-300 hover:bg-white/10 hover:text-white transition-all">
                        <div className="p-2 rounded-lg bg-emerald-800/50 shrink-0"><ArrowLeft className="h-5 w-5" /></div>
                        <span className="font-medium">অ্যাডমিন প্যানেল</span>
                      </Link>
                      <Link to="/" onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-300 hover:bg-white/10 hover:text-white transition-all">
                        <div className="p-2 rounded-lg bg-emerald-800/50 shrink-0"><Home className="h-5 w-5" /></div>
                        <span className="font-medium">হোম পেজ</span>
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <SidebarTrigger className="text-foreground hidden md:flex hover:bg-accent/50 transition-colors rounded-lg" />
              <div className="h-6 w-px bg-border hidden md:block" />
              <span className="text-xs md:text-sm font-medium text-muted-foreground">{currentTitle}</span>
            </div>
            <div className="p-4 md:p-6 bg-background/80 backdrop-blur-sm min-h-[calc(100vh-57px)] md:min-h-[calc(100vh-65px)] md:rounded-tl-2xl">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}