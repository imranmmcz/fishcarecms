import { ReactNode, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
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
  User
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
    title: "সেটিংস", 
    url: "/admin/settings", 
    icon: Settings,
    color: "bg-gradient-to-r from-amber-500 to-orange-600",
    iconColor: "text-amber-500"
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar className="border-r-0">
          <div className="h-full bg-gradient-to-b from-violet-950 via-purple-900 to-violet-950">
            {/* Header */}
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-violet-400 to-purple-600 rounded-xl shadow-lg shadow-violet-500/30">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-white text-lg">অ্যাডমিন</h1>
                  <p className="text-xs text-violet-300">ম্যানেজমেন্ট প্যানেল</p>
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
                          <SidebarMenuButton asChild isActive={isActive}>
                            <Link 
                              to={item.url} 
                              className={`
                                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                                ${isActive 
                                  ? `${item.color} text-white shadow-lg` 
                                  : 'text-violet-200 hover:bg-white/10 hover:text-white'
                                }
                              `}
                            >
                              <div className={`
                                p-2 rounded-lg transition-all
                                ${isActive 
                                  ? 'bg-white/20' 
                                  : `bg-violet-800/50`
                                }
                              `}>
                                <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : item.iconColor}`} />
                              </div>
                              <span className="font-medium">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {/* Home Link at Bottom */}
              <div className="mt-auto pt-4 border-t border-white/10">
                <Link 
                  to="/" 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-violet-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  <div className="p-2 rounded-lg bg-violet-800/50">
                    <Home className="h-5 w-5" />
                  </div>
                  <span className="font-medium">হোম পেজে ফিরুন</span>
                </Link>
              </div>
            </SidebarContent>
          </div>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <div className="p-4 border-b bg-card flex items-center gap-4">
            <SidebarTrigger className="text-foreground" />
            <div className="h-6 w-px bg-border" />
            <span className="text-sm text-muted-foreground">
              {menuItems.find(item => item.url === location.pathname)?.title || 'অ্যাডমিন ড্যাশবোর্ড'}
            </span>
          </div>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
