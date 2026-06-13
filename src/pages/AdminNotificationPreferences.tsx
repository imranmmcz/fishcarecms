import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Bell, Mail, Shield } from "lucide-react";

const EVENT_TYPES = [
  { value: "all", label: "All event types" },
  { value: "rls_policy_denied", label: "RLS policy denied" },
  { value: "admin_route_denied", label: "Admin route denied" },
  { value: "auth_required", label: "Authentication required" },
  { value: "unauthenticated_access_attempt", label: "Unauthenticated access attempt" },
  { value: "critical", label: "Critical events" },
];

interface Prefs {
  in_app_enabled: boolean;
  email_enabled: boolean;
  email_address: string;
  event_types: string[];
  min_severity: string;
}

const DEFAULTS: Prefs = {
  in_app_enabled: true,
  email_enabled: false,
  email_address: "",
  event_types: ["critical", "admin_route_denied", "rls_policy_denied"],
  min_severity: "warning",
};

export default function AdminNotificationPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("admin_notification_preferences" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        const d: any = data;
        setPrefs({
          in_app_enabled: d.in_app_enabled,
          email_enabled: d.email_enabled,
          email_address: d.email_address ?? user.email ?? "",
          event_types: d.event_types ?? DEFAULTS.event_types,
          min_severity: d.min_severity ?? "warning",
        });
      } else {
        setPrefs((p) => ({ ...p, email_address: user.email ?? "" }));
      }
      setLoading(false);
    })();
  }, [user]);

  const toggleEvent = (val: string) => {
    setPrefs((p) => ({
      ...p,
      event_types: p.event_types.includes(val)
        ? p.event_types.filter((e) => e !== val)
        : [...p.event_types, val],
    }));
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("admin_notification_preferences" as any)
      .upsert(
        {
          user_id: user.id,
          in_app_enabled: prefs.in_app_enabled,
          email_enabled: prefs.email_enabled,
          email_address: prefs.email_address || null,
          event_types: prefs.event_types,
          min_severity: prefs.min_severity,
        },
        { onConflict: "user_id" },
      );
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Preferences saved" });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">Loading…</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container max-w-3xl py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" /> Notification Preferences
          </h1>
          <p className="text-muted-foreground">
            Choose how you receive security and admin notifications.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" /> Channels
            </CardTitle>
            <CardDescription>Where to deliver notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>In-app notifications</Label>
                <p className="text-sm text-muted-foreground">Show in the notification bell.</p>
              </div>
              <Switch
                checked={prefs.in_app_enabled}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, in_app_enabled: v }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Email notifications</Label>
                <p className="text-sm text-muted-foreground">Send a copy to your email.</p>
              </div>
              <Switch
                checked={prefs.email_enabled}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, email_enabled: v }))}
              />
            </div>

            {prefs.email_enabled && (
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={prefs.email_address}
                  onChange={(e) => setPrefs((p) => ({ ...p, email_address: e.target.value }))}
                  placeholder="you@example.com"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event types</CardTitle>
            <CardDescription>Select which events trigger notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {EVENT_TYPES.map((e) => (
              <label key={e.value} className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={prefs.event_types.includes(e.value)}
                  onCheckedChange={() => toggleEvent(e.value)}
                />
                <span className="text-sm">{e.label}</span>
              </label>
            ))}

            <div className="pt-2 space-y-2">
              <Label>Minimum severity</Label>
              <Select
                value={prefs.min_severity}
                onValueChange={(v) => setPrefs((p) => ({ ...p, min_severity: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info and above</SelectItem>
                  <SelectItem value="warning">Warning and above</SelectItem>
                  <SelectItem value="critical">Critical only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save preferences"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}