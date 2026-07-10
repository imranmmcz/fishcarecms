import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { appStorage } from "@/lib/appStorage";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Handshake, Upload, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

const PartnerApply = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [existing, setExisting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: "", father_name: "", mother_name: "", date_of_birth: "",
    nid_number: "", mobile: "", whatsapp: "", email: "",
    address: "", district: "", upazila: "", village: "",
    company_name: "", company_address: "",
    bank_name: "", account_name: "", account_number: "", branch: "", routing_number: "",
    bkash_number: "", nagad_number: "", rocket_number: "",
    experience: "", notes: "",
    profile_photo_url: "", nid_front_url: "", nid_back_url: "",
    facebook: "", youtube: "", website: "",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth?next=/partner/apply"); return; }
    (async () => {
      const { data } = await (supabase as any)
        .from("partners").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setExisting(data);
        setForm((f) => ({
          ...f,
          ...data,
          date_of_birth: data.date_of_birth || "",
          facebook: data.social_links?.facebook || "",
          youtube: data.social_links?.youtube || "",
          website: data.social_links?.website || "",
        }));
      } else {
        setForm((f) => ({ ...f, email: user.email || "", full_name: user.full_name || "" }));
      }
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  const handleFile = async (field: "profile_photo_url" | "nid_front_url" | "nid_back_url", file: File) => {
    if (!user) return;
    setUploading(field);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${field}-${Date.now()}.${ext}`;
      const { error } = await appStorage.from("partner-documents").upload(path, file, { upsert: true });
      if (error) throw error;
      setForm((f) => ({ ...f, [field]: path }));
      toast.success(language === "bn" ? "আপলোড হয়েছে" : "Uploaded");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.full_name || !form.mobile) {
      toast.error(language === "bn" ? "নাম ও মোবাইল প্রয়োজন" : "Name and mobile are required");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        user_id: user.id,
        full_name: form.full_name,
        father_name: form.father_name || null,
        mother_name: form.mother_name || null,
        date_of_birth: form.date_of_birth || null,
        nid_number: form.nid_number || null,
        mobile: form.mobile,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        address: form.address || null,
        district: form.district || null,
        upazila: form.upazila || null,
        village: form.village || null,
        company_name: form.company_name || null,
        company_address: form.company_address || null,
        bank_name: form.bank_name || null,
        account_name: form.account_name || null,
        account_number: form.account_number || null,
        branch: form.branch || null,
        routing_number: form.routing_number || null,
        bkash_number: form.bkash_number || null,
        nagad_number: form.nagad_number || null,
        rocket_number: form.rocket_number || null,
        experience: form.experience || null,
        notes: form.notes || null,
        profile_photo_url: form.profile_photo_url || null,
        nid_front_url: form.nid_front_url || null,
        nid_back_url: form.nid_back_url || null,
        social_links: {
          facebook: form.facebook || null,
          youtube: form.youtube || null,
          website: form.website || null,
        },
      };
      if (existing) {
        const { error } = await (supabase as any)
          .from("partners").update(payload).eq("id", existing.id);
        if (error) throw error;
        toast.success(language === "bn" ? "আপডেট হয়েছে" : "Updated");
      } else {
        const { data, error } = await (supabase as any)
          .from("partners").insert(payload).select().single();
        if (error) throw error;
        setExisting(data);
        toast.success(language === "bn" ? "আবেদন জমা হয়েছে" : "Application submitted");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  const status = existing?.status as string | undefined;
  const StatusBadge = () => {
    if (!status) return null;
    const map: Record<string, { icon: any; cls: string; text: string }> = {
      pending: { icon: Clock, cls: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30", text: language === "bn" ? "অপেক্ষমাণ" : "Pending" },
      approved: { icon: CheckCircle2, cls: "bg-green-500/10 text-green-600 border-green-500/30", text: language === "bn" ? "অনুমোদিত" : "Approved" },
      rejected: { icon: XCircle, cls: "bg-red-500/10 text-red-600 border-red-500/30", text: language === "bn" ? "প্রত্যাখ্যাত" : "Rejected" },
      suspended: { icon: XCircle, cls: "bg-red-500/10 text-red-600 border-red-500/30", text: language === "bn" ? "স্থগিত" : "Suspended" },
    };
    const s = map[status] || map.pending;
    const Icon = s.icon;
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border ${s.cls}`}>
        <Icon className="h-4 w-4" /> {s.text}
      </div>
    );
  };

  const field = (k: keyof typeof form, label: string, type = "text", placeholder = "") => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} type={type} placeholder={placeholder}
        value={(form as any)[k] || ""}
        onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
    </div>
  );

  const fileField = (k: "profile_photo_url" | "nid_front_url" | "nid_back_url", label: string) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input type="file" accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleFile(k, e.target.files[0])} />
        {uploading === k && <Loader2 className="animate-spin h-4 w-4" />}
      </div>
      {form[k] && <p className="text-xs text-muted-foreground truncate">✓ {form[k]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Handshake className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {language === "bn" ? "পার্টনার আবেদন" : "Partner Application"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {language === "bn"
                  ? "আমাদের রেফারেল পার্টনার হিসেবে যোগ দিন এবং কমিশন উপার্জন করুন"
                  : "Join as a referral partner and earn commission on every sale"}
              </p>
            </div>
          </div>
          <StatusBadge />
        </div>

        {status === "rejected" && existing?.rejection_reason && (
          <Card className="mb-4 border-red-500/30 bg-red-500/5">
            <CardContent className="pt-4 text-sm">
              <strong>{language === "bn" ? "প্রত্যাখ্যানের কারণ:" : "Rejection reason:"}</strong> {existing.rejection_reason}
            </CardContent>
          </Card>
        )}

        <form onSubmit={submit} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{language === "bn" ? "ব্যক্তিগত তথ্য" : "Personal Info"}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field("full_name", language === "bn" ? "পূর্ণ নাম *" : "Full Name *")}
              {field("father_name", language === "bn" ? "পিতার নাম" : "Father's Name")}
              {field("mother_name", language === "bn" ? "মাতার নাম" : "Mother's Name")}
              {field("date_of_birth", language === "bn" ? "জন্ম তারিখ" : "Date of Birth", "date")}
              {field("nid_number", language === "bn" ? "এনআইডি নম্বর" : "NID Number")}
              {field("mobile", language === "bn" ? "মোবাইল *" : "Mobile *", "tel")}
              {field("whatsapp", "WhatsApp", "tel")}
              {field("email", "Email", "email")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{language === "bn" ? "ঠিকানা" : "Address"}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">{field("address", language === "bn" ? "পূর্ণ ঠিকানা" : "Full Address")}</div>
              {field("district", language === "bn" ? "জেলা" : "District")}
              {field("upazila", language === "bn" ? "উপজেলা" : "Upazila")}
              {field("village", language === "bn" ? "গ্রাম" : "Village")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === "bn" ? "কোম্পানি তথ্য (যদি থাকে)" : "Company Info (Optional)"}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field("company_name", language === "bn" ? "কোম্পানির নাম" : "Company Name")}
              {field("company_address", language === "bn" ? "কোম্পানির ঠিকানা" : "Company Address")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{language === "bn" ? "পেমেন্ট তথ্য" : "Payment Info"}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field("bkash_number", "bKash", "tel")}
              {field("nagad_number", "Nagad", "tel")}
              {field("rocket_number", "Rocket", "tel")}
              {field("bank_name", language === "bn" ? "ব্যাংকের নাম" : "Bank Name")}
              {field("account_name", language === "bn" ? "অ্যাকাউন্ট নাম" : "Account Name")}
              {field("account_number", language === "bn" ? "অ্যাকাউন্ট নম্বর" : "Account Number")}
              {field("branch", language === "bn" ? "শাখা" : "Branch")}
              {field("routing_number", language === "bn" ? "রাউটিং নম্বর" : "Routing Number")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload className="h-4 w-4" />{language === "bn" ? "ডকুমেন্ট" : "Documents"}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {fileField("profile_photo_url", language === "bn" ? "প্রোফাইল ছবি" : "Profile Photo")}
              {fileField("nid_front_url", language === "bn" ? "এনআইডি (সামনে)" : "NID Front")}
              {fileField("nid_back_url", language === "bn" ? "এনআইডি (পেছনে)" : "NID Back")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{language === "bn" ? "সোশ্যাল ও অন্যান্য" : "Social & Other"}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field("facebook", "Facebook")}
              {field("youtube", "YouTube")}
              {field("website", language === "bn" ? "ওয়েবসাইট" : "Website")}
              <div className="space-y-1.5 md:col-span-2">
                <Label>{language === "bn" ? "অভিজ্ঞতা" : "Experience"}</Label>
                <Textarea rows={3} value={form.experience}
                  onChange={(e) => setForm({ ...form, experience: e.target.value })} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>{language === "bn" ? "বার্তা / নোট" : "Notes"}</Label>
                <Textarea rows={3} value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button asChild variant="outline" type="button"><Link to="/">{language === "bn" ? "বাতিল" : "Cancel"}</Link></Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {existing
                ? (language === "bn" ? "আপডেট করুন" : "Update Application")
                : (language === "bn" ? "আবেদন জমা দিন" : "Submit Application")}
            </Button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default PartnerApply;