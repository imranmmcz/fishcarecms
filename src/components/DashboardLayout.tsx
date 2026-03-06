import { ReactNode, useState, useEffect } from "react";
import { InactivityWarningBanner } from "@/components/InactivityWarningBanner";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard, TrendingUp, TrendingDown, Waves, FileText, Home, Fish,
  CloudUpload, User, Settings, Shield, LogOut, ChevronDown, ChevronLeft, ChevronRight,
  Menu, X, Package, RefreshCw, Store, MonitorSmartphone, BarChart3, Palette, PenSquare, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ===================== TYPES =====================
interface SubMenuItem {
  title: string;
  titleBn: string;
  url: string;
  icon: LucideIcon;
}

interface MenuGroup {
  label: string;
  labelBn: string;
  icon: LucideIcon;
  iconColor: string;
  activeClass: string;
  items: SubMenuItem[];
}

// ===================== ADMIN MENU DATA =====================
const adminCmsGroup: MenuGroup = {
  label: "CMS", labelBn: "সিএমএস", icon: Palette, iconColor: "text-cyan-400",
  activeClass: "bg-gradient-to-r from-cyan-500 to-blue-600",
  items: [
    { title: "My Pond", titleBn: "আমার পুকুর", url: "/dashboard/my-pond", icon: Waves },
    { title: "Income", titleBn: "আয়", url: "/dashboard/income", icon: TrendingUp },
    { title: "Expense", titleBn: "ব্যয়", url: "/dashboard/expense", icon: TrendingDown },
  ],
};

const adminEcommerceGroup: MenuGroup = {
  label: "E-Commerce", labelBn: "ই-কমার্স", icon: Store, iconColor: "text-emerald-400",
  activeClass: "bg-gradient-to-r from-emerald-500 to-green-600",
  items: [
    { title: "My Orders", titleBn: "আমার অর্ডার", url: "/dashboard/orders", icon: Package },
  ],
};

const adminSettingsGroup: MenuGroup = {
  label: "Settings", labelBn: "সেটিংস", icon: Settings, iconColor: "text-slate-400",
  activeClass: "bg-gradient-to-r from-slate-500 to-gray-600",
  items: [
    { title: "Profile", titleBn: "প্রোফাইল", url: "/dashboard/profile", icon: User },
    { title: "Settings", titleBn: "সেটিংস", url: "/dashboard/settings", icon: Settings },
    { title: "Backup", titleBn: "ব্যাকআপ", url: "/dashboard/backup", icon: CloudUpload },
  ],
};

const adminGroups = [adminCmsGroup, adminEcommerceGroup, adminSettingsGroup];

// ===================== FARMER/CUSTOMER MENU DATA =====================
const farmerMainMenuItems = [
  { title: "dashboard", titleBn: "ড্যাশবোর্ড", url: "/dashboard", icon: LayoutDashboard, color: "bg-gradient-to-r from-purple-500 to-purple-600", iconColor: "text-purple-500", roles: ["farmer", "customer", "admin", "blogger"] },
  { title: "myPond", titleBn: "আমার পুকুর", url: "/dashboard/my-pond", icon: Waves, color: "bg-gradient-to-r from-blue-500 to-cyan-600", iconColor: "text-blue-500", roles: ["farmer", "admin"] },
  { title: "orders", titleBn: "আমার অর্ডার", url: "/dashboard/orders", icon: Package, color: "bg-gradient-to-r from-teal-500 to-emerald-600", iconColor: "text-teal-500", roles: ["farmer", "customer", "admin", "blogger"] },
  { title: "blog", titleBn: "ব্লগ", url: "/dashboard/blog", icon: PenSquare, color: "bg-gradient-to-r from-indigo-500 to-violet-600", iconColor: "text-indigo-500", roles: ["farmer", "customer", "admin", "blogger"] },
  { title: "income", titleBn: "আয়", url: "/dashboard/income", icon: TrendingUp, color: "bg-gradient-to-r from-emerald-500 to-green-600", iconColor: "text-emerald-500", roles: ["farmer", "admin"] },
  { title: "expense", titleBn: "ব্যয়", url: "/dashboard/expense", icon: TrendingDown, color: "bg-gradient-to-r from-rose-500 to-red-600", iconColor: "text-rose-500", roles: ["farmer", "admin"] },
  { title: "reports", titleBn: "রিপোর্ট", url: "/dashboard/reports", icon: FileText, color: "bg-gradient-to-r from-amber-500 to-orange-600", iconColor: "text-amber-500", roles: ["farmer", "admin"] },
  { title: "profitPrediction", titleBn: "লাভ হিসাব", url: "/dashboard/profit-prediction", icon: BarChart3, color: "bg-gradient-to-r from-green-500 to-emerald-600", iconColor: "text-green-500", roles: ["farmer", "admin"] },
  { title: "smartFeed", titleBn: "স্মার্ট ফিড", url: "/dashboard/smart-feed", icon: Package, color: "bg-gradient-to-r from-orange-500 to-amber-600", iconColor: "text-orange-500", roles: ["farmer", "admin"] },
];

