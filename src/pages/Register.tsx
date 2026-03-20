import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, ArrowRight, UserPlus, Fish, Waves, Droplets, Shield, Sparkles, Gift, Clock } from "lucide-react";
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

  const features = [
    { icon: Gift, label: "১০০% ফ্রি" },
    { icon: Sparkles, label: "স্মার্ট টুলস" },
    { icon: Shield, label: "নিরাপদ ডাটা" },
    { icon: Clock, label: "২৪/৭ সাপোর্ট" },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden bg-background">
      {/* Animated background blobs for mobile */}
      <div className="absolute inset-0 lg:hidden pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-secondary/5 blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Left side - Hero Branding Panel */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center p-16 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/90 to-primary/70" />

        {/* Wave pattern */}
        <div className="absolute inset-0 opacity-[0.07]">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="hsl(var(--primary-foreground))" d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,218.7C672,213,768,171,864,165.3C960,160,1056,192,1152,197.3C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
          </svg>
        </div>

        {/* Floating decorative elements */}
        <div className="absolute top-16 right-16 w-20 h-20 rounded-full bg-primary-foreground/5 backdrop-blur-sm animate-bounce" style={{ animationDuration: '6s' }} />
        <div className="absolute top-1/3 left-12 w-14 h-14 rounded-full bg-primary-foreground/5 backdrop-blur-sm animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute bottom-28 right-24 w-10 h-10 rounded-full bg-primary-foreground/5 backdrop-blur-sm animate-bounce" style={{ animationDuration: '5s', animationDelay: '2s' }} />

        <Waves className="absolute top-20 left-20 h-8 w-8 text-primary-foreground/10 animate-pulse" />
        <Droplets className="absolute bottom-32 left-32 h-6 w-6 text-primary-foreground/10 animate-pulse" style={{ animationDelay: '1.5s' }} />

        <div className="relative z-10 text-center max-w-lg">
          {/* Logo */}
          <div className="mb-10">
            {siteLogoUrl ? (
              <img
                src={siteLogoUrl}
                alt={heading}
                className="h-28 w-28 rounded-3xl object-contain mx-auto shadow-2xl ring-4 ring-primary-foreground/20 backdrop-blur-sm"
              />
            ) : (
              <div className="h-28 w-28 rounded-3xl bg-primary-foreground/10 backdrop-blur-md flex items-center justify-center mx-auto shadow-2xl ring-4 ring-primary-foreground/20">
                <Fish className="h-14 w-14 text-primary-foreground" />
              </div>
            )}
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-primary-foreground mb-5 leading-tight tracking-tight">
            যোগ দিন আজই!
          </h1>
          <p className="text-primary-foreground/65 text-lg leading-relaxed max-w-sm mx-auto">
            বিনামূল্যে অ্যাকাউন্ট তৈরি করুন এবং আপনার মাছ চাষ ব্যবসাকে এগিয়ে নিন
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

      {/* Right side - Registration Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-5 sm:p-8 lg:p-12 relative z-10 overflow-y-auto">
        <div className="w-full max-w-[440px] space-y-5">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-2">
            <div className="inline-flex items-center justify-center mb-4">
              {siteLogoUrl ? (
                <img
                  src={siteLogoUrl}
                  alt={heading}
                  className="h-18 w-18 rounded-2xl object-contain shadow-lg ring-2 ring-border"
                />
              ) : (
                <div className="h-18 w-18 rounded-2xl bg-gradient-to-br from-secondary to-primary/80 flex items-center justify-center shadow-lg">
                  <Fish className="h-9 w-9 text-primary-foreground" />
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground">{heading}</h1>
            <p className="text-muted-foreground text-sm mt-1">বিনামূল্যে অ্যাকাউন্ট তৈরি করুন</p>
          </div>

          {/* Desktop welcome */}
          <div className="hidden lg:block space-y-1.5">
            <h2 className="text-3xl font-bold text-foreground">নতুন অ্যাকাউন্ট তৈরি করুন ✨</h2>
            <p className="text-muted-foreground">সকল তথ্য সঠিকভাবে পূরণ করুন</p>
          </div>

          {/* Registration Form Card */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/60 p-5 sm:p-6 shadow-sm space-y-4">
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Name & Mobile row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name" className="text-foreground font-medium text-sm">{regNameLabel} *</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder={regNamePlaceholder}
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    className="h-11 rounded-xl border-border/80 bg-background/60 focus:bg-background transition-colors"
                  />
                  {errors.fullName && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                      {errors.fullName}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-mobile" className="text-foreground font-medium text-sm">মোবাইল নম্বর *</Label>
                  <Input
                    id="signup-mobile"
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="h-11 rounded-xl border-border/80 bg-background/60 focus:bg-background transition-colors"
                  />
                  {errors.mobile && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                      {errors.mobile}
                    </p>
                  )}
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
                  className="h-11 rounded-xl border-border/80 bg-background/60 focus:bg-background transition-colors"
                />
                {errors.identifier && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                    {errors.identifier}
                  </p>
                )}
              </div>

              {/* Password row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-foreground font-medium text-sm">{regPwdLabel} *</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder={regPwdPlaceholder}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="h-11 pr-10 rounded-xl border-border/80 bg-background/60 focus:bg-background transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                      {errors.password}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-confirm" className="text-foreground font-medium text-sm">{regConfirmPwdLabel} *</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder={regConfirmPwdPlaceholder}
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    className="h-11 rounded-xl border-border/80 bg-background/60 focus:bg-background transition-colors"
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Address Fields */}
              {showAddressFields && (
                <div className="pt-3 border-t border-border/50">
                  <p className="text-sm font-medium text-muted-foreground mb-3">📍 ঠিকানা (ঐচ্ছিক)</p>
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
                className="w-full h-12 text-base font-semibold gap-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 mt-1"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                {regBtnText}
              </Button>
            </form>
          </div>

          {/* Divider + Login */}
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
                ইতোমধ্যে অ্যাকাউন্ট আছে?{" "}
                <Link
                  to="/auth"
                  className="text-primary hover:text-primary/80 font-semibold inline-flex items-center gap-1 transition-colors hover:underline underline-offset-2"
                >
                  লগইন করুন <ArrowRight className="h-3.5 w-3.5" />
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

export default Register;
