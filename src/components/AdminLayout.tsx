import { ReactNode, useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAdminTranslations } from "@/data/adminTranslations";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  LayoutDashboard, Users, Settings, BarChart3, Home, Shield, User, Package,
  Megaphone, Layout, TrendingUp, Database, ShoppingCart, Warehouse, UserCheck,
  Building2, FileText, CloudUpload, Palette, Store, ChevronDown, CreditCard,
  Mail, Globe, Sliders, Stethoscope, Calculator, MonitorSmartphone, Clock, MessageSquare, Zap, Handshake, Ticket, DollarSign, type LucideIcon,
  Menu, X, LogOut, ChevronLeft, ChevronRight, Languages, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

// --- Collapsible Menu Group ---
function SidebarMenuGroup({
  group, currentPath, currentSearch, filterItem, onNavigate, collapsed,
}: {
  group: MenuGroup; currentPath: string; currentSearch: string;
  filterItem: (item: SubMenuItem) => boolean; onNavigate?: () => void; collapsed?: boolean;
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

  if (collapsed) {
    return (
      <div className="space-y-1">
        {visibleItems.map((item) => {
          const isActive = item.url.includes("?")
            ? currentFull === item.url
            : currentPath === item.url && !currentSearch;
          return (
            <Link
              key={item.url}
              to={item.url}
              onClick={onNavigate}
              title={item.title}
              className={cn(
                "flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                  : "hover:bg-white/10"
              )}
              style={!isActive ? { color: 'hsl(var(--sidebar-text-muted))' } : undefined}
            >
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
        <button
          type="button"
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer hover:bg-white/8",
            hasActive ? "bg-white/10" : ""
          )}
          style={{ color: hasActive ? 'hsl(var(--sidebar-text))' : 'hsl(var(--sidebar-text-muted))' }}
        >
          <group.icon className={cn("h-[18px] w-[18px] shrink-0", hasActive ? "text-primary" : "")} style={!hasActive ? { color: 'hsl(var(--sidebar-text-muted))' } : undefined} />
          <span className="flex-1 text-left truncate">{group.label}</span>
          <ChevronDown className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            open && "rotate-180"
          )} style={{ color: 'hsl(var(--sidebar-accent))' }} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200">
        <div className="ml-4 pl-3 mt-1 space-y-0.5" style={{ borderLeft: '2px solid hsl(var(--sidebar-border))' }}>
          {visibleItems.map((item) => {
            const isActive = item.url.includes("?")
              ? currentFull === item.url
              : currentPath === item.url && !currentSearch;
            return (
              <Link
                key={item.url}
                to={item.url}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200",
                  isActive
                    ? "bg-primary/20 text-primary font-medium"
                    : "hover:bg-white/5"
                )}
                style={!isActive ? { color: 'hsl(var(--sidebar-text-muted))' } : undefined}
              >
                <item.icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : "")} style={!isActive ? { color: 'hsl(var(--sidebar-text-muted) / 0.7)' } : undefined} />
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
function SidebarNavItem({
  to, icon: Icon, label, isActive, onNavigate, collapsed,
}: {
  to: string; icon: LucideIcon; label: string; isActive: boolean;
  onNavigate?: () => void; collapsed?: boolean;
}) {
  if (collapsed) {
    return (
      <Link
        to={to}
        onClick={onNavigate}
        title={label}
        className={cn(
          "flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all duration-200",
          isActive
            ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
            : "hover:bg-white/10"
        )}
        style={!isActive ? { color: 'hsl(var(--sidebar-text-muted))' } : undefined}
      >
        <Icon className="h-[18px] w-[18px]" />
      </Link>
    );
  }

  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200",
        isActive
          ? "bg-primary/15 text-primary font-semibold"
          : "hover:bg-white/8"
      )}
      style={!isActive ? { color: 'hsl(var(--sidebar-text-muted))' } : undefined}
    >
      <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-primary" : "")} style={!isActive ? { color: 'hsl(var(--sidebar-text-muted))' } : undefined} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

// --- Main Layout ---
interface AdminLayoutProps { children: ReactNode; }

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, userRole, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const at = useAdminTranslations(language);
  const { hasPermission } = useRolePermissions();
  const isMobileView = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isStaff = userRole === "manager" || userRole === "cashier" || userRole === "delivery_staff";
  const canAccessAdmin = isAdmin || isStaff;

  // Build menu groups with translations
  const cmsGroup: MenuGroup = {
    label: at.cms,
    icon: Palette,
    items: [
      { title: at.pageManagement, url: "/admin/pages", icon: FileText, permissionKey: "admin_pages" },
      { title: at.pageBuilder, url: "/admin/page-builder", icon: Layout, permissionKey: "admin_pages" },
      { title: at.ads, url: "/admin/ads", icon: Megaphone, permissionKey: "admin_ads" },
      { title: at.marketPrices, url: "/admin/market-prices", icon: TrendingUp, permissionKey: "admin_market_prices" },
      { title: at.diseaseManagement, url: "/admin/diseases", icon: Stethoscope, permissionKey: "admin_pages" },
      { title: at.calculatorModules, url: "/admin/calculators", icon: Calculator, permissionKey: "admin_pages" },
      { title: at.blogManagement, url: "/admin/blog", icon: MessageSquare, permissionKey: "admin_pages" },
      { title: at.campaignManagement, url: "/admin/campaigns", icon: Megaphone, permissionKey: "admin_ads" },
      { title: at.flashSales, url: "/admin/flash-sales", icon: Zap, permissionKey: "admin_ads" },
      { title: at.notificationTemplates, url: "/admin/notification-templates", icon: MessageSquare, permissionKey: "admin_settings" },
      { title: at.farmingReports, url: "/admin/farming-reports", icon: BarChart3, permissionKey: "admin_reports" },
    ],
  };

  const ecommerceGroup: MenuGroup = {
    label: at.ecommerce,
    icon: Store,
    items: [
      { title: at.orderManagement, url: "/admin/orders", icon: ShoppingCart, permissionKey: "admin_orders" },
      { title: at.incompleteOrders, url: "/admin/incomplete-orders", icon: Clock, permissionKey: "admin_orders" },
      { title: at.abandonedCarts, url: "/admin/abandoned-carts", icon: UserCheck, permissionKey: "admin_orders" },
      { title: at.ecommerceOverview, url: "/admin/ecommerce-overview", icon: BarChart3, permissionKey: "admin_ecommerce" },
    ],
  };

  const partnersGroup: MenuGroup = {
    label: "Partners",
    icon: Handshake,
    items: [
      { title: "Partners", url: "/admin/partners", icon: Handshake, permissionKey: "admin_users" },
      { title: "Referral Codes", url: "/admin/partners/codes", icon: Ticket, permissionKey: "admin_users" },
      { title: "Commissions", url: "/admin/partners/commissions", icon: DollarSign, permissionKey: "admin_users" },
      { title: "Withdrawals", url: "/admin/partners/withdrawals", icon: DollarSign, permissionKey: "admin_users" },
    ],
  };

  const settingsGroup: MenuGroup = {
    label: at.settingsGroup,
    icon: Settings,
    items: [
      { title: at.generalSettings, url: "/admin/settings", icon: Sliders, permissionKey: "admin_settings" },
      { title: at.seoSettings, url: "/admin/settings?tab=seo", icon: Globe, permissionKey: "admin_settings" },
      { title: at.paymentGateway, url: "/admin/settings?tab=payment", icon: CreditCard, permissionKey: "admin_settings" },
      { title: at.emailSmtp, url: "/admin/settings?tab=email", icon: Mail, permissionKey: "admin_settings" },
      { title: at.theme, url: "/admin/settings?tab=theme", icon: Palette, permissionKey: "admin_settings" },
      { title: at.posPrint, url: "/admin/settings?tab=pos-print", icon: MonitorSmartphone, permissionKey: "admin_settings" },
      { title: at.users, url: "/admin/users", icon: Users, permissionKey: "admin_users" },
      { title: at.databaseExport, url: "/admin/database-export", icon: Database, permissionKey: "admin_backup" },
     { title: "Database Config", url: "/admin/database-config", icon: Database, permissionKey: "admin_settings" },
      { title: at.seoFiles, url: "/admin/seo-files", icon: Globe, permissionKey: "admin_settings" },
      { title: at.systemBackup, url: "/admin/backup", icon: CloudUpload, permissionKey: "admin_backup" },
      { title: "Security Logs", url: "/admin/security-logs", icon: Shield, permissionKey: "admin_users" },
      { title: "Security Dashboard", url: "/admin/security-dashboard", icon: Shield, permissionKey: "admin_users" },
      { title: "Notification Preferences", url: "/admin/notification-preferences", icon: Bell, permissionKey: "admin_users" },
      { title: at.profile, url: "/admin/profile", icon: User },
    ],
  };

  const allGroups = [cmsGroup, ecommerceGroup, partnersGroup, settingsGroup];

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
    else if (!isLoading && user && !canAccessAdmin) navigate("/");
  }, [user, canAccessAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">{at.loading}</span>
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
    || (location.pathname === "/admin" ? at.dashboard
      : location.pathname === "/admin/reports" ? at.reports
      : at.admin);

  const roleLabel = isAdmin ? at.admin
    : userRole === "manager" ? at.manager
    : userRole === "cashier" ? at.cashier
    : at.staff;

  const menuProps = {
    currentPath: location.pathname,
    currentSearch: location.search,
    filterItem,
  };

  const renderMenu = (onNavigate?: () => void, collapsed?: boolean) => (
    <>
      {canSeeDashboard && (
        <SidebarNavItem to="/admin" icon={LayoutDashboard} label={at.dashboard}
          isActive={location.pathname === "/admin"}
          onNavigate={onNavigate} collapsed={collapsed} />
      )}

      {!collapsed && <div className="h-px mx-2 my-2" style={{ background: 'hsl(var(--sidebar-border))' }} />}

      <SidebarMenuGroup group={cmsGroup} {...menuProps}
        onNavigate={onNavigate} collapsed={collapsed} />

      <SidebarMenuGroup group={ecommerceGroup} {...menuProps}
        onNavigate={onNavigate} collapsed={collapsed} />

      <SidebarMenuGroup group={partnersGroup} {...menuProps}
        onNavigate={onNavigate} collapsed={collapsed} />

      {(isAdmin || hasPermission(userRole || "", "admin_pos")) && (
        <SidebarNavItem to="/pos" icon={MonitorSmartphone} label={at.posSystem}
          isActive={location.pathname.startsWith("/pos")}
          onNavigate={onNavigate} collapsed={collapsed} />
      )}

      {canSeeReports && (
        <SidebarNavItem to="/admin/reports" icon={BarChart3} label={at.reports}
          isActive={location.pathname === "/admin/reports"}
          onNavigate={onNavigate} collapsed={collapsed} />
      )}

      {!collapsed && <div className="h-px mx-2 my-2" style={{ background: 'hsl(var(--sidebar-border))' }} />}

      <SidebarMenuGroup group={settingsGroup} {...menuProps}
        onNavigate={onNavigate} collapsed={collapsed} />
    </>
  );

  const renderFooter = (onNavigate?: () => void, collapsed?: boolean) => (
    <div className={cn("pt-3 space-y-1", collapsed && "flex flex-col items-center")} style={{ borderTop: '1px solid hsl(var(--sidebar-border))' }}>
      <Link to="/admin/profile" onClick={onNavigate} title={at.profile}
        className={cn(
          "flex items-center rounded-xl transition-all duration-200",
          collapsed ? "justify-center w-10 h-10" : "gap-3 px-3 py-2",
          location.pathname === "/admin/profile"
            ? collapsed ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" : "bg-primary/15 text-primary font-semibold"
            : "hover:bg-white/8"
        )}
        style={location.pathname !== "/admin/profile" ? { color: 'hsl(var(--sidebar-text-muted))' } : undefined}>
        <User className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span className="text-sm truncate">{at.profile}</span>}
      </Link>
      <Link to="/" onClick={onNavigate} title={at.returnHome}
        className={cn(
          "flex items-center rounded-xl transition-all duration-200 hover:bg-white/8",
          collapsed ? "justify-center w-10 h-10" : "gap-3 px-3 py-2",
        )}
        style={{ color: 'hsl(var(--sidebar-text-muted))' }}>
        <Home className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span className="text-sm truncate">{at.returnHome}</span>}
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen flex w-full bg-muted/30">
      {/* ===== Desktop Sidebar ===== */}
      {!isMobileView && (
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 flex flex-col border-r transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "w-[68px]" : "w-[260px]"
          )}
          style={{ background: 'var(--gradient-sidebar)', borderColor: 'hsl(var(--sidebar-border))' }}
        >
          {/* Sidebar Header */}
          <div className={cn(
            "flex items-center shrink-0",
            sidebarCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
          )} style={{ borderBottom: '1px solid hsl(var(--sidebar-border))' }}>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="p-2 rounded-xl shrink-0 bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/25">
                  <Shield className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-bold text-sm leading-tight truncate" style={{ color: 'hsl(var(--sidebar-text))' }}>{roleLabel}</h1>
                  <p className="text-[10px] leading-tight" style={{ color: 'hsl(var(--sidebar-text-muted))' }}>{at.managementPanel}</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={cn(
                "p-1.5 rounded-lg transition-colors shrink-0",
                sidebarCollapsed && "mx-auto"
              )}
              style={{ color: 'hsl(var(--sidebar-text-muted))' }}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Sidebar Navigation */}
          <nav className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent",
            sidebarCollapsed ? "px-1.5" : "px-2.5"
          )}>
            {renderMenu(undefined, sidebarCollapsed)}
          </nav>

          {/* Sidebar Footer */}
          <div className={cn("px-2.5 pb-3", sidebarCollapsed && "px-1.5")}>
            {renderFooter(undefined, sidebarCollapsed)}
          </div>
        </aside>
      )}

      {/* ===== Main Content ===== */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
        !isMobileView && (sidebarCollapsed ? "ml-[68px]" : "ml-[260px]")
      )}>
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 px-4 py-2.5">
            {/* Mobile hamburger */}
            {isMobileView && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <Menu className="h-5 w-5 text-foreground" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0 border-r-0" style={{ background: 'var(--gradient-sidebar)' }}>
                  <div className="p-4" style={{ borderBottom: '1px solid hsl(var(--sidebar-border))' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/25">
                          <Shield className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <h1 className="font-bold text-base" style={{ color: 'hsl(var(--sidebar-text))' }}>{roleLabel}</h1>
                          <p className="text-[10px]" style={{ color: 'hsl(var(--sidebar-text-muted))' }}>{at.managementPanel}</p>
                        </div>
                      </div>
                      <SheetClose asChild>
                        <button className="p-2 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'hsl(var(--sidebar-text-muted))' }}>
                          <X className="h-5 w-5" />
                        </button>
                      </SheetClose>
                    </div>
                  </div>
                  <div className="px-2.5 py-3 overflow-y-auto max-h-[calc(100vh-140px)] flex flex-col">
                    <nav className="flex-1 space-y-1">
                      {renderMenu(() => setMobileMenuOpen(false), false)}
                    </nav>
                    <div className="mt-3">
                      {renderFooter(() => setMobileMenuOpen(false), false)}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-foreground truncate">{currentTitle}</span>
            </div>

            <div className="flex-1" />

            {/* Language toggle in top bar */}
            <button
              onClick={() => setLanguage(language === "bn" ? "en" : "bn")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors text-sm text-muted-foreground"
              title={at.language}
            >
              <Languages className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-medium">{language === "bn" ? "EN" : "বাং"}</span>
            </button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {(user?.email?.slice(0, 2) || "AD").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm font-medium text-foreground truncate max-w-[120px]">
                    {(user as any)?.full_name || user?.email?.split("@")[0] || "Admin"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs text-muted-foreground truncate">{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" /> {at.profile}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" /> {at.settings}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" /> {at.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 dashboard-main min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
