import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, ArrowRight, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { AddressFields } from "@/components/AddressFields";
import { FishLoadingAnimation } from "@/components/FishLoadingAnimation";
import { useAuthPageContent } from "@/hooks/useAuthPageContent";
import { Button } from "@/components/ui/button";

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

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get("role") || "farmer";
  const { signUp, user, isAdmin, userRole, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { registerContent, siteLogoUrl, siteName } = useAuthPageContent();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse({
      identifier: signupEmail,
      password: signupPassword,
      confirmPassword: signupConfirmPassword,
      fullName: signupFullName,
      mobile,
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
      mobile, division, district, upazila, village
    }, roleFromUrl);
    setIsLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        toast({ title: "নিবন্ধন ব্যর্থ", description: "এই ইমেইল দিয়ে ইতোমধ্যে অ্যাকাউন্ট আছে", variant: "destructive" });
      } else {
        toast({ title: "নিবন্ধন ব্যর্থ", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "সফল", description: "অ্যাকাউন্ট তৈরি হয়েছে।" });
      navigate("/dashboard");
    }
  };

  if (authLoading) {
    return <FishLoadingAnimation message="অপেক্ষা করুন..." />;
  }

  const heading = siteName || "মাছ চাষ ম্যানেজমেন্ট";
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
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-secondary via-secondary/90 to-primary/60 items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 30% 70%, hsl(var(--primary-foreground)) 1px, transparent 1px),
                              radial-gradient(circle at 70% 30%, hsl(var(--primary-foreground)) 1px, transparent 1px)`,
            backgroundSize: '36px 36px'
          }} />
        </div>
        <div className="absolute top-32 right-20 w-72 h-72 bg-white/5 rounded-full blur-xl" />
        <div className="absolute bottom-10 left-16 w-56 h-56 bg-white/5 rounded-full blur-xl" />

        <div className="relative z-10 text-center max-w-md">
          {siteLogoUrl ? (
            <img src={siteLogoUrl} alt={heading} className="h-24 w-24 rounded-2xl object-contain mx-auto mb-8 shadow-2xl ring-4 ring-white/20" />
          ) : (
            <div className="h-24 w-24 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-8 shadow-2xl ring-4 ring-white/20">
              <UserPlus className="h-12 w-12 text-primary-foreground" />
            </div>
          )}
          <h1 className="text-4xl font-bold text-primary-foreground mb-4 leading-tight">
            যোগ দিন আজই!
          </h1>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">
            বিনামূল্যে অ্যাকাউন্ট তৈরি করুন এবং আপনার মাছ চাষ ব্যবসাকে এগিয়ে নিন
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-primary-foreground/60 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              ১০০% ফ্রি
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              সহজ রেজিস্ট্রেশন
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              স্মার্ট টুলস
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pink-400" />
              ২৪/৭ সাপোর্ট
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 bg-background overflow-y-auto">
        <div className="w-full max-w-[460px] space-y-6">
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            {siteLogoUrl ? (
              <img src={siteLogoUrl} alt={heading} className="h-14 w-14 rounded-xl object-contain mx-auto mb-3 shadow-lg" />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3 shadow-lg">
                <UserPlus className="h-7 w-7 text-primary-foreground" />
              </div>
            )}
            <h1 className="text-xl font-bold text-foreground">{heading}</h1>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground hidden lg:block">নতুন অ্যাকাউন্ট তৈরি করুন</h2>
            <p className="text-muted-foreground text-sm">সকল তথ্য সঠিকভাবে পূরণ করুন</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Name & Mobile row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="signup-name" className="text-foreground font-medium text-sm">{regNameLabel} *</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder={regNamePlaceholder}
                  value={signupFullName}
                  onChange={(e) => setSignupFullName(e.target.value)}
                  className="h-11"
                />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-mobile" className="text-foreground font-medium text-sm">মোবাইল নম্বর *</Label>
                <Input
                  id="signup-mobile"
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="h-11"
                />
                {errors.mobile && <p className="text-xs text-destructive">{errors.mobile}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-email" className="text-foreground font-medium text-sm">{regEmailLabel} *</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder={regEmailPlaceholder}
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="h-11"
              />
              {errors.identifier && <p className="text-xs text-destructive">{errors.identifier}</p>}
            </div>

            {/* Password row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="signup-password" className="text-foreground font-medium text-sm">{regPwdLabel} *</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={regPwdPlaceholder}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-confirm" className="text-foreground font-medium text-sm">{regConfirmPwdLabel} *</Label>
                <Input
                  id="signup-confirm"
                  type="password"
                  placeholder={regConfirmPwdPlaceholder}
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  className="h-11"
                />
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Address Fields */}
            {showAddressFields && (
              <div className="pt-2 border-t border-border">
                <p className="text-sm font-medium text-muted-foreground mb-3">ঠিকানা (ঐচ্ছিক)</p>
                <AddressFields
                  mobile=""
                  division={division}
                  district={district}
                  upazila={upazila}
                  village={village}
                  onMobileChange={() => {}}
                  onDivisionChange={setDivision}
                  onDistrictChange={setDistrict}
                  onUpazilaChange={setUpazila}
                  onVillageChange={setVillage}
                  errors={errors}
                  variant="auth"
                  hideMobile
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold gap-2 mt-2"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
              {regBtnText}
            </Button>
          </form>

          {/* Login link */}
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
              ইতোমধ্যে অ্যাকাউন্ট আছে?{" "}
              <Link
                to="/auth"
                className="text-primary hover:text-primary/80 font-semibold inline-flex items-center gap-1 transition-colors"
              >
                লগইন করুন <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </p>
          </div>

          <div className="text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← হোম পেজে ফিরে যান
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
