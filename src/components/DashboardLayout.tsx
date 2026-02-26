import { ReactNode, useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
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
  CloudUpload, User, Settings, Shield, LogOut, ChevronDown, Menu, X, Package,
  RefreshCw, Store, MonitorSmartphone, BarChart3, Palette, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
interface SubMenuItem {
  title: string;
  titleBn: string;
  url: string;
  icon: LucideIcon;
  roles: string[];
}

interface MenuGroup {
  label: string;
  labelBn: string;
  icon: LucideIcon;
  iconColor: string;
  activeClass: string;
  items: SubMenuItem[];
  roles: string[];
}

// --- Menu Data ---
const cmsGroup: MenuGroup = {
  label: "CMS",
  labelBn: "সিএমএস",
  icon: Palette,
  iconColor: "text-cyan-400",
  activeClass: "bg-gradient-to-r from-cyan-500 to-blue-600",
  roles: ["farmer", "admin"],
  items: [
    { title: "My Pond", titleBn: "আমার পুকুর", url: "/dashboard/my-pond", icon: Waves, roles: ["farmer", "admin"] },
    { title: "Income", titleBn: "আয়", url: "/dashboard/income", icon: TrendingUp, roles: ["farmer", "admin"] },
    { title: "Expense", titleBn: "ব্যয়", url: "/dashboard/expense", icon: TrendingDown, roles: ["farmer", "admin"] },
  ],
};

const ecommerceGroup: MenuGroup = {
  label: "E-Commerce",
  labelBn: "ই-কমার্স",
  icon: Store,
  iconColor: "text-emerald-400",
  activeClass: "bg-gradient-to-r from-emerald-500 to-green-600",
  roles: ["farmer", "customer", "admin"],
  items: [
    { title: "My Orders", titleBn: "আমার অর্ডার", url: "/dashboard/orders", icon: Package, roles: ["farmer", "customer", "admin"] },
  ],
};

const settingsGroup: MenuGroup = {
  label: "Settings",
  labelBn: "সেটিংস",
  icon: Settings,
  iconColor: "text-slate-400",
  activeClass: "bg-gradient-to-r from-slate-500 to-gray-600",
  roles: ["farmer", "customer", "admin"],
  items: [
    { title: "Profile", titleBn: "প্রোফাইল", url: "/dashboard/profile", icon: User, roles: ["farmer", "customer", "admin"] },
    { title: "Settings", titleBn: "সেটিংস", url: "/dashboard/settings", icon: Settings, roles: ["farmer", "customer", "admin"] },
    { title: "Backup", titleBn: "ব্যাকআপ", url: "/dashboard/backup", icon: CloudUpload, roles: ["farmer", "admin"] },
  ],
};

const allGroups = [cmsGroup, ecommerceGroup, settingsGroup];

// --- Nav Item with Tooltip ---
function NavItem({ to, icon: Icon, label, isActive, activeClass, iconColorClass }: {
  to: string; icon: LucideIcon; label: string; isActive: boolean; activeClass: string; iconColorClass: string;
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
              : "text-cyan-200/90 hover:bg-white/10 hover:text-white hover:translate-x-0.5"
          )}
        >
          <div className={cn(
            "p-1.5 rounded-lg shrink-0 transition-all duration-200",
            isActive ? "bg-white/20" : "bg-cyan-800/40"
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

// --- Collapsible Menu Group ---
function SidebarMenuGroupComponent({ group, currentPath, userRole, isBn }: {
  group: MenuGroup; currentPath: string; userRole: string | null; isBn: boolean;
}) {
  const visibleItems = group.items.filter(i => !userRole || i.roles.includes(userRole));
  const hasActive = visibleItems.some(i => currentPath === i.url);
  const [open, setOpen] = useState(hasActive);

  useEffect(() => { if (hasActive) setOpen(true); }, [hasActive]);

  if (visibleItems.length === 0) return null;
  if (!userRole || !group.roles.includes(userRole)) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <CollapsibleTrigger className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-cyan-300 hover:bg-white/8 hover:text-white transition-all duration-200 cursor-pointer">
            <div className={cn("p-1.5 rounded-lg transition-all duration-200 shrink-0", hasActive ? "bg-white/20" : "bg-cyan-800/40")}>
              <group.icon className={cn("h-4 w-4 transition-colors", hasActive ? "text-white" : group.iconColor)} />
            </div>
            <span className="font-semibold text-sm flex-1 text-left group-data-[collapsible=icon]:hidden">
              {isBn ? group.labelBn : group.label}
            </span>
            <ChevronDown className={cn("h-3.5 w-3.5 text-cyan-400 transition-transform duration-300 group-data-[collapsible=icon]:hidden", open && "rotate-180")} />
          </CollapsibleTrigger>
        </TooltipTrigger>
        <TooltipContent side="right" className="group-data-[collapsible=open]:hidden">
          {isBn ? group.labelBn : group.label}
        </TooltipContent>
      </Tooltip>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200">
        <div className="ml-4 pl-3 border-l-2 border-white/10 mt-1 space-y-0.5">
          {visibleItems.map(item => {
            const isActive = currentPath === item.url;
            return (
              <Tooltip key={item.url}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.url}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                      isActive
                        ? "bg-white/15 text-white font-medium shadow-sm"
                        : "text-cyan-300/80 hover:bg-white/5 hover:text-white hover:translate-x-0.5"
                    )}
                  >
                    <item.icon className={cn("h-3.5 w-3.5 shrink-0 transition-colors", isActive ? "text-white" : "text-cyan-400/70")} />
                    <span className="group-data-[collapsible=icon]:hidden truncate">{isBn ? item.titleBn : item.title}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="group-data-[collapsible=open]:hidden">
                  {isBn ? item.titleBn : item.title}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// --- Mobile Menu Item ---
function MobileMenuItem({ to, icon: Icon, label, isActive, activeClass, iconColor, onClick }: {
  to: string; icon: LucideIcon; label: string; isActive: boolean; activeClass: string; iconColor: string; onClick?: () => void;
}) {
  return (
    <Link to={to} onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
        isActive ? `${activeClass} text-white shadow-lg` : "text-slate-300 hover:bg-white/10 hover:text-white"
      )}
    >
      <div className={cn("p-2 rounded-lg transition-all shrink-0", isActive ? "bg-white/20" : "bg-slate-700/50")}>
        <Icon className={cn("h-5 w-5", isActive ? "text-white" : iconColor)} />
      </div>
      <span className="font-medium">{label}</span>
    </Link>
  );
}

// --- Mobile Collapsible Group ---
function MobileMenuGroup({ group, currentPath, userRole, isBn, onClose }: {
  group: MenuGroup; currentPath: string; userRole: string | null; isBn: boolean; onClose: () => void;
}) {
  const visibleItems = group.items.filter(i => !userRole || i.roles.includes(userRole));
  const hasActive = visibleItems.some(i => currentPath === i.url);
  const [open, setOpen] = useState(hasActive);

  if (visibleItems.length === 0 || (!userRole || !group.roles.includes(userRole))) return null;

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
          {visibleItems.map(item => {
            const isActive = currentPath === item.url;
            return (
              <Link key={item.url} to={item.url} onClick={onClose}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                  isActive ? "bg-white/15 text-white font-medium" : "text-cyan-300/80 hover:bg-white/5 hover:text-white"
                )}
              >
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

// --- Main Layout ---
interface DashboardLayoutProps { children: ReactNode; }

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isCustomer, userRole, user, profile, signOut, switchToFarmer } = useAuth();
  const { t, language } = useLanguage();
  const isBn = language === "bn";

  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

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

  // Current page title
  const allMenuItems = allGroups.flatMap(g => g.items);
  const currentTitle = allMenuItems.find(i => i.url === location.pathname)
    ? (isBn
      ? allMenuItems.find(i => i.url === location.pathname)!.titleBn
      : allMenuItems.find(i => i.url === location.pathname)!.title)
    : (location.pathname === "/dashboard" ? t.dashboard : "Dashboard");

  const roleLabel = userRole === "customer"
    ? (isBn ? "কাস্টমার ড্যাশবোর্ড" : "Customer Dashboard")
    : (isBn ? "কৃষক ড্যাশবোর্ড" : "Farmer Dashboard");

  return (
    <TooltipProvider delayDuration={300}>
      <SidebarProvider defaultOpen={false}>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-cyan-900 via-blue-900 to-slate-900 relative overflow-hidden">
          <AnimatedBackground />

          {/* === Desktop Sidebar === */}
          <Sidebar collapsible="icon" className="border-r-0 relative z-10 hidden md:flex">
            <div className="h-full bg-gradient-to-b from-slate-900/95 via-cyan-950/95 to-slate-900/95 backdrop-blur-md flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/25 shrink-0">
                    <Fish className="h-5 w-5 text-white" />
                  </div>
                  <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
                    <h1 className="font-bold text-white text-base leading-tight truncate">
                      {isBn ? "মাছ চাষ" : "Fish Farming"}
                    </h1>
                    <p className="text-[10px] text-cyan-300/80">{roleLabel}</p>
                  </div>
                </div>
              </div>

              <SidebarContent className="px-2 py-3 flex flex-col flex-1 overflow-hidden">
                <SidebarGroup className="flex-1 overflow-y-auto overflow-x-hidden space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {/* 1. ড্যাশবোর্ড */}
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.pathname === "/dashboard"} tooltip={t.dashboard}>
                          <NavItem to="/dashboard" icon={LayoutDashboard} label={t.dashboard}
                            isActive={location.pathname === "/dashboard"}
                            activeClass="bg-gradient-to-r from-purple-500 to-purple-600"
                            iconColorClass="text-purple-400" />
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>

                  <div className="h-px bg-white/8 mx-2 my-1.5" />

                  {/* 2. CMS */}
                  <SidebarMenuGroupComponent group={cmsGroup} currentPath={location.pathname} userRole={userRole} isBn={isBn} />

                  {/* 3. E-Commerce */}
                  <SidebarMenuGroupComponent group={ecommerceGroup} currentPath={location.pathname} userRole={userRole} isBn={isBn} />

                  {/* 4. POS - Admin only */}
                  {isAdmin && (
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild isActive={location.pathname.startsWith("/pos")} tooltip="POS">
                            <NavItem to="/pos" icon={MonitorSmartphone} label={isBn ? "POS সিস্টেম" : "POS System"}
                              isActive={location.pathname.startsWith("/pos")}
                              activeClass="bg-gradient-to-r from-teal-500 to-emerald-600"
                              iconColorClass="text-teal-400" />
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  )}

                  {/* 5. Report */}
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.pathname === "/dashboard/reports"} tooltip={t.reports}>
                          <NavItem to="/dashboard/reports" icon={BarChart3} label={t.reports}
                            isActive={location.pathname === "/dashboard/reports"}
                            activeClass="bg-gradient-to-r from-amber-500 to-orange-600"
                            iconColorClass="text-amber-400" />
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>

                  <div className="h-px bg-white/8 mx-2 my-1.5" />

                  {/* 6. Settings */}
                  <SidebarMenuGroupComponent group={settingsGroup} currentPath={location.pathname} userRole={userRole} isBn={isBn} />
                </SidebarGroup>

                {/* Footer links */}
                <div className="pt-3 border-t border-white/10 mt-auto space-y-1">
                  {/* Admin Panel */}
                  {isAdmin && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link to="/admin"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-violet-300 hover:bg-violet-500/20 hover:text-white transition-all duration-200 hover:translate-x-0.5">
                          <div className="p-1.5 rounded-lg bg-violet-600/50 shrink-0">
                            <Shield className="h-4 w-4 text-violet-300" />
                          </div>
                          <span className="font-medium text-sm group-data-[collapsible=icon]:hidden truncate">{t.adminPanel}</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="group-data-[collapsible=open]:hidden">{t.adminPanel}</TooltipContent>
                    </Tooltip>
                  )}

                  {/* Switch to Farmer */}
                  {isCustomer && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={handleSwitchToFarmer} disabled={isSwitching}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-emerald-300 hover:bg-emerald-500/20 hover:text-white transition-all w-full">
                          <div className="p-1.5 rounded-lg bg-emerald-600/50 shrink-0">
                            <RefreshCw className={cn("h-4 w-4 text-emerald-300", isSwitching && "animate-spin")} />
                          </div>
                          <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">
                            {isBn ? "কৃষক হিসেবে যোগ দিন" : "Switch to Farmer"}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="group-data-[collapsible=open]:hidden">
                        {isBn ? "কৃষক হিসেবে যোগ দিন" : "Switch to Farmer"}
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Home */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link to="/"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-cyan-300 hover:bg-white/10 hover:text-white transition-all duration-200 hover:translate-x-0.5">
                        <div className="p-1.5 rounded-lg bg-cyan-800/40 shrink-0">
                          <Home className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-sm group-data-[collapsible=icon]:hidden truncate">
                          {isBn ? "হোম পেজে ফিরুন" : "Back to Home"}
                        </span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="group-data-[collapsible=open]:hidden">
                      {isBn ? "হোম পেজে ফিরুন" : "Back to Home"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </SidebarContent>
            </div>
          </Sidebar>

          {/* === Main Content === */}
          <main className="flex-1 overflow-auto relative z-10">
            {/* Top Bar */}
            <div className="p-3 md:p-4 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between sticky top-0 z-20">
              <div className="flex items-center gap-2 md:gap-4">
                {/* Mobile Menu */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild className="md:hidden">
                    <button className="p-2 rounded-lg hover:bg-accent transition-colors">
                      <Menu className="h-5 w-5 text-foreground" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px] p-0 bg-gradient-to-b from-slate-900 via-cyan-950 to-slate-900 border-r-0">
                    {/* Mobile Header */}
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/30">
                            <Fish className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h1 className="font-bold text-white text-lg">{isBn ? "মাছ চাষ" : "Fish Farming"}</h1>
                            <p className="text-xs text-slate-400">{roleLabel}</p>
                          </div>
                        </div>
                        <SheetClose asChild>
                          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                            <X className="h-5 w-5 text-slate-400" />
                          </button>
                        </SheetClose>
                      </div>
                    </div>

                    {/* Mobile Menu Items */}
                    <div className="px-3 py-4 overflow-y-auto max-h-[calc(100vh-180px)] space-y-1">
                      {/* 1. Dashboard */}
                      <MobileMenuItem to="/dashboard" icon={LayoutDashboard} label={t.dashboard}
                        isActive={location.pathname === "/dashboard"}
                        activeClass="bg-gradient-to-r from-purple-500 to-purple-600"
                        iconColor="text-purple-500"
                        onClick={() => setMobileMenuOpen(false)} />

                      <div className="h-px bg-white/10 mx-2 my-2" />

                      {/* 2. CMS */}
                      <MobileMenuGroup group={cmsGroup} currentPath={location.pathname} userRole={userRole} isBn={isBn} onClose={() => setMobileMenuOpen(false)} />

                      {/* 3. E-Commerce */}
                      <MobileMenuGroup group={ecommerceGroup} currentPath={location.pathname} userRole={userRole} isBn={isBn} onClose={() => setMobileMenuOpen(false)} />

                      {/* 4. POS */}
                      {isAdmin && (
                        <MobileMenuItem to="/pos" icon={MonitorSmartphone} label={isBn ? "POS সিস্টেম" : "POS System"}
                          isActive={location.pathname.startsWith("/pos")}
                          activeClass="bg-gradient-to-r from-teal-500 to-emerald-600"
                          iconColor="text-teal-500"
                          onClick={() => setMobileMenuOpen(false)} />
                      )}

                      {/* 5. Report */}
                      <MobileMenuItem to="/dashboard/reports" icon={BarChart3} label={t.reports}
                        isActive={location.pathname === "/dashboard/reports"}
                        activeClass="bg-gradient-to-r from-amber-500 to-orange-600"
                        iconColor="text-amber-500"
                        onClick={() => setMobileMenuOpen(false)} />

                      <div className="h-px bg-white/10 mx-2 my-2" />

                      {/* 6. Settings */}
                      <MobileMenuGroup group={settingsGroup} currentPath={location.pathname} userRole={userRole} isBn={isBn} onClose={() => setMobileMenuOpen(false)} />

                      {/* Admin Panel */}
                      {isAdmin && (
                        <div className="pt-4 mt-4 border-t border-white/10">
                          <MobileMenuItem to="/admin" icon={Shield} label={t.adminPanel}
                            isActive={false} activeClass="" iconColor="text-violet-400"
                            onClick={() => setMobileMenuOpen(false)} />
                        </div>
                      )}

                      {/* Switch to Farmer */}
                      {isCustomer && (
                        <div className="pt-4 mt-4 border-t border-white/10">
                          <button onClick={() => { setMobileMenuOpen(false); handleSwitchToFarmer(); }}
                            disabled={isSwitching}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-300 hover:bg-emerald-500/20 hover:text-white transition-all w-full">
                            <div className="p-2 rounded-lg bg-emerald-600/50 shrink-0">
                              <RefreshCw className={cn("h-5 w-5 text-emerald-300", isSwitching && "animate-spin")} />
                            </div>
                            <span className="font-medium">{isBn ? "কৃষক হিসেবে যোগ দিন" : "Switch to Farmer"}</span>
                          </button>
                        </div>
                      )}

                      {/* Home */}
                      <div className="pt-4 mt-4 border-t border-white/10">
                        <MobileMenuItem to="/" icon={Home} label={isBn ? "হোম পেজে ফিরুন" : "Back to Home"}
                          isActive={false} activeClass="" iconColor="text-slate-400"
                          onClick={() => setMobileMenuOpen(false)} />
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Desktop Sidebar Trigger */}
                <SidebarTrigger className="text-foreground hidden md:flex hover:bg-accent/50 transition-colors rounded-lg" />
                <div className="h-6 w-px bg-border hidden md:block" />
                <span className="text-xs md:text-sm font-medium text-muted-foreground line-clamp-1">{currentTitle}</span>
              </div>

              {/* Profile Dropdown */}
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
                    <Link to="/dashboard/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" /><span>{t.profile}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/dashboard/settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" /><span>{t.settings}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /><span>{t.logout}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Page Content */}
            <div className="p-4 md:p-6 bg-background/80 backdrop-blur-sm min-h-[calc(100vh-57px)] md:min-h-[calc(100vh-65px)] md:rounded-tl-2xl">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
