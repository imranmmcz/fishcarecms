import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { HardDrive, CloudDownload, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStorageMode, setStorageMode, migrateBucketToHostinger, type StorageMode } from "@/lib/appStorage";

const BUCKETS = ["avatars", "product-images", "blog-images", "partner-documents"] as const;

export default function StorageBackendSettings() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const bn = language === "bn";
  const [mode, setMode] = useState<StorageMode>(getStorageMode());
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [results, setResults] = useState<Record<string, { succeeded: number; failed: number }>>({});

  const flip = (m: StorageMode) => {
    setStorageMode(m);
    setMode(m);
    toast({
      title: bn ? "স্টোরেজ মোড পরিবর্তিত" : "Storage mode updated",
      description: m === "hostinger"
        ? (bn ? "নতুন আপলোড Hostinger backend-এ যাবে।" : "New uploads will go to the Hostinger backend.")
        : (bn ? "নতুন আপলোড Supabase Storage-এ যাবে।" : "New uploads will go to Supabase Storage."),
    });
  };

  const migrate = async (bucket: string) => {
    setBusy(bucket);
    setProgress("");
    try {
      const r = await migrateBucketToHostinger(bucket, { onProgress: setProgress });
      setResults((p) => ({ ...p, [bucket]: { succeeded: r.succeeded, failed: r.failed } }));
      toast({
        title: bn ? "মাইগ্রেশন সম্পন্ন" : "Migration complete",
        description: `${bucket}: ${r.succeeded} ok / ${r.failed} failed`,
      });
    } catch (e: any) {
      toast({ title: bn ? "ব্যর্থ" : "Failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
      setProgress("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          {bn ? "স্টোরেজ ব্যাকএন্ড" : "Storage Backend"}
        </CardTitle>
        <CardDescription>
          {bn
            ? "ফাইল আপলোড কোথায় যাবে — Supabase Storage নাকি Hostinger backend।"
            : "Where uploaded files land — Supabase Storage or Hostinger backend."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline">{bn ? "বর্তমান মোড" : "Current mode"}: {mode}</Badge>
          <Button size="sm" variant={mode === "supabase" ? "default" : "outline"} onClick={() => flip("supabase")}>
            Supabase
          </Button>
          <Button size="sm" variant={mode === "hostinger" ? "default" : "outline"} onClick={() => flip("hostinger")}>
            Hostinger
          </Button>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {bn
              ? "মোড স্থানীয় ব্রাউজারে সংরক্ষিত। প্রোডাকশনে সব ব্যবহারকারীর জন্য force করতে VITE_STORAGE_MODE=hostinger সেট করুন।"
              : "Mode is stored per browser. To force for all users in production, set VITE_STORAGE_MODE=hostinger."}
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <div className="text-sm font-medium">
            {bn ? "Supabase → Hostinger মাইগ্রেশন" : "Supabase → Hostinger migration"}
          </div>
          {BUCKETS.map((b) => {
            const r = results[b];
            return (
              <div key={b} className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm">{b}</span>
                  {r && (
                    <Badge variant={r.failed ? "destructive" : "default"} className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {r.succeeded} ok · {r.failed} failed
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy !== null}
                  onClick={() => migrate(b)}
                >
                  {busy === b ? (
                    <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> {progress || "..."}</>
                  ) : (
                    <><CloudDownload className="mr-1 h-3 w-3" /> {bn ? "কপি" : "Copy"}</>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}