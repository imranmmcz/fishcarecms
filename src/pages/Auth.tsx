import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button3D } from "@/components/ui/button-3d";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Fish, Loader2, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "সঠিক ইমেইল প্রদান করুন" }),
  password: z.string().min(6, { message: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" }),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, { message: "নাম কমপক্ষে ২ অক্ষরের হতে হবে" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "পাসওয়ার্ড মিলছে না",
  path: ["confirmPassword"],
});

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({
      email: loginEmail,
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
    const { error } = await signIn(loginEmail, loginPassword);
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
      toast({
        title: "সফল",
        description: "লগইন সফল হয়েছে",
      });
      navigate("/");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse({
      email: signupEmail,
      password: signupPassword,
      confirmPassword: signupConfirmPassword,
      fullName: signupFullName,
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
    const { error } = await signUp(signupEmail, signupPassword, signupFullName);
    setIsLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        toast({
          title: "নিবন্ধন ব্যর্থ",
          description: "এই ইমেইল দিয়ে ইতোমধ্যে অ্যাকাউন্ট আছে",
          variant: "destructive",
        });
      } else {
        toast({
          title: "নিবন্ধন ব্যর্থ",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "সফল",
        description: "অ্যাকাউন্ট তৈরি হয়েছে। লগইন করুন।",
      });
      navigate("/");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-900 via-blue-900 to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-900 via-blue-900 to-slate-900 p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/10 backdrop-blur-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl w-fit shadow-lg shadow-cyan-500/30">
            <Fish className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">মাছ চাষ ম্যানেজমেন্ট</CardTitle>
          <CardDescription className="text-slate-300">আপনার অ্যাকাউন্টে প্রবেশ করুন</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10">
              <TabsTrigger value="login" className="data-[state=active]:bg-white/20 text-white">
                লগইন
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-white/20 text-white">
                নিবন্ধন
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-white">ইমেইল</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                  {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-white">পাসওয়ার্ড</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
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
                <Button3D
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  লগইন করুন
                </Button3D>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-white">পূর্ণ নাম</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="আপনার নাম"
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                  {errors.fullName && <p className="text-sm text-red-400">{errors.fullName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-white">ইমেইল</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                  {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-white">পাসওয়ার্ড</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                  {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password" className="text-white">পাসওয়ার্ড নিশ্চিত করুন</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                  {errors.confirmPassword && <p className="text-sm text-red-400">{errors.confirmPassword}</p>}
                </div>
                <Button3D
                  type="submit"
                  variant="success"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  নিবন্ধন করুন
                </Button3D>
              </form>
            </TabsContent>
          </Tabs>

          {/* Demo User Info */}
          <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-sm text-slate-300 font-medium mb-2">🎯 ডেমো অ্যাকাউন্ট:</p>
            <div className="space-y-1 text-sm text-slate-400">
              <p>ইমেইল: <span className="text-cyan-400 font-mono">demo@fishfarm.com</span></p>
              <p>পাসওয়ার্ড: <span className="text-cyan-400 font-mono">demo123</span></p>
            </div>
            <p className="text-xs text-slate-500 mt-2">* অথবা নতুন অ্যাকাউন্ট তৈরি করুন</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
