import { ReactNode, useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
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
  ChevronDown
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, user, signOut } = useAuth();
  const { t, language } = useLanguage();
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  const menuItems = [
    { 
      title: t.dashboard, 
      url: "/dashboard", 
      icon: LayoutDashboard,
      color: "bg-gradient-to-r from-purple-500 to-purple-600",
      iconColor: "text-purple-500"
    },
    { 
      title: t.income, 
      url: "/dashboard/income", 
      icon: TrendingUp,
      color: "bg-gradient-to-r from-emerald-500 to-green-600",
      iconColor: "text-emerald-500"
    },
    { 
      title: t.expense, 
      url: "/dashboard/expense", 
      icon: TrendingDown,
      color: "bg-gradient-to-r from-rose-500 to-red-600",
      iconColor: "text-rose-500"
    },
    { 
      title: t.myPond, 
      url: "/dashboard/my-pond", 
      icon: Waves,
      color: "bg-gradient-to-r from-blue-500 to-cyan-600",
      iconColor: "text-blue-500"
    },
    { 
      title: t.reports, 
      url: "/dashboard/reports", 
      icon: FileText,
      color: "bg-gradient-to-r from-amber-500 to-orange-600",
      iconColor: "text-amber-500"
    },
    { 
      title: t.backup, 
      url: "/dashboard/backup", 
      icon: CloudUpload,
      color: "bg-gradient-to-r from-indigo-500 to-violet-600",
      iconColor: "text-indigo-500"
    },
    { 
      title: t.profile, 
      url: "/dashboard/profile", 
      icon: User,
      color: "bg-gradient-to-r from-pink-500 to-rose-600",
      iconColor: "text-pink-500"
    },
    { 
      title: t.settings, 
      url: "/dashboard/settings", 
      icon: Settings,
      color: "bg-gradient-to-r from-slate-500 to-gray-600",
      iconColor: "text-slate-500"
    },
  ];

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        if (data.full_name) setUserName(data.full_name);
        if (data.avatar_url) setUserAvatar(data.avatar_url);
      }
    };
    
    fetchUserProfile();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-cyan-900 via-blue-900 to-slate-900 relative overflow-hidden">
        <AnimatedBackground />
        <Sidebar collapsible="icon" className="border-r-0 relative z-10">
          <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <div className="p-3 sm:p-5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/30">
                  <Fish className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="group-data-[collapsible=icon]:hidden">
                  <h1 className="font-bold text-white text-base sm:text-lg">{language === "bn" ? "মাছ চাষ" : "Fish Farming"}</h1>
                  <p className="text-[10px] sm:text-xs text-slate-400">{language === "bn" ? "কৃষক ড্যাশবোর্ড" : "Farmer Dashboard"}</p>
                </div>
              </div>
            </div>

            <SidebarContent className="px-2 sm:px-3 py-3 sm:py-4 flex flex-col flex-1 overflow-y-auto">
              <SidebarGroup className="flex-1">
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1 sm:space-y-2">
                    {menuItems.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                            <Link 
                              to={item.url} 
                              className={`
                                flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300
                                ${isActive 
                                  ? `${item.color} text-white shadow-lg` 
                                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                }
                              `}
                            >
                              <div className={`
                                p-1.5 sm:p-2 rounded-lg transition-all shrink-0
                                ${isActive 
                                  ? 'bg-white/20' 
                                  : `bg-slate-700/50`
                                }
                              `}>
                                <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${isActive ? 'text-white' : item.iconColor}`} />
                              </div>
                              <span className="font-medium text-sm sm:text-base group-data-[collapsible=icon]:hidden">{item.title}</span>
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
                <div className="pt-3 sm:pt-4 border-t border-white/10">
                  <Link 
                    to="/admin" 
                    className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-xl text-violet-300 hover:bg-violet-500/20 hover:text-white transition-all"
                  >
                    <div className="p-1.5 sm:p-2 rounded-lg bg-violet-600/50 shrink-0">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-violet-300" />
                    </div>
                    <span className="font-medium text-sm sm:text-base group-data-[collapsible=icon]:hidden">{t.adminPanel}</span>
                  </Link>
                </div>
              )}

              {/* Home Link at Bottom */}
              <div className="pt-3 sm:pt-4 border-t border-white/10 mt-auto">
                <Link 
                  to="/" 
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                >
                  <div className="p-1.5 sm:p-2 rounded-lg bg-slate-700/50 shrink-0">
                    <Home className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span className="font-medium text-sm sm:text-base group-data-[collapsible=icon]:hidden">{language === "bn" ? "হোম পেজে ফিরুন" : "Back to Home"}</span>
                </Link>
              </div>
            </SidebarContent>
          </div>
        </Sidebar>

        <main className="flex-1 overflow-auto relative z-10">
          <div className="p-4 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-foreground" />
              <div className="h-6 w-px bg-border" />
              <span className="text-sm text-muted-foreground">
                {menuItems.find(item => item.url === location.pathname)?.title || 'ড্যাশবোর্ড'}
              </span>
            </div>
            
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors outline-none">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={userAvatar || undefined} alt={userName} />
                  <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-sm font-medium">
                    {userName.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground hidden sm:inline">{userName || (language === "bn" ? "ব্যবহারকারী" : "User")}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
          <div className="p-6 bg-background/80 backdrop-blur-sm min-h-[calc(100vh-65px)] rounded-tl-2xl">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
