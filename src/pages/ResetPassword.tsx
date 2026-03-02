import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button3D } from "@/components/ui/button-3d";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Fish, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
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
    // Check if this is a valid recovery session
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");

    if (type === "recovery") {
      setIsValidSession(true);
      setChecking(false);
      return;
    }

    // Also check via session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // If there's a session, the user clicked the recovery link
      if (session) {
        setIsValidSession(true);
      }
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
      toast({
        title: "ত্রুটি",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setIsSuccess(true);
      toast({
        title: "সফল",
        description: "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে",
      });
      setTimeout(() => navigate("/auth"), 3000);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-900 via-blue-900 to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-900 via-blue-900 to-slate-900 p-4 relative overflow-hidden">
      <AnimatedBackground />
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/10 backdrop-blur-lg relative z-10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {siteLogoUrl ? (
              <img src={siteLogoUrl} alt={siteName || "Logo"} className="h-16 w-16 rounded-xl object-contain shadow-lg" />
            ) : (
              <div className="p-3 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl w-fit mx-auto shadow-lg shadow-cyan-500/30">
                <Fish className="h-8 w-8 text-white" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {isSuccess ? "পাসওয়ার্ড পরিবর্তন সফল!" : "নতুন পাসওয়ার্ড সেট করুন"}
          </CardTitle>
          <CardDescription className="text-slate-300">
            {isSuccess 
              ? "আপনাকে স্বয়ংক্রিয়ভাবে লগইন পেজে নিয়ে যাওয়া হবে"
              : "আপনার নতুন পাসওয়ার্ড লিখুন"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto" />
              <p className="text-slate-300 text-sm">কিছুক্ষণের মধ্যে লগইন পেজে যাবে...</p>
            </div>
          ) : !isValidSession ? (
            <div className="text-center space-y-4">
              <p className="text-red-400">অবৈধ বা মেয়াদোত্তীর্ণ রিসেট লিংক। অনুগ্রহ করে আবার চেষ্টা করুন।</p>
              <Button3D
                variant="primary"
                className="w-full"
                onClick={() => navigate("/forgot-password")}
              >
                আবার রিসেট লিংক পাঠান
              </Button3D>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-white">নতুন পাসওয়ার্ড</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password" className="text-white">পাসওয়ার্ড নিশ্চিত করুন</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder="আবার লিখুন"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                />
                {errors.confirmPassword && <p className="text-sm text-red-400">{errors.confirmPassword}</p>}
              </div>
              <Button3D
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                পাসওয়ার্ড পরিবর্তন করুন
              </Button3D>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
