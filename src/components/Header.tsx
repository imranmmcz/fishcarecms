import { Fish, Menu, LogIn, Shield, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { path: "/", label: "হোম" },
  { path: "/pond-calculator", label: "পুকুর পরিমাপ" },
  { path: "/stocking-density", label: "স্টকিং ডেনসিটি" },
  { path: "/fish-advice", label: "ফিস এডভাইস" },
  { path: "/modules", label: "সকল মডিউল" },
];

export const Header = () => {
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <div className="rounded-lg bg-gradient-primary p-2">
            <Fish className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">মৎস্য ব্যবস্থাপনা</span>
            <span className="text-xs text-muted-foreground">বৈজ্ঞানিক মাছ চাষ</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === item.path
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          
          {/* Auth Buttons */}
          <div className="flex items-center gap-2 ml-4 border-l border-border pl-4">
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Shield className="h-4 w-4" />
                      অ্যাডমিন
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" className="gap-2" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                  লগআউট
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  লগইন
                </Button>
              </Link>
            )}
          </div>
        </nav>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <nav className="flex flex-col gap-4 mt-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-base font-medium transition-colors hover:text-primary px-2 py-1 rounded-md ${
                    location.pathname === item.path
                      ? "text-primary bg-primary/10"
                      : "text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Mobile Auth */}
              <div className="border-t border-border pt-4 mt-4 space-y-2">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      {user.email}
                    </div>
                    {isAdmin && (
                      <Link to="/admin">
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          <Shield className="h-4 w-4" />
                          অ্যাডমিন প্যানেল
                        </Button>
                      </Link>
                    )}
                    <Button variant="ghost" size="sm" className="w-full gap-2" onClick={signOut}>
                      <LogOut className="h-4 w-4" />
                      লগআউট
                    </Button>
                  </>
                ) : (
                  <Link to="/auth">
                    <Button variant="default" size="sm" className="w-full gap-2">
                      <LogIn className="h-4 w-4" />
                      লগইন / সাইনআপ
                    </Button>
                  </Link>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
