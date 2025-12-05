import { ReactNode } from "react";
import { useLocation, Link } from "react-router-dom";
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
  TrendingUp, 
  TrendingDown, 
  Waves, 
  FileText,
  Home,
  Fish
} from "lucide-react";

const menuItems = [
  { 
    title: "ড্যাশবোর্ড", 
    url: "/dashboard", 
    icon: LayoutDashboard,
    color: "bg-gradient-to-r from-purple-500 to-purple-600",
    iconColor: "text-purple-500"
  },
  { 
    title: "আয়", 
    url: "/dashboard/income", 
    icon: TrendingUp,
    color: "bg-gradient-to-r from-emerald-500 to-green-600",
    iconColor: "text-emerald-500"
  },
  { 
    title: "ব্যয়", 
    url: "/dashboard/expense", 
    icon: TrendingDown,
    color: "bg-gradient-to-r from-rose-500 to-red-600",
    iconColor: "text-rose-500"
  },
  { 
    title: "আমার পুকুর", 
    url: "/dashboard/my-pond", 
    icon: Waves,
    color: "bg-gradient-to-r from-blue-500 to-cyan-600",
    iconColor: "text-blue-500"
  },
  { 
    title: "রিপোর্ট", 
    url: "/dashboard/reports", 
    icon: FileText,
    color: "bg-gradient-to-r from-amber-500 to-orange-600",
    iconColor: "text-amber-500"
  },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar className="border-r-0">
          <div className="h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/30">
                  <Fish className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-white text-lg">মাছ চাষ</h1>
                  <p className="text-xs text-slate-400">কৃষক ড্যাশবোর্ড</p>
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
                                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                }
                              `}
                            >
                              <div className={`
                                p-2 rounded-lg transition-all
                                ${isActive 
                                  ? 'bg-white/20' 
                                  : `bg-slate-700/50`
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
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                >
                  <div className="p-2 rounded-lg bg-slate-700/50">
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
              {menuItems.find(item => item.url === location.pathname)?.title || 'ড্যাশবোর্ড'}
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
