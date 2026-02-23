import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Camera, Loader2, Save, Mail, Calendar, Lock, Eye, EyeOff } from "lucide-react";
import { AddressFields } from "@/components/AddressFields";

export default function Profile() {
  const { user, profile, isLoading: authLoading, isAdmin, updateProfile, updatePassword, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Address fields
  const [mobile, setMobile] = useState("");
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [village, setVillage] = useState("");
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Determine which layout to use based on the route
  const isAdminRoute = location.pathname.startsWith("/admin");
  const Layout = isAdminRoute ? AdminLayout : DashboardLayout;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (profile) {
      // Load profile data from Supabase profile
      setFullName(profile.full_name || "");
      setAvatarUrl(profile.avatar_url || null);
      setMobile(profile.mobile || "");
      setDivision(profile.division || "");
      setDistrict(profile.district || "");
      setUpazila(profile.upazila || "");
      setVillage(profile.village || "");
      setLoading(false);
    } else if (user) {
      // Fallback to user fields if profile not loaded yet
      setFullName((user as any)?.full_name || "");
      setLoading(false);
    }
  }, [user, profile, authLoading, navigate]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Note: Avatar upload requires backend file upload endpoint
    // For now, show a message that this feature needs backend support
    toast.info("অ্যাভাটার আপলোড বৈশিষ্ট্য শীঘ্রই আসছে!");
    setUploading(false);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      const success = await updateProfile({
        full_name: fullName,
        mobile,
        division,
        district,
        upazila,
        village
      });

      if (!success) {
        throw new Error("Failed to update profile");
      }

      // Refresh user data to get updated values
      await refreshUser();
      toast.success("প্রোফাইল সফলভাবে আপডেট হয়েছে!");
    } catch (error: unknown) {
      toast.error("প্রোফাইল আপডেট করতে সমস্যা হয়েছে");
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("সব ফিল্ড পূরণ করুন");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না");
      return;
    }

    try {
      setChangingPassword(true);

      const { error } = await updatePassword(currentPassword, newPassword);

      if (error) {
        if (error.message.includes("incorrect") || error.message.includes("Invalid")) {
          toast.error("বর্তমান পাসওয়ার্ড সঠিক নয়");
        } else {
          throw error;
        }
        return;
      }

      toast.success("পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!");
      
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      toast.error("পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে");
      console.error("Error changing password:", error);
    } finally {
      setChangingPassword(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">প্রোফাইল সেটিংস</h1>
          <p className="text-muted-foreground">আপনার ব্যক্তিগত তথ্য আপডেট করুন</p>
        </div>

        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              প্রোফাইল ছবি
            </CardTitle>
            <CardDescription>আপনার প্রোফাইল ছবি পরিবর্তন করুন</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                  <AvatarImage src={avatarUrl || undefined} alt={fullName} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-2xl font-semibold">
                    {fullName ? getInitials(fullName) : <User className="h-10 w-10" />}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {uploading ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      আপলোড হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      নতুন ছবি আপলোড করুন
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG বা GIF। সর্বোচ্চ ১০ MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Info Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              ব্যক্তিগত তথ্য
            </CardTitle>
            <CardDescription>আপনার নাম এবং অন্যান্য তথ্য</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">পুরো নাম</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="আপনার পুরো নাম লিখুন"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                ইমেইল
              </Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                ইমেইল পরিবর্তন করা যাবে না
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                অ্যাকাউন্ট তৈরির তারিখ
              </Label>
              <Input
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString("bn-BD", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                }) : ""}
                disabled
                className="bg-muted"
              />
            </div>

            {/* Address Fields */}
            <div className="border-t pt-4 mt-4">
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
              />
            </div>

            <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  সেভ হচ্ছে...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  পরিবর্তন সেভ করুন
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Password Change Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              পাসওয়ার্ড পরিবর্তন
            </CardTitle>
            <CardDescription>আপনার অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন করুন</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">বর্তমান পাসওয়ার্ড</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="বর্তমান পাসওয়ার্ড লিখুন"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">নতুন পাসওয়ার্ড</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="নতুন পাসওয়ার্ড লিখুন (কমপক্ষে ৬ অক্ষর)"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">পাসওয়ার্ড নিশ্চিত করুন</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="নতুন পাসওয়ার্ড আবার লিখুন"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              onClick={handleChangePassword} 
              disabled={changingPassword}
              variant="outline"
              className="w-full"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  পরিবর্তন হচ্ছে...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  পাসওয়ার্ড পরিবর্তন করুন
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Role Info */}
        <Card>
          <CardHeader>
            <CardTitle>অ্যাকাউন্ট তথ্য</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isAdmin 
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white" 
                  : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
              }`}>
                {isAdmin ? "অ্যাডমিন" : "ব্যবহারকারী"}
              </div>
              <span className="text-muted-foreground text-sm">
                {isAdmin ? "আপনি অ্যাডমিন প্যানেলে প্রবেশ করতে পারবেন" : "আপনি সাধারণ ব্যবহারকারী"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
