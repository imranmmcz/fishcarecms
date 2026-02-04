import { ReactNode, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { useAuth } from "@/contexts/AuthContext";
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
  LayoutDashboard, 
  Users, 
  Settings, 
  BarChart3,
  Home,
  Shield,
  Loader2,
  User,
  Package,
  Megaphone,
  Layout,
  TrendingUp,
  Database,
  ShoppingCart,
  Warehouse,
  UserCheck,
  Building2
} from "lucide-react";

const menuItems = [
  { 
    title: "ড্যাশবোর্ড", 
    url: "/admin", 
    icon: LayoutDashboard,
    color: "bg-gradient-to-r from-violet-500 to-purple-600",
    iconColor: "text-violet-500"
  },
  { 
    title: "পণ্য ব্যবস্থাপনা", 
    url: "/admin/products", 
    icon: Package,
    color: "bg-gradient-to-r from-teal-500 to-cyan-600",
    iconColor: "text-teal-500"
  },
  { 
    title: "বাজার দর", 
    url: "/admin/market-prices", 
    icon: TrendingUp,
    color: "bg-gradient-to-r from-orange-500 to-amber-600",
    iconColor: "text-orange-500"
  },
  { 
    title: "অর্ডার ম্যানেজমেন্ট", 
    url: "/admin/orders", 
    icon: ShoppingCart,
    color: "bg-gradient-to-r from-green-500 to-emerald-600",
    iconColor: "text-green-500"
  },
  { 
    title: "ইনভেন্টরি", 
    url: "/admin/inventory", 
    icon: Warehouse,
    color: "bg-gradient-to-r from-sky-500 to-blue-600",
    iconColor: "text-sky-500"
  },
  { 
    title: "কাস্টমার", 
    url: "/admin/customers", 
    icon: UserCheck,
    color: "bg-gradient-to-r from-lime-500 to-green-600",
    iconColor: "text-lime-500"
  },
  { 
    title: "সাপ্লায়ার", 
    url: "/admin/suppliers", 
    icon: Building2,
    color: "bg-gradient-to-r from-fuchsia-500 to-pink-600",
    iconColor: "text-fuchsia-500"
  },
  { 
    title: "ব্যবহারকারী", 
    url: "/admin/users",
    icon: Users,
    color: "bg-gradient-to-r from-blue-500 to-cyan-600",
    iconColor: "text-blue-500"
  },
  { 
    title: "রিপোর্ট", 
    url: "/admin/reports", 
    icon: BarChart3,
    color: "bg-gradient-to-r from-emerald-500 to-green-600",
    iconColor: "text-emerald-500"
  },
  { 
    title: "বিজ্ঞাপন", 
    url: "/admin/ads", 
    icon: Megaphone,
    color: "bg-gradient-to-r from-rose-500 to-pink-600",
    iconColor: "text-rose-500"
  },
  { 
    title: "পেজ বিল্ডার", 
    url: "/admin/page-builder", 
    icon: Layout,
    color: "bg-gradient-to-r from-indigo-500 to-blue-600",
    iconColor: "text-indigo-500"
  },
  { 
    title: "সেটিংস", 
    url: "/admin/settings", 
    icon: Settings,
    color: "bg-gradient-to-r from-amber-500 to-orange-600",
    iconColor: "text-amber-500"
  },
  { 
    title: "ডাটাবেজ এক্সপোর্ট", 
    url: "/admin/database-export", 
    icon: Database,
    color: "bg-gradient-to-r from-cyan-500 to-teal-600",
    iconColor: "text-cyan-500"
  },
  { 
    title: "প্রোফাইল", 
    url: "/admin/profile", 
    icon: User,
    color: "bg-gradient-to-r from-pink-500 to-rose-600",
    iconColor: "text-pink-500"
  },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    } else if (!isLoading && user && !isAdmin) {
      navigate("/");
    }
  }, [user, isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10 text-white">লোড হচ্ছে...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-violet-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <AnimatedBackground />
        <Sidebar collapsible="icon" className="border-r-0 relative z-10">
          <div className="h-full bg-gradient-to-b from-violet-950 via-purple-900 to-violet-950">
            {/* Header */}
            <div className="p-3 sm:p-5 border-b border-white/10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 bg-gradient-to-br from-violet-400 to-purple-600 rounded-xl shadow-lg shadow-violet-500/30">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="group-data-[collapsible=icon]:hidden">
                  <h1 className="font-bold text-white text-base sm:text-lg">অ্যাডমিন</h1>
                  <p className="text-[10px] sm:text-xs text-violet-300">ম্যানেজমেন্ট প্যানেল</p>
                </div>
              </div>
            </div>

            <SidebarContent className="px-2 sm:px-3 py-3 sm:py-4 flex flex-col h-[calc(100%-80px)]">
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
                                  : 'text-violet-200 hover:bg-white/10 hover:text-white'
                                }
                              `}
                            >
                              <div className={`
                                p-1.5 sm:p-2 rounded-lg transition-all shrink-0
                                ${isActive 
                                  ? 'bg-white/20' 
                                  : `bg-violet-800/50`
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

              {/* Home Link at Bottom */}
              <div className="pt-3 sm:pt-4 border-t border-white/10 mt-auto">
                <Link 
                  to="/" 
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-xl text-violet-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  <div className="p-1.5 sm:p-2 rounded-lg bg-violet-800/50 shrink-0">
                    <Home className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span className="font-medium text-sm sm:text-base group-data-[collapsible=icon]:hidden">হোম পেজে ফিরুন</span>
                </Link>
              </div>
            </SidebarContent>
          </div>
        </Sidebar>

        <main className="flex-1 overflow-auto relative z-10">
          <div className="p-4 border-b bg-card/80 backdrop-blur-sm flex items-center gap-4">
            <SidebarTrigger className="text-foreground" />
            <div className="h-6 w-px bg-border" />
            <span className="text-sm text-muted-foreground">
              {menuItems.find(item => item.url === location.pathname)?.title || 'অ্যাডমিন ড্যাশবোর্ড'}
            </span>
          </div>
          <div className="p-6 bg-background/80 backdrop-blur-sm min-h-[calc(100vh-65px)] rounded-tl-2xl">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
