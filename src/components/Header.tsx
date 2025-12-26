import { Fish, Menu, LogIn, Shield, LogOut, User, LayoutDashboard, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Button3D } from "@/components/ui/button-3d";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { path: "/", label: "হোম" },
  { path: "/shop", label: "শপ" },
  { path: "/pond-calculator", label: "পুকুর পরিমাপ" },
  { path: "/fish-advice", label: "ফিস এডভাইস" },
  { path: "/modules", label: "সকল মডিউল" },
];

export const Header = () => {
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();

  // Get user display name from metadata
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'ব্যবহারকারী';
  const userRole = isAdmin ? 'অ্যাডমিন' : 'ব্যবহারকারী';
  const userInitials = userName.slice(0, 2).toUpperCase();

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
          
          {/* Auth Section */}
          <div className="flex items-center gap-2 ml-4 border-l border-border pl-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium text-foreground">{userName}</span>
                      <Badge variant={isAdmin ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                        {userRole}
                      </Badge>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover border border-border shadow-lg z-50">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium text-foreground">{userName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4" />
                      ড্যাশবোর্ড
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      প্রোফাইল
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      সেটিংস
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer text-primary">
                          <Shield className="h-4 w-4" />
                          অ্যাডমিন প্যানেল
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={signOut} 
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    লগআউট
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button3D variant="primary" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  লগইন
                </Button3D>
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
                    {/* User Info */}
                    <div className="flex items-center gap-3 px-2 py-3 bg-muted rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{userName}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                        <Badge variant={isAdmin ? "default" : "secondary"} className="text-xs w-fit mt-1">
                          {userRole}
                        </Badge>
                      </div>
                    </div>
                    
                    <Link to="/dashboard" className="block">
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        ড্যাশবোর্ড
                      </Button>
                    </Link>
                    
                    <Link to="/dashboard/profile" className="block">
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <User className="h-4 w-4" />
                        প্রোফাইল
                      </Button>
                    </Link>
                    
                    <Link to="/dashboard/settings" className="block">
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <Settings className="h-4 w-4" />
                        সেটিংস
                      </Button>
                    </Link>
                    
                    {isAdmin && (
                      <Link to="/admin" className="block">
                        <Button variant="ghost" className="w-full justify-start gap-2 text-primary">
                          <Shield className="h-4 w-4" />
                          অ্যাডমিন প্যানেল
                        </Button>
                      </Link>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start gap-2 text-destructive hover:text-destructive" 
                      onClick={signOut}
                    >
                      <LogOut className="h-4 w-4" />
                      লগআউট
                    </Button>
                  </>
                ) : (
                  <Link to="/auth">
                    <Button3D variant="primary" size="sm" className="w-full gap-2">
                      <LogIn className="h-4 w-4" />
                      লগইন / সাইনআপ
                    </Button3D>
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
