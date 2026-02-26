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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LayoutDashboard, Users, Settings, BarChart3, Home, Shield, User, Package,
  Megaphone, Layout, TrendingUp, Database, ShoppingCart, Warehouse, UserCheck,
  Building2, FileText, CloudUpload, Palette, Store, ChevronDown, CreditCard,
  Mail, Globe, Sliders, Stethoscope, Calculator, MonitorSmartphone, Clock, type LucideIcon,
  PanelLeftClose, PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Menu Data ---
interface SubMenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  permissionKey?: string;
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
    { title: "অর্ডার ম্যানেজমেন্ট", url: "/admin/orders", icon: ShoppingCart, permissionKey: "admin_orders" },
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
    { title: "POS প্রিন্ট", url: "/admin/settings?tab=pos-print", icon: MonitorSmartphone, permissionKey: "admin_settings" },
    { title: "ব্যবহারকারী", url: "/admin/users", icon: Users, permissionKey: "admin_users" },
    { title: "ডাটাবেজ এক্সপোর্ট", url: "/admin/database-export", icon: Database, permissionKey: "admin_backup" },
    { title: "সিস্টেম ব্যাকআপ", url: "/admin/backup", icon: CloudUpload, permissionKey: "admin_backup" },
    { title: "প্রোফাইল", url: "/admin/profile", icon: User },
  ],
};

const allGroups = [cmsGroup, ecommerceGroup, settingsGroup];

