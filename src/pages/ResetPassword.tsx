import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Fish, Loader2, Eye, EyeOff, CheckCircle, Lock, ShieldCheck, KeyRound } from "lucide-react";
import { useAuthPageContent } from "@/hooks/useAuthPageContent";

const passwordSchema = z.object({
  password: z.string().min(6, { message: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "পাসওয়ার্ড মিলছে না",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { siteLogoUrl, siteName } = useAuthPageContent();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checking, setChecking] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    if (type === "recovery") {
      setIsValidSession(true);
      setChecking(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsValidSession(true);
      setChecking(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = passwordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      setIsSuccess(true);
      toast({ title: "সফল", description: "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে" });
      setTimeout(() => navigate("/auth"), 3000);
    }
  };

  const features = [
    { icon: Lock, text: "শক্তিশালী পাসওয়ার্ড ব্যবহার করুন" },
    { icon: ShieldCheck, text: "এনক্রিপ্টেড ও নিরাপদ" },
    { icon: KeyRound, text: "তাৎক্ষণিক পরিবর্তন" },
  ];

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden bg-background">
      {/* Left Hero Panel */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center p-16">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/90 to-primary/80" />
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 320"><path fill="currentColor" className="text-secondary-foreground" d="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,154.7C672,149,768,171,864,186.7C960,203,1056,213,1152,202.7C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" /></svg>
        </div>
        <div className="absolute top-12 left-16 w-16 h-16 rounded-full bg-secondary-foreground/10 animate-pulse" />
        <div className="absolute bottom-24 right-20 w-12 h-12 rounded-full bg-secondary-foreground/10 animate-pulse delay-500" />

        <div className="relative z-10 max-w-lg text-center space-y-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-secondary-foreground/15 backdrop-blur-sm shadow-lg">
            <KeyRound className="w-10 h-10 text-secondary-foreground" />
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-secondary-foreground leading-tight">
            নতুন পাসওয়ার্ড সেট করুন
          </h1>
          <p className="text-secondary-foreground/80 text-lg">
            আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করতে একটি শক্তিশালী পাসওয়ার্ড বেছে নিন।
          </p>
          <div className="grid grid-cols-1 gap-3 pt-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-secondary-foreground/10 backdrop-blur-sm rounded-xl px-5 py-3">
                <f.icon className="w-5 h-5 text-secondary-foreground flex-shrink-0" />
                <span className="text-secondary-foreground/90 text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-gradient-to-br from-secondary to-primary/80 px-6 py-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-secondary-foreground/15 backdrop-blur-sm mb-3">
          <KeyRound className="w-7 h-7 text-secondary-foreground" />
        </div>
        <h1 className="text-xl font-bold text-secondary-foreground">
          {isSuccess ? "পাসওয়ার্ড পরিবর্তন সফল!" : "নতুন পাসওয়ার্ড সেট করুন"}
        </h1>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-5 sm:p-8 lg:p-12 min-h-[60vh] lg:min-h-screen">
        <div className="w-full max-w-md">
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-xl p-6 sm:p-8 space-y-6">
            {/* Logo */}
            <div className="text-center space-y-2">
              <div className="mx-auto mb-3">
                {siteLogoUrl ? (
                  <img src={siteLogoUrl} alt={siteName || "Logo"} className="h-14 w-14 rounded-xl object-contain shadow-md mx-auto" />
                ) : (
                  <div className="p-3 bg-gradient-to-br from-primary to-secondary rounded-xl w-fit mx-auto shadow-lg">
                    <Fish className="h-7 w-7 text-primary-foreground" />
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-foreground">
                {isSuccess ? "পাসওয়ার্ড পরিবর্তন সফল!" : "নতুন পাসওয়ার্ড সেট করুন"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isSuccess ? "আপনাকে স্বয়ংক্রিয়ভাবে লগইন পেজে নিয়ে যাওয়া হবে" : "আপনার নতুন পাসওয়ার্ড লিখুন"}
              </p>
            </div>

            {isSuccess ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle className="h-16 w-16 text-primary mx-auto" />
                <p className="text-muted-foreground text-sm">কিছুক্ষণের মধ্যে লগইন পেজে যাবে...</p>
              </div>
            ) : !isValidSession ? (
              <div className="text-center space-y-4">
                <p className="text-destructive text-sm">অবৈধ বা মেয়াদোত্তীর্ণ রিসেট লিংক। অনুগ্রহ করে আবার চেষ্টা করুন।</p>
                <Button className="w-full" onClick={() => navigate("/forgot-password")}>
                  আবার রিসেট লিংক পাঠান
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">নতুন পাসওয়ার্ড</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="কমপক্ষে ৬ অক্ষর"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-new-password">পাসওয়ার্ড নিশ্চিত করুন</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    placeholder="আবার লিখুন"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  পাসওয়ার্ড পরিবর্তন করুন
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
