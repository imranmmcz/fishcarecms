import { ReactNode, useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, ShoppingCart, History, Clock, Home, MonitorSmartphone,
  ArrowLeft, Package, Warehouse, UserCheck, Building2, ChevronDown,
  ArrowLeftRight, Layers, Tag, Award, Ruler,
  ShoppingBag, FileText, RotateCcw, ListOrdered,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainMenuItems = [
  { title: "POS ড্যাশবোর্ড", url: "/pos", icon: LayoutDashboard },
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

interface POSLayoutProps {
  children: ReactNode;
}

export function POSLayout({ children }: POSLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, userRole } = useAuth();

  const isStaff = userRole === "manager" || userRole === "cashier" || userRole === "delivery_staff";
  const canAccess = isAdmin || isStaff;
  const isSalesSectionActive = salesSubItems.some(i => location.pathname === i.url);
  const isProductSectionActive = productSubItems.some(i => location.pathname === i.url);
  const isPurchaseSectionActive = purchaseSubItems.some(i => location.pathname === i.url);
  const [salesOpen, setSalesOpen] = useState(isSalesSectionActive);
  const [productsOpen, setProductsOpen] = useState(isProductSectionActive);
  const [purchasesOpen, setPurchasesOpen] = useState(isPurchaseSectionActive);

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
    else if (!isLoading && user && !canAccess) navigate("/");
  }, [user, canAccess, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 relative overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10 text-white">লোড হচ্ছে...</div>
      </div>
    );
  }

  if (!user || !canAccess) return null;

  const allItems = [...mainMenuItems, ...salesSubItems, ...productSubItems, ...purchaseSubItems, ...bottomMenuItems];
  const currentTitle = allItems.find(i => i.url === location.pathname)?.title || "POS";

  const renderMenuItem = (item: typeof mainMenuItems[0]) => {
    const isActive = location.pathname === item.url;
    return (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
          <Link
            to={item.url}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all",
              isActive
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                : "text-emerald-200 hover:bg-white/10 hover:text-white"
            )}
          >
            <div className={cn("p-1.5 rounded-lg shrink-0", isActive ? "bg-white/20" : "bg-emerald-800/50")}>
              <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-emerald-400")} />
            </div>
            <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 relative overflow-hidden">
        <AnimatedBackground />
        <Sidebar collapsible="icon" className="border-r-0 relative z-10">
          <div className="h-full bg-gradient-to-b from-emerald-950/95 via-teal-900/95 to-emerald-950/95 backdrop-blur-sm">
            {/* Header */}
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
                    {mainMenuItems.map(renderMenuItem)}

                    {/* Sales Collapsible Group */}
                    <SidebarMenuItem>
                      <button
                        onClick={() => setSalesOpen(!salesOpen)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all",
                          isSalesSectionActive
                            ? "bg-emerald-800/60 text-white"
                            : "text-emerald-200 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <div className={cn("p-1.5 rounded-lg shrink-0", isSalesSectionActive ? "bg-emerald-600/50" : "bg-emerald-800/50")}>
                          <ShoppingCart className={cn("h-4 w-4", isSalesSectionActive ? "text-emerald-300" : "text-emerald-400")} />
                        </div>
                        <span className="font-medium text-sm flex-1 text-left group-data-[collapsible=icon]:hidden">বিক্রয় ব্যবস্থাপনা</span>
                        <ChevronDown className={cn("h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden", salesOpen && "rotate-180")} />
                      </button>
                    </SidebarMenuItem>

                    {salesOpen && (
                      <div className="ml-4 border-l border-emerald-700/50 pl-2 space-y-0.5 group-data-[collapsible=icon]:hidden">
                        {salesSubItems.map((item) => {
                          const isActive = location.pathname === item.url;
                          return (
                            <SidebarMenuItem key={item.url}>
                              <Link
                                to={item.url}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm",
                                  isActive
                                    ? "bg-emerald-500/20 text-white font-semibold"
                                    : "text-emerald-300 hover:bg-white/5 hover:text-white"
                                )}
                              >
                                <item.icon className={cn("h-3.5 w-3.5", isActive ? "text-emerald-300" : "text-emerald-500")} />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuItem>
                          );
                        })}
                      </div>
                    )}

                    {/* Products Collapsible Group */}
                    <SidebarMenuItem>
                      <button
                        onClick={() => setProductsOpen(!productsOpen)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all",
                          isProductSectionActive
                            ? "bg-emerald-800/60 text-white"
                            : "text-emerald-200 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <div className={cn("p-1.5 rounded-lg shrink-0", isProductSectionActive ? "bg-emerald-600/50" : "bg-emerald-800/50")}>
                          <Package className={cn("h-4 w-4", isProductSectionActive ? "text-emerald-300" : "text-emerald-400")} />
                        </div>
                        <span className="font-medium text-sm flex-1 text-left group-data-[collapsible=icon]:hidden">পণ্য ব্যবস্থাপনা</span>
                        <ChevronDown className={cn("h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden", productsOpen && "rotate-180")} />
                      </button>
                    </SidebarMenuItem>

                    {productsOpen && (
                      <div className="ml-4 border-l border-emerald-700/50 pl-2 space-y-0.5 group-data-[collapsible=icon]:hidden">
                        {productSubItems.map((item) => {
                          const isActive = location.pathname === item.url;
                          return (
                            <SidebarMenuItem key={item.url}>
                              <Link
                                to={item.url}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm",
                                  isActive
                                    ? "bg-emerald-500/20 text-white font-semibold"
                                    : "text-emerald-300 hover:bg-white/5 hover:text-white"
                                )}
                              >
                                <item.icon className={cn("h-3.5 w-3.5", isActive ? "text-emerald-300" : "text-emerald-500")} />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuItem>
                          );
                        })}
                      </div>
                    )}

                    {/* Purchase Collapsible Group */}
                    <SidebarMenuItem>
                      <button
                        onClick={() => setPurchasesOpen(!purchasesOpen)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all",
                          isPurchaseSectionActive
                            ? "bg-emerald-800/60 text-white"
                            : "text-emerald-200 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <div className={cn("p-1.5 rounded-lg shrink-0", isPurchaseSectionActive ? "bg-emerald-600/50" : "bg-emerald-800/50")}>
                          <ShoppingBag className={cn("h-4 w-4", isPurchaseSectionActive ? "text-emerald-300" : "text-emerald-400")} />
                        </div>
                        <span className="font-medium text-sm flex-1 text-left group-data-[collapsible=icon]:hidden">ক্রয় ব্যবস্থাপনা</span>
                        <ChevronDown className={cn("h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden", purchasesOpen && "rotate-180")} />
                      </button>
                    </SidebarMenuItem>

                    {purchasesOpen && (
                      <div className="ml-4 border-l border-emerald-700/50 pl-2 space-y-0.5 group-data-[collapsible=icon]:hidden">
                        {purchaseSubItems.map((item) => {
                          const isActive = location.pathname === item.url;
                          return (
                            <SidebarMenuItem key={item.url}>
                              <Link
                                to={item.url}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm",
                                  isActive
                                    ? "bg-emerald-500/20 text-white font-semibold"
                                    : "text-emerald-300 hover:bg-white/5 hover:text-white"
                                )}
                              >
                                <item.icon className={cn("h-3.5 w-3.5", isActive ? "text-emerald-300" : "text-emerald-500")} />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuItem>
                          );
                        })}
                      </div>
                    )}

                    {bottomMenuItems.map(renderMenuItem)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <div className="pt-3 border-t border-white/10 mt-auto space-y-1">
                <Link
                  to="/admin"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-emerald-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-800/50 shrink-0">
                    <ArrowLeft className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">অ্যাডমিন প্যানেল</span>
                </Link>
                <Link
                  to="/"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-emerald-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-800/50 shrink-0">
                    <Home className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">হোম পেজ</span>
                </Link>
              </div>
            </SidebarContent>
          </div>
        </Sidebar>

        <main className="flex-1 overflow-auto relative z-10">
          <div className="p-4 border-b bg-card/80 backdrop-blur-sm flex items-center gap-4">
            <SidebarTrigger className="text-foreground" />
            <div className="h-6 w-px bg-border" />
            <span className="text-sm text-muted-foreground">{currentTitle}</span>
          </div>
          <div className="p-6 bg-background/80 backdrop-blur-sm min-h-[calc(100vh-65px)] rounded-tl-2xl">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