// --- Sidebar Nav Item with Tooltip ---
function NavItem({
  to,
  icon: Icon,
  label,
  isActive,
  activeClass,
  iconColorClass,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  activeClass: string;
  iconColorClass: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={to}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
            isActive
              ? `${activeClass} text-white shadow-lg shadow-black/10 scale-[1.01]`
              : "text-violet-200/90 hover:bg-white/10 hover:text-white hover:translate-x-0.5"
          )}
        >
          <div className={cn(
            "p-1.5 rounded-lg shrink-0 transition-all duration-200",
            isActive ? "bg-white/20" : "bg-violet-800/40"
          )}>
            <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-white" : iconColorClass)} />
          </div>
          <span className="font-medium text-sm group-data-[collapsible=icon]:hidden truncate">{label}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="group-data-[collapsible=open]:hidden">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

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
      <Tooltip>
        <TooltipTrigger asChild>
          <CollapsibleTrigger className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-violet-300 hover:bg-white/8 hover:text-white transition-all duration-200 group/trigger cursor-pointer">
            <div className={cn(
              "p-1.5 rounded-lg transition-all duration-200 shrink-0",
              hasActive ? "bg-white/20" : "bg-violet-800/40"
            )}>
              <group.icon className={cn("h-4 w-4 transition-colors", hasActive ? "text-white" : "text-violet-400")} />
            </div>
            <span className="font-semibold text-sm flex-1 text-left group-data-[collapsible=icon]:hidden">{group.label}</span>
            <ChevronDown className={cn(
              "h-3.5 w-3.5 text-violet-400 transition-transform duration-300 group-data-[collapsible=icon]:hidden",
              open && "rotate-180"
            )} />
          </CollapsibleTrigger>
        </TooltipTrigger>
        <TooltipContent side="right" className="group-data-[collapsible=open]:hidden">
          {group.label}
        </TooltipContent>
      </Tooltip>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-up-1 data-[state=open]:slide-down-1 duration-200">
        <div className="ml-4 pl-3 border-l-2 border-white/10 mt-1 space-y-0.5">
          {visibleItems.map((item) => {
            const isActive = item.url.includes("?")
              ? currentFull === item.url
              : currentPath === item.url && !currentSearch;
            return (
              <Tooltip key={item.url}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.url}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                      isActive
                        ? "bg-white/15 text-white font-medium shadow-sm"
                        : "text-violet-300/80 hover:bg-white/5 hover:text-white hover:translate-x-0.5"
                    )}
                  >
                    <item.icon className={cn(
                      "h-3.5 w-3.5 shrink-0 transition-colors",
                      isActive ? "text-white" : "text-violet-400/70"
                    )} />
                    <span className="group-data-[collapsible=icon]:hidden truncate">{item.title}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="group-data-[collapsible=open]:hidden">
                  {item.title}
                </TooltipContent>
              </Tooltip>
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
        <div className="relative z-10 text-white flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-sm text-violet-200">লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  if (!user || !canAccessAdmin) return null;

  const filterItem = (item: SubMenuItem): boolean => {
    if (isAdmin) return true;
    if (!item.permissionKey) return true;
    return hasPermission(userRole || "", item.permissionKey);
  };

  const canSeeDashboard = isAdmin || hasPermission(userRole || "", "admin_dashboard");
  const canSeeReports = isAdmin || hasPermission(userRole || "", "admin_reports");

  const currentTitle = allGroups
    .flatMap((g) => g.items)
    .find((i) => i.url === location.pathname)?.title
    || (location.pathname === "/admin" ? "ড্যাশবোর্ড"
      : location.pathname === "/admin/reports" ? "রিপোর্ট"
      : "অ্যাডমিন");

  const roleLabel = isAdmin ? "অ্যাডমিন"
    : userRole === "manager" ? "ম্যানেজার"
    : userRole === "cashier" ? "ক্যাশিয়ার"
    : "স্টাফ";

  return (
    <TooltipProvider delayDuration={300}>
      <SidebarProvider defaultOpen={false}>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-violet-900 via-purple-900 to-slate-900 relative overflow-hidden">
          <AnimatedBackground />
          <Sidebar collapsible="icon" className="border-r-0 relative z-10">
            <div className="h-full bg-gradient-to-b from-violet-950/95 via-purple-900/95 to-violet-950/95 backdrop-blur-md flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-violet-400 to-purple-600 rounded-xl shadow-lg shadow-violet-500/25 shrink-0">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
                    <h1 className="font-bold text-white text-base leading-tight truncate">{roleLabel}</h1>
                    <p className="text-[10px] text-violet-300/80">ম্যানেজমেন্ট প্যানেল</p>
                  </div>
                </div>
              </div>

              <SidebarContent className="px-2 py-3 flex flex-col flex-1 overflow-hidden">
                <SidebarGroup className="flex-1 overflow-y-auto overflow-x-hidden space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {/* Dashboard */}
                  {canSeeDashboard && (
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild isActive={location.pathname === "/admin"} tooltip="ড্যাশবোর্ড">
                            <NavItem
                              to="/admin"
                              icon={LayoutDashboard}
                              label="ড্যাশবোর্ড"
                              isActive={location.pathname === "/admin"}
                              activeClass="bg-gradient-to-r from-violet-500 to-purple-600"
                              iconColorClass="text-violet-400"
                            />
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
                            <NavItem
                              to="/admin/reports"
                              icon={BarChart3}
                              label="রিপোর্ট"
                              isActive={location.pathname === "/admin/reports"}
                              activeClass="bg-gradient-to-r from-emerald-500 to-green-600"
                              iconColorClass="text-emerald-400"
                            />
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  )}

                  <div className="h-px bg-white/8 mx-2 my-1.5" />

                  <SidebarMenuGroup group={cmsGroup} currentPath={location.pathname} currentSearch={location.search} filterItem={filterItem} />
                  <SidebarMenuGroup group={ecommerceGroup} currentPath={location.pathname} currentSearch={location.search} filterItem={filterItem} />

                  {/* POS Single Link */}
                  {(isAdmin || hasPermission(userRole || "", "admin_pos")) && (
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild isActive={location.pathname.startsWith("/pos")} tooltip="POS সিস্টেম">
                            <NavItem
                              to="/pos"
                              icon={MonitorSmartphone}
                              label="POS সিস্টেম"
                              isActive={location.pathname.startsWith("/pos")}
                              activeClass="bg-gradient-to-r from-emerald-500 to-teal-600"
                              iconColorClass="text-emerald-400"
                            />
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  )}

                  <div className="h-px bg-white/8 mx-2 my-1.5" />

                  <SidebarMenuGroup group={settingsGroup} currentPath={location.pathname} currentSearch={location.search} filterItem={filterItem} />
                </SidebarGroup>

                {/* Footer */}
                <div className="pt-3 border-t border-white/10 mt-auto space-y-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to="/"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-violet-300 hover:bg-white/10 hover:text-white transition-all duration-200 hover:translate-x-0.5"
                      >
                        <div className="p-1.5 rounded-lg bg-violet-800/40 shrink-0">
                          <Home className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-sm group-data-[collapsible=icon]:hidden truncate">হোম পেজে ফিরুন</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="group-data-[collapsible=open]:hidden">
                      হোম পেজে ফিরুন
                    </TooltipContent>
                  </Tooltip>
                </div>
              </SidebarContent>
            </div>
          </Sidebar>

          <main className="flex-1 overflow-auto relative z-10">
            <div className="p-4 border-b bg-card/80 backdrop-blur-sm flex items-center gap-4 sticky top-0 z-20">
              <SidebarTrigger className="text-foreground hover:bg-accent/50 transition-colors rounded-lg" />
              <div className="h-6 w-px bg-border" />
              <span className="text-sm font-medium text-muted-foreground">{currentTitle}</span>
            </div>
            <div className="p-6 bg-background/80 backdrop-blur-sm min-h-[calc(100vh-65px)] rounded-tl-2xl">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
