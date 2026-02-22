import { ReactNode, useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  Waves, 
  FileText,
  Home,
  Fish,
  CloudUpload,
  User,
  Settings,
  Shield,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Package,
  RefreshCw
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isFarmer, isCustomer, userRole, user, profile, signOut, switchToFarmer } = useAuth();
  const { t, language } = useLanguage();
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Build menu items based on role
  const baseMenuItems = [
    { 
      title: t.dashboard, 
      url: "/dashboard", 
      icon: LayoutDashboard,
      color: "bg-gradient-to-r from-purple-500 to-purple-600",
      iconColor: "text-purple-500",
      roles: ['farmer', 'customer', 'admin'] as string[],
    },
    { 
      title: language === "bn" ? "আমার অর্ডার" : "My Orders", 
      url: "/dashboard/orders", 
      icon: Package,
      color: "bg-gradient-to-r from-teal-500 to-emerald-600",
      iconColor: "text-teal-500",
      roles: ['farmer', 'customer', 'admin'] as string[],
    },
    { 
      title: t.income, 
      url: "/dashboard/income", 
      icon: TrendingUp,
      color: "bg-gradient-to-r from-emerald-500 to-green-600",
      iconColor: "text-emerald-500",
      roles: ['farmer', 'admin'] as string[],
    },
    { 
      title: t.expense, 
      url: "/dashboard/expense", 
      icon: TrendingDown,
      color: "bg-gradient-to-r from-rose-500 to-red-600",
      iconColor: "text-rose-500",
      roles: ['farmer', 'admin'] as string[],
    },
    { 
      title: t.myPond, 
      url: "/dashboard/my-pond", 
      icon: Waves,
      color: "bg-gradient-to-r from-blue-500 to-cyan-600",
      iconColor: "text-blue-500",
      roles: ['farmer', 'admin'] as string[],
    },
    { 
      title: t.reports, 
      url: "/dashboard/reports", 
      icon: FileText,
      color: "bg-gradient-to-r from-amber-500 to-orange-600",
      iconColor: "text-amber-500",
      roles: ['farmer', 'admin'] as string[],
    },
    { 
      title: t.backup, 
      url: "/dashboard/backup", 
      icon: CloudUpload,
      color: "bg-gradient-to-r from-indigo-500 to-violet-600",
      iconColor: "text-indigo-500",
      roles: ['farmer', 'admin'] as string[],
    },
    { 
      title: t.profile, 
      url: "/dashboard/profile", 
      icon: User,
      color: "bg-gradient-to-r from-pink-500 to-rose-600",
      iconColor: "text-pink-500",
      roles: ['farmer', 'customer', 'admin'] as string[],
    },
    { 
      title: t.settings, 
      url: "/dashboard/settings", 
      icon: Settings,
      color: "bg-gradient-to-r from-slate-500 to-gray-600",
      iconColor: "text-slate-500",
      roles: ['farmer', 'customer', 'admin'] as string[],
    },
  ];

  const menuItems = baseMenuItems.filter(item => 
    !userRole || item.roles.includes(userRole)
  );

  const handleSwitchToFarmer = async () => {
    setIsSwitching(true);
    const success = await switchToFarmer();
    setIsSwitching(false);
    if (success) {
      const msg = language === "bn" ? "আপনি এখন কৃষক হিসেবে নিবন্ধিত!" : "You are now registered as a Farmer!";
      navigate("/dashboard");
      window.location.reload();
    }
  };

  // Use profile data from Supabase context
  useEffect(() => {
    if (profile) {
      setUserName(profile.full_name || user?.email?.split('@')[0] || '');
      setUserAvatar(profile.avatar_url || null);
    } else if (user) {
      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
      setUserAvatar(null);
    }
  }, [user, profile]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // Menu item component for reusability
  const MenuItemLink = ({ item, onClick }: { item: typeof menuItems[0]; onClick?: () => void }) => {
    const isActive = location.pathname === item.url;
    return (
      <Link 
        to={item.url} 
        onClick={onClick}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
          ${isActive 
            ? `${item.color} text-white shadow-lg` 
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
          }
        `}
      >
        <div className={`
          p-2 rounded-lg transition-all shrink-0
          ${isActive 
            ? 'bg-white/20' 
            : 'bg-slate-700/50'
          }
        `}>
          <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : item.iconColor}`} />
        </div>
        <span className="font-medium">{item.title}</span>
      </Link>
    );
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-cyan-900 via-blue-900 to-slate-900 relative overflow-hidden">
        <AnimatedBackground />
        
        {/* Desktop Sidebar */}
        <Sidebar collapsible="icon" className="border-r-0 relative z-10 hidden md:flex">
          <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <div className="p-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/30">
                  <Fish className="h-6 w-6 text-white" />
                </div>
                <div className="group-data-[collapsible=icon]:hidden">
                  <h1 className="font-bold text-white text-lg">{language === "bn" ? "মাছ চাষ" : "Fish Farming"}</h1>
                  <p className="text-xs text-slate-400">
                    {userRole === 'customer' 
                      ? (language === "bn" ? "কাস্টমার ড্যাশবোর্ড" : "Customer Dashboard")
                      : (language === "bn" ? "কৃষক ড্যাশবোর্ড" : "Farmer Dashboard")}
                  </p>
                </div>
              </div>
            </div>

            <SidebarContent className="px-3 py-4">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-2">
                    {menuItems.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                            <Link 
                              to={item.url} 
                              className={`
                                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                                ${isActive 
                                  ? `${item.color} text-white shadow-lg` 
                                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                }
                              `}
                            >
                              <div className={`
                                p-2 rounded-lg transition-all shrink-0
                                ${isActive 
                                  ? 'bg-white/20' 
                                  : `bg-slate-700/50`
                                }
                              `}>
                                <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : item.iconColor}`} />
                              </div>
                              <span className="font-medium group-data-[collapsible=icon]:hidden">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {/* Admin Panel Link - Only for Admin Users */}
              {isAdmin && (
                <div className="pt-4 border-t border-white/10">
                  <Link 
                    to="/admin" 
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-violet-300 hover:bg-violet-500/20 hover:text-white transition-all"
                  >
                    <div className="p-2 rounded-lg bg-violet-600/50 shrink-0">
                      <Shield className="h-5 w-5 text-violet-300" />
                    </div>
                    <span className="font-medium group-data-[collapsible=icon]:hidden">{t.adminPanel}</span>
                  </Link>
                </div>
              )}

              {/* Switch to Farmer - Only for Customer Users */}
              {isCustomer && (
                <div className="pt-4 border-t border-white/10">
                  <button 
                    onClick={handleSwitchToFarmer}
                    disabled={isSwitching}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-300 hover:bg-emerald-500/20 hover:text-white transition-all w-full"
                  >
                    <div className="p-2 rounded-lg bg-emerald-600/50 shrink-0">
                      <RefreshCw className={`h-5 w-5 text-emerald-300 ${isSwitching ? 'animate-spin' : ''}`} />
                    </div>
                    <span className="font-medium group-data-[collapsible=icon]:hidden">
                      {language === "bn" ? "কৃষক হিসেবে যোগ দিন" : "Switch to Farmer"}
                    </span>
                  </button>
                </div>
              )}

              {/* Home Link at Bottom */}
              <div className="pt-4 border-t border-white/10">
                <Link 
                  to="/" 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                >
                  <div className="p-2 rounded-lg bg-slate-700/50 shrink-0">
                    <Home className="h-5 w-5" />
                  </div>
                  <span className="font-medium group-data-[collapsible=icon]:hidden">{language === "bn" ? "হোম পেজে ফিরুন" : "Back to Home"}</span>
                </Link>
              </div>
            </SidebarContent>
          </div>
        </Sidebar>

        <main className="flex-1 overflow-auto relative z-10">
          <div className="p-3 md:p-4 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-2 md:gap-4">
              {/* Mobile Menu Trigger */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <button className="p-2 rounded-lg hover:bg-accent transition-colors">
                    <Menu className="h-5 w-5 text-foreground" />
                  </button>
                </SheetTrigger>
                <SheetContent 
                  side="left" 
                  className="w-[280px] p-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r-0"
                >
                  {/* Mobile Menu Header */}
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/30">
                          <Fish className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h1 className="font-bold text-white text-lg">{language === "bn" ? "মাছ চাষ" : "Fish Farming"}</h1>
                          <p className="text-xs text-slate-400">
                            {userRole === 'customer' 
                              ? (language === "bn" ? "কাস্টমার ড্যাশবোর্ড" : "Customer Dashboard")
                              : (language === "bn" ? "কৃষক ড্যাশবোর্ড" : "Farmer Dashboard")}
                          </p>
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
                  <div className="px-3 py-4 overflow-y-auto max-h-[calc(100vh-180px)]">
                    <div className="space-y-1.5">
                      {menuItems.map((item) => (
                        <MenuItemLink 
                          key={item.title} 
                          item={item} 
                          onClick={() => setMobileMenuOpen(false)}
                        />
                      ))}
                    </div>

                    {/* Admin Panel Link */}
                    {isAdmin && (
                      <div className="pt-4 mt-4 border-t border-white/10">
                        <Link 
                          to="/admin" 
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-violet-300 hover:bg-violet-500/20 hover:text-white transition-all"
                        >
                          <div className="p-2 rounded-lg bg-violet-600/50 shrink-0">
                            <Shield className="h-5 w-5 text-violet-300" />
                          </div>
                          <span className="font-medium">{t.adminPanel}</span>
                        </Link>
                      </div>
                    )}

                    {/* Switch to Farmer - Customer only */}
                    {isCustomer && (
                      <div className="pt-4 mt-4 border-t border-white/10">
                        <button 
                          onClick={() => { setMobileMenuOpen(false); handleSwitchToFarmer(); }}
                          disabled={isSwitching}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-300 hover:bg-emerald-500/20 hover:text-white transition-all w-full"
                        >
                          <div className="p-2 rounded-lg bg-emerald-600/50 shrink-0">
                            <RefreshCw className={`h-5 w-5 text-emerald-300 ${isSwitching ? 'animate-spin' : ''}`} />
                          </div>
                          <span className="font-medium">
                            {language === "bn" ? "কৃষক হিসেবে যোগ দিন" : "Switch to Farmer"}
                          </span>
                        </button>
                      </div>
                    )}

                    {/* Home Link */}
                    <div className="pt-4 mt-4 border-t border-white/10">
                      <Link 
                        to="/" 
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                      >
                        <div className="p-2 rounded-lg bg-slate-700/50 shrink-0">
                          <Home className="h-5 w-5" />
                        </div>
                        <span className="font-medium">{language === "bn" ? "হোম পেজে ফিরুন" : "Back to Home"}</span>
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              
              {/* Desktop Sidebar Trigger */}
              <SidebarTrigger className="text-foreground hidden md:flex" />
              
              <div className="h-6 w-px bg-border hidden md:block" />
              <span className="text-xs md:text-sm text-muted-foreground line-clamp-1">
                {menuItems.find(item => item.url === location.pathname)?.title || 'ড্যাশবোর্ড'}
              </span>
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
                <span className="text-xs md:text-sm font-medium text-foreground hidden sm:inline max-w-24 truncate">{userName || (language === "bn" ? "ব্যবহারকারী" : "User")}</span>
                <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover border border-border shadow-lg z-50">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium text-foreground">{userName || (language === "bn" ? "ব্যবহারকারী" : "User")}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/dashboard/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{t.profile}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/dashboard/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>{t.settings}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>{t.logout}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="p-4 md:p-6 bg-background/80 backdrop-blur-sm min-h-[calc(100vh-57px)] md:min-h-[calc(100vh-65px)] md:rounded-tl-2xl">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}