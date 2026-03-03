import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, RefreshCw, BarChart3, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function GoogleAnalyticsSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [measurementId, setMeasurementId] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .in("setting_key", ["google_analytics_enabled", "google_analytics_measurement_id"]);

      if (error) throw error;

      (data || []).forEach((s: any) => {
        if (s.setting_key === "google_analytics_enabled") {
          setEnabled(s.setting_value === "true");
        } else if (s.setting_key === "google_analytics_measurement_id") {
          setMeasurementId(s.setting_value || "");
        }
      });
    } catch (err) {
      console.error("Error fetching GA settings:", err);
      toast.error("সেটিংস লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (enabled && !measurementId.trim()) {
      toast.error("Measurement ID দিতে হবে");
      return;
    }

    setSaving(true);
    try {
      const updates = [
        { setting_key: "google_analytics_enabled", setting_value: enabled.toString() },
        { setting_key: "google_analytics_measurement_id", setting_value: measurementId.trim() },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("system_settings")
          .update({ setting_value: update.setting_value })
          .eq("setting_key", update.setting_key);
        if (error) throw error;
      }

      toast.success("Google Analytics সেটিংস সংরক্ষণ করা হয়েছে");
    } catch (err) {
      console.error("Error saving GA settings:", err);
      toast.error("সেটিংস সংরক্ষণে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Google Analytics
        </CardTitle>
        <CardDescription>
          ওয়েবসাইটের ভিজিটর ট্র্যাকিং ও বিশ্লেষণের জন্য Google Analytics কনফিগার করুন
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="ga-enabled" className="text-base font-medium">
              Google Analytics সক্রিয় করুন
            </Label>
            <p className="text-sm text-muted-foreground">
              ওয়েবসাইটে Google Analytics ট্র্যাকিং চালু/বন্ধ করুন
            </p>
          </div>
          <Switch
            id="ga-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {enabled && (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="measurement-id">Measurement ID</Label>
              <Input
                id="measurement-id"
                placeholder="G-XXXXXXXXXX"
                value={measurementId}
                onChange={(e) => setMeasurementId(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Google Analytics 4 (GA4) Measurement ID দিন। এটি "G-" দিয়ে শুরু হয়।
              </p>
            </div>

            <Alert className="border-primary/20 bg-primary/5">
              <BarChart3 className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>কিভাবে Measurement ID পাবেন:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>
                    <a
                      href="https://analytics.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Google Analytics <ExternalLink className="h-3 w-3" />
                    </a>{" "}
                    এ যান
                  </li>
                  <li>Admin → Data Streams → Web Stream সিলেক্ট করুন</li>
                  <li>Measurement ID কপি করুন (G-XXXXXXXXXX)</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
        </Button>
      </CardContent>
    </Card>
  );
}
