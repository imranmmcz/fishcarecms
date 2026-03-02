import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button3D } from "@/components/ui/button-3d";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Fish, Loader2, ArrowLeft, Mail } from "lucide-react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
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
      toast({
        title: "ত্রুটি",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setIsSent(true);
      toast({
        title: "সফল",
        description: "পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে",
      });
    }
  };

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
          <CardTitle className="text-2xl font-bold text-white">পাসওয়ার্ড ভুলে গেছেন?</CardTitle>
          <CardDescription className="text-slate-300">
            আপনার ইমেইল দিন, আমরা রিসেট লিংক পাঠাবো
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSent ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
                <Mail className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-white font-medium">ইমেইল পাঠানো হয়েছে!</p>
                <p className="text-slate-300 text-sm mt-2">
                  <span className="text-cyan-400 font-mono">{email}</span> এ পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে। আপনার ইনবক্স চেক করুন।
                </p>
              </div>
              <Button3D
                variant="primary"
                className="w-full"
                onClick={() => { setIsSent(false); setEmail(""); }}
              >
                আবার চেষ্টা করুন
              </Button3D>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-white">ইমেইল</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                />
                {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
              </div>
              <Button3D
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                রিসেট লিংক পাঠান
              </Button3D>
            </form>
          )}
          <div className="mt-4 text-center">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              লগইনে ফিরে যান
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