const farmerSettingsGroup: MenuGroup = {
  label: "Settings", labelBn: "সেটিংস", icon: Settings, iconColor: "text-slate-400",
  activeClass: "bg-gradient-to-r from-slate-500 to-gray-600",
  items: [
    { title: "Profile", titleBn: "প্রোফাইল", url: "/dashboard/profile", icon: User },
    { title: "Backup", titleBn: "ব্যাকআপ", url: "/dashboard/backup", icon: CloudUpload },
  ],
};

// --- Admin Collapsible Group (Fixed sidebar version) ---
function AdminSidebarMenuGroupFixed({ group, currentPath, isBn, onNavigate }: {
  group: MenuGroup; currentPath: string; isBn: boolean; onNavigate?: () => void;
}) {
  const hasActive = group.items.some(i => currentPath === i.url);
  const [open, setOpen] = useState(hasActive);
  useEffect(() => { if (hasActive) setOpen(true); }, [hasActive]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button type="button"
          className={cn("flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer hover:bg-white/8",
            hasActive ? "bg-white/10" : ""
          )}
          style={{ color: hasActive ? 'hsl(var(--sidebar-text))' : 'hsl(var(--sidebar-text-muted))' }}>
          <group.icon className={cn("h-[18px] w-[18px] shrink-0", hasActive ? "text-primary" : "")} style={!hasActive ? { color: 'hsl(var(--sidebar-text-muted))' } : undefined} />
          <span className="flex-1 text-left truncate">{isBn ? group.labelBn : group.label}</span>
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} style={{ color: 'hsl(var(--sidebar-accent))' }} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out duration-200">
        <div className="ml-4 pl-3 mt-1 space-y-0.5" style={{ borderLeft: '2px solid hsl(var(--sidebar-border))' }}>
          {group.items.map(item => {
            const isActive = currentPath === item.url;
            return (
              <Link key={item.url} to={item.url} onClick={onNavigate}
                className={cn("flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200",
                  isActive ? "bg-primary/20 text-primary font-medium" : "hover:bg-white/5"
                )}
                style={!isActive ? { color: 'hsl(var(--sidebar-text-muted))' } : undefined}>
                <item.icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : "")} style={!isActive ? { color: 'hsl(var(--sidebar-text-muted) / 0.7)' } : undefined} />
                <span className="truncate">{isBn ? item.titleBn : item.title}</span>
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ===================== SHARED COMPONENTS =====================

// --- Admin Nav Item with Tooltip ---
function AdminNavItem({ to, icon: Icon, label, isActive, activeClass, iconColorClass }: {
  to: string; icon: LucideIcon; label: string; isActive: boolean; activeClass: string; iconColorClass: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link to={to}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
            isActive ? `${activeClass} text-white shadow-lg shadow-black/10 scale-[1.01]` : "text-cyan-200/90 hover:bg-white/10 hover:text-white hover:translate-x-0.5"
          )}>
          <div className={cn("p-1.5 rounded-lg shrink-0 transition-all duration-200", isActive ? "bg-white/20" : "bg-cyan-800/40")}>
            <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-white" : iconColorClass)} />
          </div>
          <span className="font-medium text-sm group-data-[collapsible=icon]:hidden truncate">{label}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="group-data-[collapsible=open]:hidden">{label}</TooltipContent>
    </Tooltip>
  );
}

// --- Admin Collapsible Menu Group (Desktop) ---
function AdminSidebarMenuGroup({ group, currentPath, isBn }: {
  group: MenuGroup; currentPath: string; isBn: boolean;
}) {
  const hasActive = group.items.some(i => currentPath === i.url);
  const [open, setOpen] = useState(hasActive);
  useEffect(() => { if (hasActive) setOpen(true); }, [hasActive]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <CollapsibleTrigger className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-cyan-300 hover:bg-white/8 hover:text-white transition-all duration-200 cursor-pointer">
            <div className={cn("p-1.5 rounded-lg transition-all duration-200 shrink-0", hasActive ? "bg-white/20" : "bg-cyan-800/40")}>
              <group.icon className={cn("h-4 w-4 transition-colors", hasActive ? "text-white" : group.iconColor)} />
            </div>
            <span className="font-semibold text-sm flex-1 text-left group-data-[collapsible=icon]:hidden">{isBn ? group.labelBn : group.label}</span>
            <ChevronDown className={cn("h-3.5 w-3.5 text-cyan-400 transition-transform duration-300 group-data-[collapsible=icon]:hidden", open && "rotate-180")} />
          </CollapsibleTrigger>
        </TooltipTrigger>
        <TooltipContent side="right" className="group-data-[collapsible=open]:hidden">{isBn ? group.labelBn : group.label}</TooltipContent>
      </Tooltip>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200">
        <div className="ml-4 pl-3 border-l-2 border-white/10 mt-1 space-y-0.5">
          {group.items.map(item => {
            const isActive = currentPath === item.url;
            return (
              <Tooltip key={item.url}>
                <TooltipTrigger asChild>
                  <Link to={item.url}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                      isActive ? "bg-white/15 text-white font-medium shadow-sm" : "text-cyan-300/80 hover:bg-white/5 hover:text-white hover:translate-x-0.5"
                    )}>
                    <item.icon className={cn("h-3.5 w-3.5 shrink-0 transition-colors", isActive ? "text-white" : "text-cyan-400/70")} />
                    <span className="group-data-[collapsible=icon]:hidden truncate">{isBn ? item.titleBn : item.title}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="group-data-[collapsible=open]:hidden">{isBn ? item.titleBn : item.title}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// --- Admin Mobile Collapsible Group ---
function AdminMobileMenuGroup({ group, currentPath, isBn, onClose }: {
  group: MenuGroup; currentPath: string; isBn: boolean; onClose: () => void;
}) {
  const hasActive = group.items.some(i => currentPath === i.url);
  const [open, setOpen] = useState(hasActive);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-cyan-300 hover:bg-white/8 hover:text-white transition-all cursor-pointer">
        <div className={cn("p-2 rounded-lg shrink-0", hasActive ? "bg-white/20" : "bg-slate-700/50")}>
          <group.icon className={cn("h-5 w-5", hasActive ? "text-white" : group.iconColor)} />
        </div>
        <span className="font-semibold flex-1 text-left">{isBn ? group.labelBn : group.label}</span>
        <ChevronDown className={cn("h-4 w-4 text-cyan-400 transition-transform duration-300", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out duration-200">
        <div className="ml-6 pl-3 border-l-2 border-white/10 mt-1 space-y-0.5">
          {group.items.map(item => {
            const isActive = currentPath === item.url;
            return (
              <Link key={item.url} to={item.url} onClick={onClose}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                  isActive ? "bg-white/15 text-white font-medium" : "text-cyan-300/80 hover:bg-white/5 hover:text-white"
                )}>
                <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-cyan-400/70")} />
                <span>{isBn ? item.titleBn : item.title}</span>
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ===================== MAIN LAYOUT =====================
interface DashboardLayoutProps { children: ReactNode; }

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isCustomer, isFarmer, userRole, user, profile, signOut, switchToFarmer } = useAuth();
  const { t, language } = useLanguage();
  const isBn = language === "bn";
  const isMobileView = useIsMobile();

  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [farmerSidebarCollapsed, setFarmerSidebarCollapsed] = useState(false);
  const [adminSidebarCollapsed, setAdminSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (profile) {
      setUserName(profile.full_name || user?.email?.split("@")[0] || "");
      setUserAvatar(profile.avatar_url || null);
    } else if (user) {
      setUserName((user as any)?.full_name || user.email?.split("@")[0] || "");
      setUserAvatar((user as any)?.avatar_url || null);
    }
  }, [user, profile]);

  const handleLogout = async () => { await signOut(); navigate("/"); };
  const handleSwitchToFarmer = async () => {
    setIsSwitching(true);
    const success = await switchToFarmer();
    setIsSwitching(false);
    if (success) { navigate("/dashboard"); window.location.reload(); }
  };

  // Farmer/Customer menu filtered by role
  const filteredFarmerMenu = farmerMainMenuItems.filter(item => !userRole || item.roles.includes(userRole));

  // Current page title
  const getTitle = () => {
    if (isAdmin) {
      const allItems = [...adminGroups.flatMap(g => g.items)];
      const found = allItems.find(i => i.url === location.pathname);
      if (found) return isBn ? found.titleBn : found.title;
    }
    const allFarmerItems = [...farmerMainMenuItems, ...farmerSettingsGroup.items];
    const found = allFarmerItems.find(i => i.url === location.pathname);
    if (found) return isBn ? found.titleBn : found.title;
    return t.dashboard;
  };

  const roleLabel = userRole === "customer"
    ? (isBn ? "কাস্টমার ড্যাশবোর্ড" : "Customer Dashboard")
    : userRole === "blogger"
      ? (isBn ? "ব্লগার ড্যাশবোর্ড" : "Blogger Dashboard")
      : isAdmin
        ? (isBn ? "এডমিন ড্যাশবোর্ড" : "Admin Dashboard")
        : (isBn ? "কৃষক ড্যাশবোর্ড" : "Farmer Dashboard");

  // ===================== PROFILE DROPDOWN (shared) =====================
  const ProfileDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg hover:bg-accent transition-colors outline-none">
        <Avatar className="h-7 w-7 md:h-8 md:w-8 border border-border">
          <AvatarImage src={userAvatar || undefined} alt={userName} />
          <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs md:text-sm font-medium">
            {userName.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs md:text-sm font-medium text-foreground hidden sm:inline max-w-24 truncate">
          {userName || (isBn ? "ব্যবহারকারী" : "User")}
        </span>
        <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover border border-border shadow-lg z-50">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-foreground">{userName || (isBn ? "ব্যবহারকারী" : "User")}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/dashboard/profile" className="flex items-center gap-2"><User className="h-4 w-4" /><span>{t.profile}</span></Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/dashboard/settings" className="flex items-center gap-2"><Settings className="h-4 w-4" /><span>{t.settings}</span></Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4 mr-2" /><span>{t.logout}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // ===================== ADMIN RENDER HELPERS =====================
  const renderAdminMenu = (onNavigate?: () => void, collapsed?: boolean) => {
    const NavItem = ({ to, icon: Icon, label, isActive }: { to: string; icon: LucideIcon; label: string; isActive: boolean }) => {
      if (collapsed) {
        return (
          <Link to={to} onClick={onNavigate} title={label}
            className={cn("flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all duration-200",
              isActive ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" : "hover:bg-white/10"
            )}
            style={!isActive ? { color: 'hsl(var(--sidebar-text-muted))' } : undefined}>
            <Icon className="h-[18px] w-[18px]" />
          </Link>
        );
      }
      return (
        <Link to={to} onClick={onNavigate}
          className={cn("flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200",
            isActive ? "bg-primary/15 text-primary font-semibold" : "hover:bg-white/8"
          )}
          style={!isActive ? { color: 'hsl(var(--sidebar-text-muted))' } : undefined}>
          <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-primary" : "")} style={!isActive ? { color: 'hsl(var(--sidebar-text-muted))' } : undefined} />
          <span className="truncate">{label}</span>
        </Link>
      );
    };

    return (
      <>
        <NavItem to="/dashboard" icon={LayoutDashboard} label={t.dashboard} isActive={location.pathname === "/dashboard"} />

        {!collapsed && <div className="h-px mx-2 my-2" style={{ background: 'hsl(var(--sidebar-border))' }} />}

        {/* CMS */}
        {collapsed ? (
          adminCmsGroup.items.map(item => {
            const isActive = location.pathname === item.url;
            return <NavItem key={item.url} to={item.url} icon={item.icon} label={isBn ? item.titleBn : item.title} isActive={isActive} />;
          })
        ) : (
          <AdminSidebarMenuGroupFixed group={adminCmsGroup} currentPath={location.pathname} isBn={isBn} onNavigate={onNavigate} />
        )}

        {/* E-Commerce */}
        {collapsed ? (
          adminEcommerceGroup.items.map(item => {
            const isActive = location.pathname === item.url;
            return <NavItem key={item.url} to={item.url} icon={item.icon} label={isBn ? item.titleBn : item.title} isActive={isActive} />;
          })
        ) : (
          <AdminSidebarMenuGroupFixed group={adminEcommerceGroup} currentPath={location.pathname} isBn={isBn} onNavigate={onNavigate} />
        )}

        {/* POS */}
        <NavItem to="/pos" icon={MonitorSmartphone} label={isBn ? "POS সিস্টেম" : "POS System"} isActive={location.pathname.startsWith("/pos")} />

        {/* Reports */}
        <NavItem to="/dashboard/reports" icon={BarChart3} label={t.reports} isActive={location.pathname === "/dashboard/reports"} />

        {!collapsed && <div className="h-px mx-2 my-2" style={{ background: 'hsl(var(--sidebar-border))' }} />}

        {/* Settings */}
        {collapsed ? (
          adminSettingsGroup.items.map(item => {
            const isActive = location.pathname === item.url;
            return <NavItem key={item.url} to={item.url} icon={item.icon} label={isBn ? item.titleBn : item.title} isActive={isActive} />;
          })
        ) : (
          <AdminSidebarMenuGroupFixed group={adminSettingsGroup} currentPath={location.pathname} isBn={isBn} onNavigate={onNavigate} />
        )}
      </>
    );
  };

  const renderAdminFooter = (onNavigate?: () => void, collapsed?: boolean) => (
    <div className={cn("pt-3 space-y-1", collapsed && "flex flex-col items-center")} style={{ borderTop: '1px solid hsl(var(--sidebar-border))' }}>
      <Link to="/admin" onClick={onNavigate} title={t.adminPanel}
        className={cn(
          "flex items-center rounded-xl transition-all duration-200 hover:bg-white/8",
          collapsed ? "justify-center w-10 h-10" : "gap-3 px-3 py-2",
        )}
        style={{ color: 'hsl(var(--sidebar-text-muted))' }}>
        <Shield className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span className="text-sm truncate">{t.adminPanel}</span>}
      </Link>
      <Link to="/" onClick={onNavigate} title={isBn ? "হোম পেজে ফিরুন" : "Back to Home"}
        className={cn(
          "flex items-center rounded-xl transition-all duration-200 hover:bg-white/8",
          collapsed ? "justify-center w-10 h-10" : "gap-3 px-3 py-2",
        )}
        style={{ color: 'hsl(var(--sidebar-text-muted))' }}>
        <Home className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span className="text-sm truncate">{isBn ? "হোম পেজে ফিরুন" : "Back to Home"}</span>}
      </Link>
    </div>
  );

  // ===================== ADMIN LAYOUT =====================
  if (isAdmin) {
    return (
      <TooltipProvider delayDuration={300}>
        <div className="min-h-screen flex w-full bg-muted/30">
          {/* ===== Desktop Sidebar (Fixed) ===== */}
          {!isMobileView && (
            <aside
              className={cn(
                "fixed inset-y-0 left-0 z-30 flex flex-col border-r transition-all duration-300 ease-in-out",
                adminSidebarCollapsed ? "w-[68px]" : "w-[260px]"
              )}
              style={{ background: 'var(--gradient-sidebar)', borderColor: 'hsl(var(--sidebar-border))' }}
            >
              {/* Sidebar Header */}
              <div className={cn(
                "flex items-center shrink-0",
                adminSidebarCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
              )} style={{ borderBottom: '1px solid hsl(var(--sidebar-border))' }}>
                {!adminSidebarCollapsed && (
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="p-2 rounded-xl shrink-0 bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/25">
                      <Fish className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="font-bold text-sm leading-tight truncate" style={{ color: 'hsl(var(--sidebar-text))' }}>{isBn ? "মাছ চাষ" : "Fish Farming"}</h1>
                      <p className="text-[10px] leading-tight" style={{ color: 'hsl(var(--sidebar-text-muted))' }}>{roleLabel}</p>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setAdminSidebarCollapsed(!adminSidebarCollapsed)}
                  className={cn("p-1.5 rounded-lg transition-colors shrink-0", adminSidebarCollapsed && "mx-auto")}
                  style={{ color: 'hsl(var(--sidebar-text-muted))' }}
                >
                  {adminSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </button>
              </div>

              {/* Sidebar Navigation */}
              <nav className={cn(
                "flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent",
                adminSidebarCollapsed ? "px-1.5" : "px-2.5"
              )}>
                {renderAdminMenu(undefined, adminSidebarCollapsed)}
              </nav>

              {/* Sidebar Footer */}
              <div className={cn("px-2.5 pb-3", adminSidebarCollapsed && "px-1.5")}>
                {renderAdminFooter(undefined, adminSidebarCollapsed)}
              </div>
            </aside>
          )}

          {/* ===== Main Content ===== */}
          <div className={cn(
            "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
            !isMobileView && (adminSidebarCollapsed ? "ml-[68px]" : "ml-[260px]")
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
                              <Fish className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                              <h1 className="font-bold text-base" style={{ color: 'hsl(var(--sidebar-text))' }}>{isBn ? "মাছ চাষ" : "Fish Farming"}</h1>
                              <p className="text-[10px]" style={{ color: 'hsl(var(--sidebar-text-muted))' }}>{roleLabel}</p>
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
                          {renderAdminMenu(() => setMobileMenuOpen(false), false)}
                        </nav>
                        <div className="mt-3">
                          {renderAdminFooter(() => setMobileMenuOpen(false), false)}
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                )}

                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-foreground truncate">{getTitle()}</span>
                </div>

                <div className="flex-1" />

                <ProfileDropdown />
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 p-4 md:p-6">
              <InactivityWarningBanner />
              {children}
            </main>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // ===================== FARMER / CUSTOMER LAYOUT (with Settings submenu) =====================
  const FarmerMenuItemLink = ({ item, onClick }: { item: typeof farmerMainMenuItems[0]; onClick?: () => void }) => {
    const isActive = location.pathname === item.url;
    return (
      <Link to={item.url} onClick={onClick}
        className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
          isActive ? `${item.color} text-white shadow-lg` : "text-slate-300 hover:bg-white/10 hover:text-white"
        )}>
        <div className={cn("p-2 rounded-lg transition-all shrink-0", isActive ? "bg-white/20" : "bg-slate-700/50")}>
          <item.icon className={cn("h-5 w-5", isActive ? "text-white" : item.iconColor)} />
        </div>
        <span className="font-medium">{isBn ? item.titleBn : (t as any)[item.title] || item.title}</span>
      </Link>
    );
  };

  // Settings collapsible for farmer sidebar
  const FarmerSettingsCollapsible = ({ isMobile, onClose }: { isMobile?: boolean; onClose?: () => void }) => {
    const hasActive = farmerSettingsGroup.items.some(i => location.pathname === i.url);
    const [open, setOpen] = useState(hasActive);
    useEffect(() => { if (hasActive) setOpen(true); }, [hasActive]);

    return (
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer hover:bg-white/8"
          style={{ color: hasActive ? 'hsl(var(--sidebar-text))' : 'hsl(var(--sidebar-text-muted))' }}
        >
          <Settings className={cn("h-[18px] w-[18px] shrink-0", hasActive ? "text-primary" : "")} style={!hasActive ? { color: 'hsl(var(--sidebar-text-muted))' } : undefined} />
          <span className="flex-1 text-left">{isBn ? "সেটিংস" : "Settings"}</span>
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", open && "rotate-180")} style={{ color: 'hsl(var(--sidebar-accent))' }} />
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200">
          <div className="ml-4 pl-3 mt-1 space-y-0.5" style={{ borderLeft: '2px solid hsl(var(--sidebar-border))' }}>
            {farmerSettingsGroup.items.map(item => {
              const isActive = location.pathname === item.url;
              return (
                <Link key={item.url} to={item.url} onClick={onClose}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200",
                    isActive ? "bg-primary/20 text-primary font-medium" : "hover:bg-white/5"
                  )}
                  style={!isActive ? { color: 'hsl(var(--sidebar-text-muted))' } : undefined}>
                  <item.icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : "")} style={!isActive ? { color: 'hsl(var(--sidebar-text-muted) / 0.7)' } : undefined} />
                  <span>{isBn ? item.titleBn : item.title}</span>
                </Link>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  // farmerSidebarCollapsed moved to top of component

  // Farmer menu rendering for desktop sidebar
  const renderFarmerMenu = (onNavigate?: () => void, collapsed?: boolean) => (
    <>
      {filteredFarmerMenu.map((item) => {
        const isActive = location.pathname === item.url;
        if (collapsed) {
          return (
            <Link key={item.url} to={item.url} onClick={onNavigate} title={isBn ? item.titleBn : item.title}
              className={cn(
                "flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all duration-200",
                isActive ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" : "hover:bg-white/10"
              )}
              style={!isActive ? { color: 'hsl(var(--sidebar-text-muted))' } : undefined}>
              <item.icon className="h-[18px] w-[18px]" />
            </Link>
          );
        }
        return (
          <Link key={item.url} to={item.url} onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200",
              isActive ? "bg-primary/15 text-primary font-semibold" : "hover:bg-white/8"
            )}
            style={!isActive ? { color: 'hsl(var(--sidebar-text-muted))' } : undefined}>
            <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-primary" : "")} style={!isActive ? { color: 'hsl(var(--sidebar-text-muted))' } : undefined} />
            <span className="truncate">{isBn ? item.titleBn : (t as any)[item.title] || item.title}</span>
          </Link>
        );
      })}

      {!collapsed && <div className="h-px mx-2 my-2" style={{ background: 'hsl(var(--sidebar-border))' }} />}

      {/* Settings Group */}
      {collapsed ? (
        farmerSettingsGroup.items.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <Link key={item.url} to={item.url} onClick={onNavigate} title={isBn ? item.titleBn : item.title}
              className={cn(
                "flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all duration-200",
                isActive ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" : "hover:bg-white/10"
              )}
              style={!isActive ? { color: 'hsl(var(--sidebar-text-muted))' } : undefined}>
              <item.icon className="h-[18px] w-[18px]" />
            </Link>
          );
        })
      ) : (
        <FarmerSettingsCollapsible />
      )}

      {isCustomer && !collapsed && (
        <button onClick={() => { onNavigate?.(); handleSwitchToFarmer(); }} disabled={isSwitching}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-white/8 transition-all w-full"
          style={{ color: 'hsl(var(--sidebar-accent))' }}>
          <RefreshCw className={cn("h-[18px] w-[18px] shrink-0", isSwitching && "animate-spin")} />
          <span className="truncate">{isBn ? "কৃষক হিসেবে যোগ দিন" : "Switch to Farmer"}</span>
        </button>
      )}
    </>
  );

  const renderFarmerFooter = (onNavigate?: () => void, collapsed?: boolean) => (
    <div className={cn("pt-3 space-y-1", collapsed && "flex flex-col items-center")} style={{ borderTop: '1px solid hsl(var(--sidebar-border))' }}>
      <Link to="/" onClick={onNavigate} title={isBn ? "হোম পেজে ফিরুন" : "Back to Home"}
        className={cn(
          "flex items-center rounded-xl transition-all duration-200 hover:bg-white/8",
          collapsed ? "justify-center w-10 h-10" : "gap-3 px-3 py-2",
        )}
        style={{ color: 'hsl(var(--sidebar-text-muted))' }}>
        <Home className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span className="text-sm truncate">{isBn ? "হোম পেজে ফিরুন" : "Back to Home"}</span>}
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen flex w-full bg-muted/30">
      {/* ===== Desktop Sidebar (Fixed, same as AdminLayout) ===== */}
      {!isMobileView && (
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 flex flex-col border-r transition-all duration-300 ease-in-out",
            farmerSidebarCollapsed ? "w-[68px]" : "w-[260px]"
          )}
          style={{ background: 'var(--gradient-sidebar)', borderColor: 'hsl(var(--sidebar-border))' }}
        >
          {/* Sidebar Header */}
          <div className={cn(
            "flex items-center shrink-0",
            farmerSidebarCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
          )} style={{ borderBottom: '1px solid hsl(var(--sidebar-border))' }}>
            {!farmerSidebarCollapsed && (
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="p-2 rounded-xl shrink-0 bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/25">
                  <Fish className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-bold text-sm leading-tight truncate" style={{ color: 'hsl(var(--sidebar-text))' }}>{isBn ? "মাছ চাষ" : "Fish Farming"}</h1>
                  <p className="text-[10px] leading-tight" style={{ color: 'hsl(var(--sidebar-text-muted))' }}>{roleLabel}</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setFarmerSidebarCollapsed(!farmerSidebarCollapsed)}
              className={cn(
                "p-1.5 rounded-lg transition-colors shrink-0",
                farmerSidebarCollapsed && "mx-auto"
              )}
              style={{ color: 'hsl(var(--sidebar-text-muted))' }}
            >
              {farmerSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Sidebar Navigation */}
          <nav className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent",
            farmerSidebarCollapsed ? "px-1.5" : "px-2.5"
          )}>
            {renderFarmerMenu(undefined, farmerSidebarCollapsed)}
          </nav>

          {/* Sidebar Footer */}
          <div className={cn("px-2.5 pb-3", farmerSidebarCollapsed && "px-1.5")}>
            {renderFarmerFooter(undefined, farmerSidebarCollapsed)}
          </div>
        </aside>
      )}

      {/* ===== Main Content ===== */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
        !isMobileView && (farmerSidebarCollapsed ? "ml-[68px]" : "ml-[260px]")
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
                          <Fish className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <h1 className="font-bold text-base" style={{ color: 'hsl(var(--sidebar-text))' }}>{isBn ? "মাছ চাষ" : "Fish Farming"}</h1>
                          <p className="text-[10px]" style={{ color: 'hsl(var(--sidebar-text-muted))' }}>{roleLabel}</p>
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
                      {renderFarmerMenu(() => setMobileMenuOpen(false), false)}
                    </nav>
                    <div className="mt-3">
                      {renderFarmerFooter(() => setMobileMenuOpen(false), false)}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-foreground truncate">{getTitle()}</span>
            </div>

            <div className="flex-1" />

            <ProfileDropdown />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">
          <InactivityWarningBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
