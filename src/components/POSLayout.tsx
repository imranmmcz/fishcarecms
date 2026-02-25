import { ReactNode, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, ShoppingCart, History, Clock, Home, MonitorSmartphone,
  ArrowLeft, Package, Warehouse, UserCheck, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "POS ড্যাশবোর্ড", url: "/pos", icon: LayoutDashboard },
  { title: "দ্রুত বিক্রি", url: "/pos/sell", icon: ShoppingCart },
  { title: "বিক্রি ইতিহাস", url: "/pos/history", icon: History },
  { title: "শিফট ইতিহাস", url: "/pos/shifts", icon: Clock },
  { title: "পণ্য ব্যবস্থাপনা", url: "/admin/products", icon: Package },
  { title: "ইনভেন্টরি", url: "/admin/inventory", icon: Warehouse },
  { title: "কাস্টমার", url: "/admin/customers", icon: UserCheck },
  { title: "সাপ্লায়ার", url: "/admin/suppliers", icon: Building2 },
];

interface POSLayoutProps {
  children: ReactNode;
}

export function POSLayout({ children }: POSLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, userRole } = useAuth();

  const isStaff = userRole === "manager" || userRole === "cashier" || userRole === "delivery_staff";
  const canAccess = isAdmin || isStaff;

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
    else if (!isLoading && user && !canAccess) navigate("/");
  }, [user, canAccess, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 relative overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10 text-white">লোড হচ্ছে...</div>
      </div>
    );
  }

  if (!user || !canAccess) return null;

  const currentTitle = menuItems.find(i => i.url === location.pathname)?.title || "POS";

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 relative overflow-hidden">
        <AnimatedBackground />
        <Sidebar collapsible="icon" className="border-r-0 relative z-10">
          <div className="h-full bg-gradient-to-b from-emerald-950/95 via-teal-900/95 to-emerald-950/95 backdrop-blur-sm">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/30">
                  <MonitorSmartphone className="h-5 w-5 text-white" />
                </div>
                <div className="group-data-[collapsible=icon]:hidden">
                  <h1 className="font-bold text-white text-base leading-tight">POS সিস্টেম</h1>
                  <p className="text-[10px] text-emerald-300">পয়েন্ট অফ সেল</p>
                </div>
              </div>
            </div>

            <SidebarContent className="px-2 py-3 flex flex-col h-[calc(100%-72px)]">
              <SidebarGroup className="flex-1 overflow-y-auto space-y-1">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {menuItems.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.url}>
                          <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                            <Link
                              to={item.url}
                              className={cn(
                                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all",
                                isActive
                                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                                  : "text-emerald-200 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              <div className={cn("p-1.5 rounded-lg shrink-0", isActive ? "bg-white/20" : "bg-emerald-800/50")}>
                                <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-emerald-400")} />
                              </div>
                              <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <div className="pt-3 border-t border-white/10 mt-auto space-y-1">
                <Link
                  to="/admin"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-emerald-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-800/50 shrink-0">
                    <ArrowLeft className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">অ্যাডমিন প্যানেল</span>
                </Link>
                <Link
                  to="/"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-emerald-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-800/50 shrink-0">
                    <Home className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">হোম পেজ</span>
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
