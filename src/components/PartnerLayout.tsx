import { ReactNode, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePartner } from "@/hooks/usePartner";
import {
  LayoutDashboard, Ticket, MousePointerClick, ShoppingBag, DollarSign,
  Wallet, User, Home, LogOut, Handshake, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const items = [
  { to: "/partner", label: "ড্যাশবোর্ড", icon: LayoutDashboard, exact: true },
  { to: "/partner/codes", label: "আমার কোড", icon: Ticket },
  { to: "/partner/clicks", label: "ক্লিক", icon: MousePointerClick },
  { to: "/partner/sales", label: "রেফারাল সেলস", icon: ShoppingBag },
  { to: "/partner/commissions", label: "কমিশন", icon: DollarSign },
  { to: "/partner/wallet", label: "ওয়ালেট ও উইথড্র", icon: Wallet },
  { to: "/partner/profile", label: "প্রোফাইল", icon: User },
];

export function PartnerLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, signOut } = useAuth();
  const { partner, loading } = usePartner();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
  }, [user, isLoading, navigate]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <Handshake className="h-12 w-12 text-primary" />
        <h1 className="text-xl font-bold">আপনি এখনো পার্টনার নন</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          পার্টনার প্রোগ্রামে যোগ দিতে নিবন্ধন করুন এবং কমিশন উপার্জন শুরু করুন।
        </p>
        <Button onClick={() => navigate("/partner/apply")}>আবেদন করুন</Button>
      </div>
    );
  }

  if (partner.status !== "approved") {
    const messages: Record<string, string> = {
      pending: "আপনার আবেদন পর্যালোচনাধীন। অনুমোদনের পর ড্যাশবোর্ডে প্রবেশ করতে পারবেন।",
      rejected: `আবেদন প্রত্যাখ্যাত হয়েছে। কারণ: ${partner.rejection_reason || "—"}`,
      suspended: "আপনার পার্টনার অ্যাকাউন্ট স্থগিত আছে। অ্যাডমিনের সাথে যোগাযোগ করুন।",
    };
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <Handshake className="h-12 w-12 text-primary" />
        <Badge variant="secondary" className="capitalize">{partner.status}</Badge>
        <p className="text-sm text-muted-foreground max-w-md">{messages[partner.status]}</p>
        <Button variant="outline" onClick={() => navigate("/")}>হোমে ফিরে যান</Button>
      </div>
    );
  }

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-muted/30">
      <aside className="lg:fixed lg:inset-y-0 lg:w-64 lg:flex lg:flex-col border-r bg-card">
        <div className="px-4 py-4 border-b flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-secondary">
            <Handshake className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{partner.full_name}</div>
            <div className="text-[10px] text-muted-foreground">পার্টনার প্যানেল</div>
          </div>
        </div>
        <nav className="p-2 space-y-1 lg:flex-1 overflow-x-auto lg:overflow-y-auto flex lg:block">
          {items.map((it) => {
            const active = isActive(it.to, it.exact);
            return (
              <Link key={it.to} to={it.to}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap lg:whitespace-normal",
                  active ? "bg-primary/15 text-primary font-medium" : "hover:bg-muted text-muted-foreground"
                )}>
                <it.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{it.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t hidden lg:block space-y-1">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted text-muted-foreground">
            <Home className="h-4 w-4" />হোম
          </Link>
          <button onClick={() => signOut()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted text-muted-foreground">
            <LogOut className="h-4 w-4" />সাইন আউট
          </button>
        </div>
      </aside>
      <main className="flex-1 lg:ml-64 p-4 md:p-6 max-w-full overflow-x-hidden dashboard-main">
        {children}
      </main>
    </div>
  );
}