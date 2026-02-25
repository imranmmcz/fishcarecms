import { ReactNode, useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { useAuth } from "@/contexts/AuthContext";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  LayoutDashboard, Users, Settings, BarChart3, Home, Shield, User, Package,
  Megaphone, Layout, TrendingUp, Database, ShoppingCart, Warehouse, UserCheck,
  Building2, FileText, CloudUpload, Palette, Store, ChevronDown, CreditCard,
  Mail, Globe, Sliders, Stethoscope, Calculator, MonitorSmartphone, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Menu Data ---
interface SubMenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  permissionKey?: string; // permission key to check access
}

interface MenuGroup {
  label: string;
  icon: LucideIcon;
  items: SubMenuItem[];
}

const cmsGroup: MenuGroup = {
  label: "সিএমএস",
  icon: Palette,
  items: [
    { title: "পেজ ম্যানেজমেন্ট", url: "/admin/pages", icon: FileText, permissionKey: "admin_pages" },
    { title: "পেজ বিল্ডার", url: "/admin/page-builder", icon: Layout, permissionKey: "admin_pages" },
    { title: "বিজ্ঞাপন", url: "/admin/ads", icon: Megaphone, permissionKey: "admin_ads" },
    { title: "বাজার দর", url: "/admin/market-prices", icon: TrendingUp, permissionKey: "admin_market_prices" },
    { title: "রোগ ব্যবস্থাপনা", url: "/admin/diseases", icon: Stethoscope, permissionKey: "admin_pages" },
    { title: "ক্যালকুলেটর মডিউল", url: "/admin/calculators", icon: Calculator, permissionKey: "admin_pages" },
  ],
};

const ecommerceGroup: MenuGroup = {
  label: "ই-কমার্স",
  icon: Store,
  items: [
    { title: "পণ্য ব্যবস্থাপনা", url: "/admin/products", icon: Package, permissionKey: "admin_products" },
    { title: "অর্ডার ম্যানেজমেন্ট", url: "/admin/orders", icon: ShoppingCart, permissionKey: "admin_orders" },
    { title: "POS বিক্রি", url: "/admin/pos", icon: MonitorSmartphone, permissionKey: "admin_pos" },
    { title: "ইনভেন্টরি", url: "/admin/inventory", icon: Warehouse, permissionKey: "admin_inventory" },
    { title: "কাস্টমার", url: "/admin/customers", icon: UserCheck, permissionKey: "admin_customers" },
    { title: "সাপ্লায়ার", url: "/admin/suppliers", icon: Building2, permissionKey: "admin_suppliers" },
    { title: "ই-কমার্স ওভারভিউ", url: "/admin/ecommerce-overview", icon: BarChart3, permissionKey: "admin_ecommerce" },
  ],
};

const settingsGroup: MenuGroup = {
  label: "সেটিংস",
  icon: Settings,
  items: [
    { title: "সাধারণ সেটিংস", url: "/admin/settings", icon: Sliders, permissionKey: "admin_settings" },
    { title: "SEO সেটিংস", url: "/admin/settings?tab=seo", icon: Globe, permissionKey: "admin_settings" },
    { title: "পেমেন্ট গেটওয়ে", url: "/admin/settings?tab=payment", icon: CreditCard, permissionKey: "admin_settings" },
    { title: "ইমেইল/SMTP", url: "/admin/settings?tab=email", icon: Mail, permissionKey: "admin_settings" },
    { title: "থিম", url: "/admin/settings?tab=theme", icon: Palette, permissionKey: "admin_settings" },
    { title: "ব্যবহারকারী", url: "/admin/users", icon: Users, permissionKey: "admin_users" },
    { title: "ডাটাবেজ এক্সপোর্ট", url: "/admin/database-export", icon: Database, permissionKey: "admin_backup" },
    { title: "সিস্টেম ব্যাকআপ", url: "/admin/backup", icon: CloudUpload, permissionKey: "admin_backup" },
    { title: "প্রোফাইল", url: "/admin/profile", icon: User },
  ],
};

const allGroups = [cmsGroup, ecommerceGroup, settingsGroup];

