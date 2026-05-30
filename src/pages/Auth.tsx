import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, ArrowRight, LogIn, Fish, Waves, Droplets, Shield, BarChart3, Users } from "lucide-react";
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

    // Check rate limit before attempting login
    try {
      const { data: rateCheck } = await supabase.rpc("check_login_rate_limit", { 
        check_email: emailToUse 
      }) as { data: any };
      if (rateCheck?.locked) {
        setIsLoading(false);
        toast({
          title: "অ্যাকাউন্ট লক",
          description: `অনেক বেশি ভুল চেষ্টা। ${rateCheck.remaining_minutes} মিনিট পর আবার চেষ্টা করুন।`,
          variant: "destructive",
        });
        return;
      }
    } catch (e) {
      // If RPC fails, continue with login
    }

    const { error } = await signIn(emailToUse, loginPassword);
    setIsLoading(false);

    // Log the attempt
    try {
      await supabase.from("login_attempts").insert({
        email: emailToUse,
        success: !error,
      } as any);
    } catch (e) {
      // Silent fail
    }

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
  const loginEmailLabel = loginContent.emailLabel || "ইমেইল / মোবাইল নাম্বার লিখুন";
  const loginEmailPlaceholder = loginContent.emailPlaceholder || "ইমেইল বা মোবাইল নাম্বার লিখুন";
  const loginPwdLabel = loginContent.passwordLabel || "পাসওয়ার্ড";
  const loginPwdPlaceholder = loginContent.passwordPlaceholder || "••••••••";
  const showDemoAccount = loginContent.showDemoAccount !== false;
  const demoEmail = loginContent.demoEmail || "demo@fishfarm.com";
  const demoPassword = loginContent.demoPassword || "demo123";
  const demoText = loginContent.demoText || "ডেমো অ্যাকাউন্ট:";

  const features = [
    { icon: Fish, label: "স্মার্ট মাছ চাষ" },
    { icon: BarChart3, label: "রিয়েলটাইম রিপোর্ট" },
    { icon: Shield, label: "নিরাপদ ডাটা" },
    { icon: Users, label: "সহজ ব্যবস্থাপনা" },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden bg-background">
      {/* Animated background blobs for mobile */}
      <div className="absolute inset-0 lg:hidden pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/5 blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-secondary/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Left side - Hero Branding Panel */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center p-16 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary/80" />
        
        {/* Animated wave pattern */}
        <div className="absolute inset-0 opacity-[0.07]">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="hsl(var(--primary-foreground))" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,181.3C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
          </svg>
        </div>

        {/* Floating decorative elements */}
        <div className="absolute top-16 left-16 w-20 h-20 rounded-full bg-primary-foreground/5 backdrop-blur-sm animate-bounce" style={{ animationDuration: '6s' }} />
        <div className="absolute top-1/3 right-12 w-14 h-14 rounded-full bg-primary-foreground/5 backdrop-blur-sm animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute bottom-28 left-24 w-10 h-10 rounded-full bg-primary-foreground/5 backdrop-blur-sm animate-bounce" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        
        {/* Fish icons floating */}
        <Waves className="absolute top-20 right-20 h-8 w-8 text-primary-foreground/10 animate-pulse" />
        <Droplets className="absolute bottom-32 right-32 h-6 w-6 text-primary-foreground/10 animate-pulse" style={{ animationDelay: '1.5s' }} />

        <div className="relative z-10 text-center max-w-lg">
          {/* Logo */}
          <div className="mb-10">
            {siteLogoUrl ? (
              <img 
                src={siteLogoUrl} 
                alt={`${loginHeading} logo`} 
                className="h-28 w-28 rounded-3xl object-contain mx-auto shadow-2xl ring-4 ring-primary-foreground/20 backdrop-blur-sm" 
              />
            ) : (
              <div className="h-28 w-28 rounded-3xl bg-primary-foreground/10 backdrop-blur-md flex items-center justify-center mx-auto shadow-2xl ring-4 ring-primary-foreground/20">
                <Fish className="h-14 w-14 text-primary-foreground" />
              </div>
            )}
          </div>

          {/* Heading */}
          <p role="heading" aria-level={2} className="text-4xl xl:text-5xl font-bold text-primary-foreground mb-5 leading-tight tracking-tight">
            {loginHeading}
          </p>
          <p className="text-primary-foreground/65 text-lg leading-relaxed max-w-sm mx-auto">
            আপনার মাছ চাষ ব্যবসা পরিচালনা করুন আধুনিক ও স্মার্ট পদ্ধতিতে
          </p>

          {/* Feature pills */}
          <div className="mt-12 grid grid-cols-2 gap-3 max-w-sm mx-auto">
            {features.map((f, i) => (
              <div 
                key={i} 
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground/80 text-sm font-medium transition-all hover:bg-primary-foreground/15 hover:scale-[1.02]"
              >
                <f.icon className="h-4.5 w-4.5 shrink-0" />
                {f.label}
              </div>
            ))}
          </div>

          {/* Trust badge */}
          <div className="mt-10 flex items-center justify-center gap-2 text-primary-foreground/40 text-xs">
            <Shield className="h-3.5 w-3.5" />
            <span>আপনার ডাটা সম্পূর্ণ নিরাপদ ও এনক্রিপ্টেড</span>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-5 sm:p-8 lg:p-16 relative z-10">
        <div className="w-full max-w-[400px] space-y-6">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-2">
            <div className="inline-flex items-center justify-center mb-5">
              {siteLogoUrl ? (
                <img 
                  src={siteLogoUrl} 
                  alt={`${loginHeading} logo`} 
                  className="h-18 w-18 rounded-2xl object-contain shadow-lg ring-2 ring-border" 
                />
              ) : (
                <div className="h-18 w-18 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                  <Fish className="h-9 w-9 text-primary-foreground" />
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground">{loginHeading}</h1>
            <p className="text-muted-foreground text-sm mt-1">{loginDesc}</p>
          </div>

          {/* Desktop welcome */}
          <div className="hidden lg:block space-y-1.5">
            <h1 className="text-3xl font-bold text-foreground">স্বাগতম! 👋</h1>
            <p className="text-muted-foreground">{loginDesc}</p>
          </div>

          {/* Login Form Card */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/60 p-6 sm:p-7 shadow-sm space-y-5">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email/Phone field */}
              <div className="space-y-1.5">
                <Label htmlFor="login-identifier" className="text-foreground font-medium text-sm">
                  {loginEmailLabel}
                </Label>
                <div className="relative">
                  <Input
                    id="login-identifier"
                    type="text"
                    placeholder={loginEmailPlaceholder}
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="h-12 text-base rounded-xl border-border/80 bg-background/60 focus:bg-background transition-colors pl-4"
                  />
                </div>
                {errors.identifier && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                    {errors.identifier}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-foreground font-medium text-sm">
                    {loginPwdLabel}
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:text-primary/80 font-medium transition-colors hover:underline underline-offset-2"
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
                    className="h-12 text-base pr-12 rounded-xl border-border/80 bg-background/60 focus:bg-background transition-colors pl-4"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold gap-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LogIn className="h-5 w-5" />
                )}
                {loginBtnText}
              </Button>
            </form>
          </div>

          {/* Demo account */}
          {showDemoAccount && (
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50 backdrop-blur-sm">
              <p className="text-sm font-medium text-foreground mb-1.5">🎯 {demoText}</p>
              <div className="space-y-0.5 text-sm text-muted-foreground">
                <p>ইমেইল: <code className="text-primary bg-primary/5 px-1.5 py-0.5 rounded text-xs">{demoEmail}</code></p>
                <p>পাসওয়ার্ড: <code className="text-primary bg-primary/5 px-1.5 py-0.5 rounded text-xs">{demoPassword}</code></p>
              </div>
            </div>
          )}

          {/* Divider + Register */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-4 text-muted-foreground">অথবা</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                অ্যাকাউন্ট নেই?{" "}
                <Link
                  to="/register"
                  className="text-primary hover:text-primary/80 font-semibold inline-flex items-center gap-1 transition-colors hover:underline underline-offset-2"
                >
                  নিবন্ধন করুন <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </p>
            </div>
          </div>

          {/* Home link */}
          <div className="text-center pt-1">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 hover:underline underline-offset-2"
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
