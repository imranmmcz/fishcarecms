import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAuthProvider, setAuthProvider } from "@/lib/authProvider";
import { saveRouting, allMysqlRouting } from "@/lib/dataSource";
import { pingBackend } from "@/lib/apiClient";
import { KeyRound, Loader2 } from "lucide-react";

export default function AuthBackendSettings() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const bn = language === "bn";
  const [provider, setProvider] = useState(getAuthProvider());
  const [switching, setSwitching] = useState(false);

  const handleToggle = async (toMysql: boolean) => {
    if (toMysql) {
      setSwitching(true);
      const up = await pingBackend();
      setSwitching(false);
      if (!up) {
        toast({
          variant: "destructive",
          title: bn ? "ব্যাকএন্ড অফলাইন" : "Backend offline",
          description: bn
            ? "MySQL auth চালু করার আগে ব্যাকএন্ড সংযোগ ঠিক করুন।"
            : "Fix the backend connection before enabling MySQL auth.",
        });
        return;
      }
    }
    const next = toMysql ? "mysql" : "supabase";
    setAuthProvider(next);
    setProvider(next);
    if (toMysql) {
      // Move every routable module to MySQL so no request runs against
      // Supabase RLS without a session (which looks like a logout).
      try {
        await saveRouting(allMysqlRouting());
      } catch {
        /* local cache is already updated */
      }
    }
    toast({
      title: bn ? "অথ প্রোভাইডার পরিবর্তন হয়েছে" : "Auth provider changed",
      description: bn
        ? "নতুন সেশন চালু করতে পেজ রিলোড হচ্ছে…"
        : "Reloading so a fresh session is created…",
    });
    setTimeout(() => window.location.reload(), 900);
  };

  const isMysql = provider === "mysql";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <KeyRound className="h-5 w-5 text-primary" />
          {bn ? "অথেনটিকেশন ব্যাকএন্ড" : "Authentication Backend"}
        </CardTitle>
        <CardDescription>
          {bn
            ? "লগইন/রেজিস্ট্রেশন Supabase Auth নাকি MySQL কাস্টম JWT দিয়ে চলবে তা নির্ধারণ করুন।"
            : "Choose whether login/registration runs on Supabase Auth or custom MySQL JWT auth."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-medium">
              {bn ? "MySQL কাস্টম JWT auth" : "MySQL custom JWT auth"}
            </div>
            <div className="text-xs text-muted-foreground">
              {bn ? "/api/auth (Hostinger backend)" : "/api/auth (Hostinger backend)"}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {switching && <Loader2 className="h-4 w-4 animate-spin" />}
            <Badge variant={isMysql ? "default" : "secondary"}>
              {isMysql ? "MySQL JWT" : "Supabase Auth"}
            </Badge>
            <Switch
              checked={isMysql}
              disabled={switching}
              onCheckedChange={handleToggle}
              aria-label="Toggle MySQL authentication"
            />
          </div>
        </div>

        <Alert>
          <AlertDescription className="text-sm space-y-1">
            <p>
              {bn
                ? "MySQL auth চালু করলে ইউজারদের নতুন করে রেজিস্ট্রেশন করতে হবে — Supabase পাসওয়ার্ড কপি করা যায় না।"
                : "With MySQL auth enabled users must register again — Supabase passwords cannot be copied."}
            </p>
            <p>
              {bn
                ? "যেসব মডিউল এখনো Supabase-এ আছে সেগুলো RLS-এর কারণে লগ-আউট অবস্থায় দেখাবে। ঐ মডিউলগুলোও MySQL-এ সরিয়ে নিন।"
                : "Modules still on Supabase will behave as signed-out (RLS). Route those modules to MySQL too."}
            </p>
            <p>
              {bn
                ? "ব্যাকএন্ড .env-এ শক্তিশালী JWT_SECRET সেট করা আবশ্যক।"
                : "A strong JWT_SECRET must be set in the backend .env."}
            </p>
          </AlertDescription>
        </Alert>

        {isMysql && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggle(false)}
          >
            {bn ? "Supabase Auth-এ ফিরে যান" : "Roll back to Supabase Auth"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
