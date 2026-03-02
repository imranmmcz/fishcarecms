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
import { Fish, Loader2, Eye, EyeOff, Home, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { AddressFields } from "@/components/AddressFields";
import { FishLoadingAnimation } from "@/components/FishLoadingAnimation";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { useAuthPageContent } from "@/hooks/useAuthPageContent";
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
  identifier: z.string().trim().min(1, { message: "ইমেইল বা মোবাইল নম্বর প্রদান করুন" }),
  password: z.string().min(6, { message: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" }),
});

const signupSchema = z.object({
  identifier: z.string().trim().min(1, { message: "ইমেইল প্রদান করুন" }),
  password: z.string().min(6, { message: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" }),
  fullName: z.string().trim().min(2, { message: "নাম কমপক্ষে ২ অক্ষরের হতে হবে" }),
  confirmPassword: z.string(),
  mobile: z.string().trim().min(11, { message: "সঠিক মোবাইল নম্বর প্রদান করুন (কমপক্ষে ১১ সংখ্যা)" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "পাসওয়ার্ড মিলছে না",
  path: ["confirmPassword"],
});

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, isAdmin, userRole, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { loginContent, registerContent, siteLogoUrl, siteName } = useAuthPageContent();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Login form
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  
  // Address fields for signup
  const [mobile, setMobile] = useState("");
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [village, setVillage] = useState("");

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

    // Check if identifier is a mobile number (not an email)
    const isEmail = emailToUse.includes("@");
    if (!isEmail) {
      // Look up email by mobile number using secure RPC function
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
      toast({
        title: "সফল",
        description: "লগইন সফল হয়েছে",
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse({
      identifier: signupEmail,
      password: signupPassword,
      confirmPassword: signupConfirmPassword,
      fullName: signupFullName,
      mobile: mobile,
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
    const { error } = await signUp(signupEmail, signupPassword, signupFullName, {
      mobile,
      division,
      district,
      upazila,
      village
    }, 'farmer');
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
        description: "অ্যাকাউন্ট তৈরি হয়েছে।",
      });
      navigate("/dashboard");
    }
  };

  if (authLoading) {
    return <FishLoadingAnimation message="অপেক্ষা করুন..." />;
  }

  // Dynamic content from settings
  const loginHeading = loginContent.heading || siteName || "মাছ চাষ ম্যানেজমেন্ট";
  const loginDesc = loginContent.description || "আপনার অ্যাকাউন্টে প্রবেশ করুন";
  const loginBtnText = loginContent.buttonText || "লগইন করুন";
  const loginEmailLabel = loginContent.emailLabel || "ইমেইল / মোবাইল নম্বর";
  const loginEmailPlaceholder = loginContent.emailPlaceholder || "ইমেইল বা মোবাইল নম্বর";
  const loginPwdLabel = loginContent.passwordLabel || "পাসওয়ার্ড";
  const loginPwdPlaceholder = loginContent.passwordPlaceholder || "••••••••";
  const homeButtonText = loginContent.homeButtonText || "হোম পেজে যান";
  const showDemoAccount = loginContent.showDemoAccount !== false;
  const demoEmail = loginContent.demoEmail || "demo@fishfarm.com";
  const demoPassword = loginContent.demoPassword || "demo123";
  const demoText = loginContent.demoText || "ডেমো অ্যাকাউন্ট:";

  const regBtnText = registerContent.buttonText || "নিবন্ধন করুন";
  const regNameLabel = registerContent.nameLabel || "পূর্ণ নাম";
  const regNamePlaceholder = registerContent.namePlaceholder || "আপনার নাম";
  const regEmailLabel = registerContent.emailLabel || "ইমেইল";
  const regEmailPlaceholder = registerContent.emailPlaceholder || "your@email.com";
  const regPwdLabel = registerContent.passwordLabel || "পাসওয়ার্ড";
  const regPwdPlaceholder = registerContent.passwordPlaceholder || "••••••••";
  const regConfirmPwdLabel = registerContent.confirmPasswordLabel || "পাসওয়ার্ড নিশ্চিত করুন";
  const regConfirmPwdPlaceholder = registerContent.confirmPasswordPlaceholder || "••••••••";
  const showAddressFields = registerContent.showAddressFields !== false;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-900 via-blue-900 to-slate-900 p-4 relative overflow-hidden">
      <AnimatedBackground />
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/10 backdrop-blur-lg relative z-10">
        <CardHeader className="text-center">
          {/* Dynamic Logo */}
          <div className="mx-auto mb-4">
            {siteLogoUrl ? (
              <img src={siteLogoUrl} alt={loginHeading} className="h-16 w-16 rounded-xl object-contain shadow-lg" />
            ) : (
              <div className="p-3 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl w-fit mx-auto shadow-lg shadow-cyan-500/30">
                <Fish className="h-8 w-8 text-white" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-white">{loginHeading}</CardTitle>
          <CardDescription className="text-slate-300">{loginDesc}</CardDescription>
          <Link 
            to="/" 
            className="group relative inline-flex items-center gap-3 mt-4 px-5 py-2.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/30 hover:border-cyan-300/50 rounded-full text-cyan-200 hover:text-white transition-all duration-300 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/25 hover:scale-105"
          >
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400/0 via-cyan-400/10 to-cyan-400/0 opacity-0 group-hover:opacity-100 animate-pulse" />
            <Sparkles className="h-4 w-4 text-cyan-300 group-hover:text-yellow-300 transition-colors duration-300 animate-pulse" />
            <Home className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            <span className="font-medium">{homeButtonText}</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
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
                  <Label htmlFor="login-identifier" className="text-white">{loginEmailLabel}</Label>
                  <Input
                    id="login-identifier"
                    type="text"
                    placeholder={loginEmailPlaceholder}
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                  {errors.identifier && <p className="text-sm text-red-400">{errors.identifier}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-white">{loginPwdLabel}</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder={loginPwdPlaceholder}
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
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </Link>
                </div>
                <Button3D
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {loginBtnText}
                </Button3D>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-white">{regNameLabel}</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder={regNamePlaceholder}
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                  {errors.fullName && <p className="text-sm text-red-400">{errors.fullName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-white">{regEmailLabel}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder={regEmailPlaceholder}
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                  {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-white">{regPwdLabel}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder={regPwdPlaceholder}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                  {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password" className="text-white">{regConfirmPwdLabel}</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder={regConfirmPwdPlaceholder}
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                  {errors.confirmPassword && <p className="text-sm text-red-400">{errors.confirmPassword}</p>}
                </div>
                
                {/* Address Fields */}
                {showAddressFields && (
                  <AddressFields
                    mobile={mobile}
                    division={division}
                    district={district}
                    upazila={upazila}
                    village={village}
                    onMobileChange={setMobile}
                    onDivisionChange={setDivision}
                    onDistrictChange={setDistrict}
                    onUpazilaChange={setUpazila}
                    onVillageChange={setVillage}
                    errors={errors}
                    variant="auth"
                  />
                )}
                
                <Button3D
                  type="submit"
                  variant="success"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {regBtnText}
                </Button3D>
              </form>
            </TabsContent>
          </Tabs>

          {/* Demo User Info */}
          {showDemoAccount && (
            <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm text-slate-300 font-medium mb-2">🎯 {demoText}</p>
              <div className="space-y-1 text-sm text-slate-400">
                <p>ইমেইল: <span className="text-cyan-400 font-mono">{demoEmail}</span></p>
                <p>পাসওয়ার্ড: <span className="text-cyan-400 font-mono">{demoPassword}</span></p>
              </div>
              <p className="text-xs text-slate-500 mt-2">* অথবা নতুন অ্যাকাউন্ট তৈরি করুন</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
