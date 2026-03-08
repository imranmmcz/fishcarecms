import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, ArrowRight, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { FishLoadingAnimation } from "@/components/FishLoadingAnimation";
import { useAuthPageContent } from "@/hooks/useAuthPageContent";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  identifier: z.string().trim().min(1, { message: "ইমেইল বা মোবাইল নম্বর প্রদান করুন" }),
  password: z.string().min(6, { message: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" }),
});

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, user, isAdmin, userRole, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { loginContent, siteLogoUrl, siteName } = useAuthPageContent();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  useEffect(() => {
    if (user && userRole) {
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, userRole, isAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({
      identifier: loginIdentifier,
      password: loginPassword,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    let emailToUse = loginIdentifier.trim();
    const isEmail = emailToUse.includes("@");
    if (!isEmail) {
      const { data: email, error: lookupError } = await supabase
        .rpc("get_email_by_mobile", { mobile_number: emailToUse });

      if (lookupError || !email) {
        setIsLoading(false);
        toast({
          title: "লগইন ব্যর্থ",
          description: "এই মোবাইল নম্বর দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি",
          variant: "destructive",
        });
        return;
      }
      emailToUse = email;
    }

    const { error } = await signIn(emailToUse, loginPassword);
    setIsLoading(false);

    if (error) {
      toast({
        title: "লগইন ব্যর্থ",
        description: error.message === "Invalid login credentials"
          ? "ভুল ইমেইল বা পাসওয়ার্ড"
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "সফল", description: "লগইন সফল হয়েছে" });
    }
  };

  if (authLoading) {
    return <FishLoadingAnimation message="অপেক্ষা করুন..." />;
  }

  const loginHeading = loginContent.heading || siteName || "মাছ চাষ ম্যানেজমেন্ট";
  const loginDesc = loginContent.description || "আপনার অ্যাকাউন্টে প্রবেশ করুন";
  const loginBtnText = loginContent.buttonText || "লগইন করুন";
  const loginEmailLabel = loginContent.emailLabel || "ইমেইল / মোবাইল নম্বর";
  const loginEmailPlaceholder = loginContent.emailPlaceholder || "ইমেইল বা মোবাইল নম্বর";
  const loginPwdLabel = loginContent.passwordLabel || "পাসওয়ার্ড";
  const loginPwdPlaceholder = loginContent.passwordPlaceholder || "••••••••";
  const showDemoAccount = loginContent.showDemoAccount !== false;
  const demoEmail = loginContent.demoEmail || "demo@fishfarm.com";
  const demoPassword = loginContent.demoPassword || "demo123";
  const demoText = loginContent.demoText || "ডেমো অ্যাকাউন্ট:";

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 items-center justify-center p-12 overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--primary-foreground)) 1px, transparent 1px),
                              radial-gradient(circle at 75% 75%, hsl(var(--primary-foreground)) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        {/* Floating circles */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-white/5 rounded-full blur-xl" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-white/5 rounded-full blur-lg" />

        <div className="relative z-10 text-center max-w-md">
          {siteLogoUrl ? (
            <img src={siteLogoUrl} alt={loginHeading} className="h-24 w-24 rounded-2xl object-contain mx-auto mb-8 shadow-2xl ring-4 ring-white/20" />
          ) : (
            <div className="h-24 w-24 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-8 shadow-2xl ring-4 ring-white/20">
              <LogIn className="h-12 w-12 text-primary-foreground" />
            </div>
          )}
          <h1 className="text-4xl font-bold text-primary-foreground mb-4 leading-tight">
            {loginHeading}
          </h1>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">
            আপনার মাছ চাষ ব্যবসা পরিচালনা করুন আধুনিক ও স্মার্ট পদ্ধতিতে
          </p>
          <div className="mt-10 flex items-center justify-center gap-6 text-primary-foreground/60 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              সহজ ব্যবস্থাপনা
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              রিয়েলটাইম ডাটা
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-[420px] space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            {siteLogoUrl ? (
              <img src={siteLogoUrl} alt={loginHeading} className="h-16 w-16 rounded-xl object-contain mx-auto mb-4 shadow-lg" />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
                <LogIn className="h-8 w-8 text-primary-foreground" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-foreground">{loginHeading}</h1>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground hidden lg:block">স্বাগতম!</h2>
            <p className="text-muted-foreground">{loginDesc}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login-identifier" className="text-foreground font-medium">{loginEmailLabel}</Label>
              <Input
                id="login-identifier"
                type="text"
                placeholder={loginEmailPlaceholder}
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="h-12 text-base"
              />
              {errors.identifier && <p className="text-sm text-destructive">{errors.identifier}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-foreground font-medium">{loginPwdLabel}</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={loginPwdPlaceholder}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="h-12 text-base pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold gap-2"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
              {loginBtnText}
            </Button>
          </form>

          {/* Demo account */}
          {showDemoAccount && (
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-sm font-medium text-foreground mb-2">🎯 {demoText}</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>ইমেইল: <span className="text-primary font-mono text-xs">{demoEmail}</span></p>
                <p>পাসওয়ার্ড: <span className="text-primary font-mono text-xs">{demoPassword}</span></p>
              </div>
            </div>
          )}

          {/* Register link */}
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground">অথবা</span>
              </div>
            </div>
            <p className="text-muted-foreground">
              অ্যাকাউন্ট নেই?{" "}
              <Link
                to="/register"
                className="text-primary hover:text-primary/80 font-semibold inline-flex items-center gap-1 transition-colors"
              >
                নিবন্ধন করুন <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </p>
          </div>

          {/* Home link */}
          <div className="text-center">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← হোম পেজে ফিরে যান
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
