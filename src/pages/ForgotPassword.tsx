import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Fish, Loader2, ArrowLeft, Mail, Shield, Clock, CheckCircle2 } from "lucide-react";
import { useAuthPageContent } from "@/hooks/useAuthPageContent";

const emailSchema = z.object({
  email: z.string().trim().email({ message: "সঠিক ইমেইল প্রদান করুন" }),
});

const ForgotPassword = () => {
  const { toast } = useToast();
  const { siteLogoUrl, siteName } = useAuthPageContent();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsLoading(false);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      setIsSent(true);
      toast({ title: "সফল", description: "পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে" });
    }
  };

  const features = [
    { icon: Shield, text: "নিরাপদ রিসেট প্রক্রিয়া" },
    { icon: Mail, text: "ইমেইলে লিংক পাঠানো হবে" },
    { icon: Clock, text: "কয়েক মিনিটের মধ্যে রিসেট" },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden bg-background">
      {/* Left Hero Panel */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center p-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary/80" />
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 320"><path fill="currentColor" className="text-primary-foreground" d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,218.7C672,213,768,171,864,165.3C960,160,1056,192,1152,197.3C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" /></svg>
        </div>
        <div className="absolute top-8 right-12 w-20 h-20 rounded-full bg-primary-foreground/10 animate-pulse" />
        <div className="absolute bottom-20 left-16 w-14 h-14 rounded-full bg-primary-foreground/10 animate-pulse delay-700" />

        <div className="relative z-10 max-w-lg text-center space-y-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-foreground/15 backdrop-blur-sm shadow-lg">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-primary-foreground leading-tight">
            পাসওয়ার্ড পুনরুদ্ধার
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            চিন্তার কোনো কারণ নেই! আমরা আপনাকে সহজেই আপনার অ্যাকাউন্টে ফিরিয়ে আনব।
          </p>
          <div className="grid grid-cols-1 gap-3 pt-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-primary-foreground/10 backdrop-blur-sm rounded-xl px-5 py-3">
                <f.icon className="w-5 h-5 text-primary-foreground flex-shrink-0" />
                <span className="text-primary-foreground/90 text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-gradient-to-br from-primary to-secondary/80 px-6 py-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary-foreground/15 backdrop-blur-sm mb-3">
          <Shield className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold text-primary-foreground">পাসওয়ার্ড পুনরুদ্ধার</h1>
        <p className="text-primary-foreground/70 text-sm mt-1">আমরা আপনাকে সাহায্য করব</p>
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
                {isSent ? "ইমেইল পাঠানো হয়েছে!" : "পাসওয়ার্ড ভুলে গেছেন?"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isSent ? "আপনার ইনবক্স চেক করুন" : "আপনার ইমেইল দিন, রিসেট লিংক পাঠাবো"}
              </p>
            </div>

            {isSent ? (
              <div className="space-y-4">
                <div className="p-5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center space-y-3">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                  <p className="text-foreground font-medium">রিসেট লিংক পাঠানো হয়েছে</p>
                  <p className="text-muted-foreground text-sm">
                    <span className="text-primary font-mono text-xs">{email}</span> এ পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে।
                  </p>
                </div>
                <Button className="w-full" variant="outline" onClick={() => { setIsSent(false); setEmail(""); }}>
                  আবার চেষ্টা করুন
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email">ইমেইল</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  রিসেট লিংক পাঠান
                </Button>
              </form>
            )}

            <div className="text-center pt-2">
              <Link to="/auth" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium">
                <ArrowLeft className="h-4 w-4" />
                লগইনে ফিরে যান
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