// --- Collapsible Menu Group Component ---
function SidebarMenuGroup({
  group,
  currentPath,
  currentSearch,
  filterItem,
}: {
  group: MenuGroup;
  currentPath: string;
  currentSearch: string;
  filterItem: (item: SubMenuItem) => boolean;
}) {
  const visibleItems = group.items.filter(filterItem);
  const currentFull = currentPath + currentSearch;
  const hasActive = visibleItems.some((item) => {
    if (item.url.includes("?")) return currentFull === item.url;
    return currentPath === item.url && !currentSearch;
  });
  const [open, setOpen] = useState(hasActive);

  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  if (visibleItems.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-violet-300 hover:bg-white/10 hover:text-white transition-all group cursor-pointer">
        <div className={cn("p-1.5 rounded-lg transition-all shrink-0", hasActive ? "bg-white/20" : "bg-violet-800/50")}>
          <group.icon className={cn("h-4 w-4", hasActive ? "text-white" : "text-violet-400")} />
        </div>
        <span className="font-semibold text-sm flex-1 text-left group-data-[collapsible=icon]:hidden">{group.label}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-violet-400 transition-transform duration-200 group-data-[collapsible=icon]:hidden", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-4 pl-3 border-l border-white/10 mt-1 space-y-0.5">
          {visibleItems.map((item) => {
            const isActive = item.url.includes("?")
              ? currentFull === item.url
              : currentPath === item.url && !currentSearch;
            return (
              <Link
                key={item.url}
                to={item.url}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                  isActive ? "bg-white/15 text-white font-medium shadow-sm" : "text-violet-300/80 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-white" : "text-violet-400/70")} />
                <span className="group-data-[collapsible=icon]:hidden truncate">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// --- Main Layout ---
interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, userRole } = useAuth();
  const { hasPermission } = useRolePermissions();

  // Staff roles that can access admin panel
  const isStaff = userRole === "manager" || userRole === "cashier" || userRole === "delivery_staff";
  const canAccessAdmin = isAdmin || isStaff;

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    } else if (!isLoading && user && !canAccessAdmin) {
      navigate("/");
    }
  }, [user, canAccessAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10 text-white">লোড হচ্ছে...</div>
      </div>
    );
  }

  if (!user || !canAccessAdmin) return null;

  // Filter menu items based on permissions
  const filterItem = (item: SubMenuItem): boolean => {
    if (isAdmin) return true; // admin sees everything
    if (!item.permissionKey) return true; // no permission required (e.g., profile)
    return hasPermission(userRole || "", item.permissionKey);
  };

  // Check standalone items
  const canSeeDashboard = isAdmin || hasPermission(userRole || "", "admin_dashboard");
  const canSeeReports = isAdmin || hasPermission(userRole || "", "admin_reports");

  const currentTitle = allGroups
    .flatMap((g) => g.items)
    .find((i) => i.url === location.pathname)?.title
    || (location.pathname === "/admin" ? "ড্যাশবোর্ড" : "অ্যাডমিন");

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-violet-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <AnimatedBackground />
        <Sidebar collapsible="icon" className="border-r-0 relative z-10">
          <div className="h-full bg-gradient-to-b from-violet-950/95 via-purple-900/95 to-violet-950/95 backdrop-blur-sm">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-violet-400 to-purple-600 rounded-xl shadow-lg shadow-violet-500/30">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div className="group-data-[collapsible=icon]:hidden">
                  <h1 className="font-bold text-white text-base leading-tight">
                    {isAdmin ? "অ্যাডমিন" : userRole === "manager" ? "ম্যানেজার" : userRole === "cashier" ? "ক্যাশিয়ার" : "স্টাফ"}
                  </h1>
                  <p className="text-[10px] text-violet-300">ম্যানেজমেন্ট প্যানেল</p>
                </div>
              </div>
            </div>

            <SidebarContent className="px-2 py-3 flex flex-col h-[calc(100%-72px)]">
              <SidebarGroup className="flex-1 overflow-y-auto space-y-1">
                {/* Dashboard */}
                {canSeeDashboard && (
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.pathname === "/admin"} tooltip="ড্যাশবোর্ড">
                          <Link
                            to="/admin"
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all",
                              location.pathname === "/admin"
                                ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg"
                                : "text-violet-200 hover:bg-white/10 hover:text-white"
                            )}
                          >
                            <div className={cn("p-1.5 rounded-lg shrink-0", location.pathname === "/admin" ? "bg-white/20" : "bg-violet-800/50")}>
                              <LayoutDashboard className={cn("h-4 w-4", location.pathname === "/admin" ? "text-white" : "text-violet-400")} />
                            </div>
                            <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">ড্যাশবোর্ড</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                )}

                {/* Reports */}
                {canSeeReports && (
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.pathname === "/admin/reports"} tooltip="রিপোর্ট">
                          <Link
                            to="/admin/reports"
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all",
                              location.pathname === "/admin/reports"
                                ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg"
                                : "text-violet-200 hover:bg-white/10 hover:text-white"
                            )}
                          >
                            <div className={cn("p-1.5 rounded-lg shrink-0", location.pathname === "/admin/reports" ? "bg-white/20" : "bg-violet-800/50")}>
                              <BarChart3 className={cn("h-4 w-4", location.pathname === "/admin/reports" ? "text-white" : "text-emerald-400")} />
                            </div>
                            <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">রিপোর্ট</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                )}

                <div className="h-px bg-white/10 mx-2 my-1" />

                <SidebarMenuGroup group={cmsGroup} currentPath={location.pathname} currentSearch={location.search} filterItem={filterItem} />
                <SidebarMenuGroup group={ecommerceGroup} currentPath={location.pathname} currentSearch={location.search} filterItem={filterItem} />

                <div className="h-px bg-white/10 mx-2 my-1" />

                <SidebarMenuGroup group={settingsGroup} currentPath={location.pathname} currentSearch={location.search} filterItem={filterItem} />
              </SidebarGroup>

              <div className="pt-3 border-t border-white/10 mt-auto">
                <Link
                  to="/"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-violet-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  <div className="p-1.5 rounded-lg bg-violet-800/50 shrink-0">
                    <Home className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">হোম পেজে ফিরুন</span>
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
