import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Bell, Plus, Clock, CheckCircle2, AlertTriangle, Calendar, Fish, Droplets,
  Pill, Wheat, Scale, CloudRain, Megaphone, Settings, Trash2, RotateCcw, X, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, isToday, isFuture, isPast, parseISO, addDays } from "date-fns";

// ── Types ──
interface FarmingAlert {
  id: string;
  user_id: string | null;
  pond_id: string | null;
  pond_name: string;
  alert_type: string;
  title: string;
  title_bn: string | null;
  message: string;
  message_bn: string | null;
  alert_date: string;
  alert_time: string | null;
  is_recurring: boolean;
  recurrence_interval: string;
  status: string;
  priority: string;
  is_global: boolean;
  fish_species: string | null;
  channels: string[];
  created_at: string;
}

interface AlertSettings {
  id?: string;
  feed_reminder_enabled: boolean;
  feed_reminder_times: string[];
  medicine_reminder_enabled: boolean;
  water_check_enabled: boolean;
  water_check_interval_days: number;
  sampling_reminder_enabled: boolean;
  sampling_interval_days: number;
  harvest_reminder_days_before: number;
  channels: string[];
}

interface Pond {
  id: string;
  name: string;
  fish_types: string[];
  stocking_date: string | null;
  status: string;
}

const alertTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  feed_reminder: { label: "খাদ্য রিমাইন্ডার", icon: Wheat, color: "text-amber-500" },
  medicine_reminder: { label: "ঔষধ রিমাইন্ডার", icon: Pill, color: "text-rose-500" },
  water_check: { label: "পানি পরীক্ষা", icon: Droplets, color: "text-blue-500" },
  pond_cleaning: { label: "পুকুর পরিষ্কার", icon: RotateCcw, color: "text-cyan-500" },
  fish_sampling: { label: "মাছ স্যাম্পলিং", icon: Scale, color: "text-emerald-500" },
  harvest_reminder: { label: "মাছ ধরার রিমাইন্ডার", icon: Fish, color: "text-green-500" },
  weather_risk: { label: "আবহাওয়া সতর্কতা", icon: CloudRain, color: "text-indigo-500" },
  disease_outbreak: { label: "রোগ সতর্কতা", icon: AlertTriangle, color: "text-red-500" },
  government_advisory: { label: "সরকারি পরামর্শ", icon: Megaphone, color: "text-purple-500" },
  custom: { label: "কাস্টম", icon: Bell, color: "text-muted-foreground" },
};

const priorityColors: Record<string, string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
};

const defaultSettings: AlertSettings = {
  feed_reminder_enabled: true,
  feed_reminder_times: ["08:00", "12:00", "17:00"],
  medicine_reminder_enabled: true,
  water_check_enabled: true,
  water_check_interval_days: 7,
  sampling_reminder_enabled: true,
  sampling_interval_days: 30,
  harvest_reminder_days_before: 10,
  channels: ["in_app"],
};

export default function DashboardAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<FarmingAlert[]>([]);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [settings, setSettings] = useState<AlertSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState("today");

  // New alert form
  const [newAlert, setNewAlert] = useState({
    alert_type: "custom",
    title: "",
    message: "",
    alert_date: format(new Date(), "yyyy-MM-dd"),
    alert_time: "08:00",
    pond_id: "",
    pond_name: "",
    priority: "medium",
    is_recurring: false,
    recurrence_interval: "daily",
    channels: ["in_app"],
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [alertsRes, pondsRes, settingsRes] = await Promise.all([
      supabase
        .from("farming_alerts")
        .select("*")
        .or(`user_id.eq.${user.id},is_global.eq.true`)
        .order("alert_date", { ascending: true }),
      supabase
        .from("farmer_ponds")
        .select("id, name, fish_types, stocking_date, status")
        .eq("user_id", user.id),
      supabase
        .from("alert_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (alertsRes.data) setAlerts(alertsRes.data as FarmingAlert[]);
    if (pondsRes.data) setPonds(pondsRes.data as Pond[]);
    if (settingsRes.data) {
      setSettings(settingsRes.data as AlertSettings);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("farming-alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "farming_alerts" }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchData]);

  // Auto-generate alerts from pond data
  const generateSmartAlerts = async () => {
    if (!user || ponds.length === 0) {
      toast.error("প্রথমে পুকুরের তথ্য যোগ করুন");
      return;
    }

    const newAlerts: any[] = [];
    const today = new Date();

    for (const pond of ponds) {
      if (pond.status !== "active") continue;

      // Monthly sampling reminder
      if (settings.sampling_reminder_enabled) {
        const samplingDate = addDays(today, settings.sampling_interval_days);
        newAlerts.push({
          user_id: user.id,
          pond_id: pond.id,
          pond_name: pond.name,
          alert_type: "fish_sampling",
          title: `${pond.name} - মাছ স্যাম্পলিং`,
          title_bn: `${pond.name} - মাছ স্যাম্পলিং`,
          message: `${pond.name} পুকুরে মাছের স্যাম্পলিং করার সময় হয়েছে। গড় ওজন পরীক্ষা করুন।`,
          message_bn: `${pond.name} পুকুরে মাছের স্যাম্পলিং করার সময় হয়েছে।`,
          alert_date: format(samplingDate, "yyyy-MM-dd"),
          priority: "medium",
          is_recurring: true,
          recurrence_interval: `${settings.sampling_interval_days} days`,
          channels: settings.channels,
        });
      }

      // Water quality check
      if (settings.water_check_enabled) {
        const waterDate = addDays(today, settings.water_check_interval_days);
        newAlerts.push({
          user_id: user.id,
          pond_id: pond.id,
          pond_name: pond.name,
          alert_type: "water_check",
          title: `${pond.name} - পানি পরীক্ষা`,
          title_bn: `${pond.name} - পানি পরীক্ষা`,
          message: `${pond.name} পুকুরে পানির গুণাগুণ (pH, DO, অ্যামোনিয়া) পরীক্ষা করুন।`,
          message_bn: `${pond.name} পুকুরে পানির গুণাগুণ পরীক্ষা করুন।`,
          alert_date: format(waterDate, "yyyy-MM-dd"),
          priority: "medium",
          is_recurring: true,
          recurrence_interval: `${settings.water_check_interval_days} days`,
          channels: settings.channels,
        });
      }

      // Feed reminders (daily)
      if (settings.feed_reminder_enabled) {
        newAlerts.push({
          user_id: user.id,
          pond_id: pond.id,
          pond_name: pond.name,
          alert_type: "feed_reminder",
          title: `${pond.name} - খাদ্য প্রদান`,
          title_bn: `${pond.name} - খাদ্য প্রদান`,
          message: `${pond.name} পুকুরে মাছকে খাদ্য দেওয়ার সময়।`,
          message_bn: `${pond.name} পুকুরে মাছকে খাদ্য দেওয়ার সময়।`,
          alert_date: format(addDays(today, 1), "yyyy-MM-dd"),
          alert_time: "08:00",
          priority: "low",
          is_recurring: true,
          recurrence_interval: "daily",
          channels: settings.channels,
        });
      }

      // Harvest reminder based on stocking date
      if (pond.stocking_date) {
        const stockDate = parseISO(pond.stocking_date);
        const harvestDate = addDays(stockDate, 180); // ~6 months
        const reminderDate = addDays(harvestDate, -settings.harvest_reminder_days_before);
        if (isFuture(reminderDate) || isToday(reminderDate)) {
          newAlerts.push({
            user_id: user.id,
            pond_id: pond.id,
            pond_name: pond.name,
            alert_type: "harvest_reminder",
            title: `${pond.name} - মাছ ধরার সময়`,
            title_bn: `${pond.name} - মাছ ধরার সময়`,
            message: `${pond.name} পুকুরে মাছ ধরার আনুমানিক সময় এসে গেছে। বাজার দর যাচাই করুন।`,
            message_bn: `${pond.name} পুকুরে মাছ ধরার আনুমানিক সময় এসে গেছে।`,
            alert_date: format(reminderDate, "yyyy-MM-dd"),
            priority: "high",
            channels: settings.channels,
          });
        }
      }
    }

    if (newAlerts.length === 0) {
      toast.info("কোনো নতুন অ্যালার্ট তৈরি হয়নি");
      return;
    }

    const { error } = await supabase.from("farming_alerts").insert(newAlerts as any);
    if (error) {
      toast.error("অ্যালার্ট তৈরিতে সমস্যা হয়েছে");
      console.error(error);
    } else {
      toast.success(`${newAlerts.length}টি স্মার্ট অ্যালার্ট তৈরি হয়েছে!`);
      fetchData();
    }
  };

  const createAlert = async () => {
    if (!user || !newAlert.title || !newAlert.message) {
      toast.error("শিরোনাম ও বার্তা পূরণ করুন");
      return;
    }

    const pond = ponds.find((p) => p.id === newAlert.pond_id);

    const { error } = await supabase.from("farming_alerts").insert({
      user_id: user.id,
      alert_type: newAlert.alert_type as any,
      title: newAlert.title,
      message: newAlert.message,
      alert_date: newAlert.alert_date,
      alert_time: newAlert.alert_time,
      pond_name: pond?.name || newAlert.pond_name || "",
      pond_id: newAlert.pond_id || null,
      title_bn: newAlert.title,
      message_bn: newAlert.message,
      priority: newAlert.priority,
      is_recurring: newAlert.is_recurring,
      recurrence_interval: newAlert.recurrence_interval,
      channels: newAlert.channels,
    } as any);

    if (error) {
      toast.error("অ্যালার্ট তৈরিতে সমস্যা");
      console.error(error);
    } else {
      toast.success("অ্যালার্ট তৈরি হয়েছে!");
      setShowCreate(false);
      setNewAlert({
        alert_type: "custom", title: "", message: "",
        alert_date: format(new Date(), "yyyy-MM-dd"), alert_time: "08:00",
        pond_id: "", pond_name: "", priority: "medium",
        is_recurring: false, recurrence_interval: "daily", channels: ["in_app"],
      });
      fetchData();
    }
  };

  const updateAlertStatus = async (id: string, status: "pending" | "sent" | "completed" | "dismissed" | "overdue") => {
    const { error } = await supabase.from("farming_alerts").update({ status }).eq("id", id);
    if (error) toast.error("আপডেট ব্যর্থ");
    else {
      toast.success(status === "completed" ? "সম্পন্ন হিসেবে চিহ্নিত" : "স্ট্যাটাস আপডেট হয়েছে");
      fetchData();
    }
  };

  const deleteAlert = async (id: string) => {
    const { error } = await supabase.from("farming_alerts").delete().eq("id", id);
    if (!error) { toast.success("অ্যালার্ট মুছে ফেলা হয়েছে"); fetchData(); }
  };

  const saveSettings = async () => {
    if (!user) return;
    const payload = { ...settings, user_id: user.id };
    const { error } = settings.id
      ? await supabase.from("alert_settings").update(payload).eq("id", settings.id)
      : await supabase.from("alert_settings").insert(payload);
    if (error) toast.error("সেটিংস সংরক্ষণে সমস্যা");
    else { toast.success("সেটিংস সংরক্ষিত!"); fetchData(); }
  };

  // Filter alerts
  const todayAlerts = alerts.filter((a) => isToday(parseISO(a.alert_date)) && a.status !== "completed");
  const upcomingAlerts = alerts.filter((a) => isFuture(parseISO(a.alert_date)) && a.status !== "completed");
  const completedAlerts = alerts.filter((a) => a.status === "completed");
  const overdueAlerts = alerts.filter((a) => isPast(parseISO(a.alert_date)) && !isToday(parseISO(a.alert_date)) && a.status === "pending");

  const renderAlert = (alert: FarmingAlert) => {
    const config = alertTypeConfig[alert.alert_type] || alertTypeConfig.custom;
    const IconComp = config.icon;
    const isOverdue = isPast(parseISO(alert.alert_date)) && !isToday(parseISO(alert.alert_date)) && alert.status === "pending";

    return (
      <div key={alert.id} className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${isOverdue ? "border-destructive/50 bg-destructive/5" : "bg-card"}`}>
        <div className={`p-2 rounded-lg bg-muted/50 ${config.color}`}>
          <IconComp className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-sm">{alert.title_bn || alert.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.message_bn || alert.message}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {alert.is_global && <Badge variant="secondary" className="text-[10px]">গ্লোবাল</Badge>}
              <Badge className={`text-[10px] ${priorityColors[alert.priority] || ""}`}>
                {alert.priority === "high" ? "গুরুত্বপূর্ণ" : alert.priority === "critical" ? "জরুরি" : alert.priority === "low" ? "সাধারণ" : "মাঝারি"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {format(parseISO(alert.alert_date), "dd/MM/yyyy")}
              {alert.alert_time && ` ${alert.alert_time}`}
            </span>
            {alert.pond_name && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Fish className="h-3 w-3" /> {alert.pond_name}
              </span>
            )}
            {alert.is_recurring && (
              <Badge variant="outline" className="text-[10px]"><RotateCcw className="h-2.5 w-2.5 mr-1" /> পুনরাবৃত্তি</Badge>
            )}
          </div>
          <div className="flex gap-2 mt-2">
            {alert.status !== "completed" && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateAlertStatus(alert.id, "completed")}>
                <CheckCircle2 className="h-3 w-3 mr-1" /> সম্পন্ন
              </Button>
            )}
            {alert.status !== "dismissed" && alert.status !== "completed" && (
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => updateAlertStatus(alert.id, "dismissed")}>
                <X className="h-3 w-3 mr-1" /> বাতিল
              </Button>
            )}
            {!alert.is_global && (
              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => deleteAlert(alert.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" /> স্মার্ট অ্যালার্ট সিস্টেম
            </h1>
            <p className="text-sm text-muted-foreground mt-1">গুরুত্বপূর্ণ চাষের কাজ মনে রাখতে স্বয়ংক্রিয় রিমাইন্ডার</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateSmartAlerts} variant="outline" size="sm">
              <Sparkles className="h-4 w-4 mr-1" /> স্মার্ট অ্যালার্ট তৈরি
            </Button>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> নতুন অ্যালার্ট</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>নতুন অ্যালার্ট তৈরি করুন</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>অ্যালার্টের ধরন</Label>
                    <Select value={newAlert.alert_type} onValueChange={(v) => setNewAlert((p) => ({ ...p, alert_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(alertTypeConfig).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>শিরোনাম</Label>
                    <Input value={newAlert.title} onChange={(e) => setNewAlert((p) => ({ ...p, title: e.target.value }))} placeholder="যেমন: পুকুরে খাবার দিন" />
                  </div>
                  <div className="space-y-2">
                    <Label>বিস্তারিত বার্তা</Label>
                    <Textarea value={newAlert.message} onChange={(e) => setNewAlert((p) => ({ ...p, message: e.target.value }))} rows={3} placeholder="অ্যালার্টের বিবরণ..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>তারিখ</Label>
                      <Input type="date" value={newAlert.alert_date} onChange={(e) => setNewAlert((p) => ({ ...p, alert_date: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>সময়</Label>
                      <Input type="time" value={newAlert.alert_time} onChange={(e) => setNewAlert((p) => ({ ...p, alert_time: e.target.value }))} />
                    </div>
                  </div>
                  {ponds.length > 0 && (
                    <div className="space-y-2">
                      <Label>পুকুর (ঐচ্ছিক)</Label>
                      <Select value={newAlert.pond_id} onValueChange={(v) => setNewAlert((p) => ({ ...p, pond_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="পুকুর নির্বাচন করুন" /></SelectTrigger>
                        <SelectContent>
                          {ponds.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>গুরুত্ব</Label>
                    <Select value={newAlert.priority} onValueChange={(v) => setNewAlert((p) => ({ ...p, priority: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">সাধারণ</SelectItem>
                        <SelectItem value="medium">মাঝারি</SelectItem>
                        <SelectItem value="high">গুরুত্বপূর্ণ</SelectItem>
                        <SelectItem value="critical">জরুরি</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={newAlert.is_recurring} onCheckedChange={(c) => setNewAlert((p) => ({ ...p, is_recurring: !!c }))} />
                    <Label>পুনরাবৃত্তি অ্যালার্ট</Label>
                  </div>
                  {newAlert.is_recurring && (
                    <Select value={newAlert.recurrence_interval} onValueChange={(v) => setNewAlert((p) => ({ ...p, recurrence_interval: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">প্রতিদিন</SelectItem>
                        <SelectItem value="weekly">সাপ্তাহিক</SelectItem>
                        <SelectItem value="monthly">মাসিক</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Button onClick={createAlert} className="w-full">অ্যালার্ট তৈরি করুন</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "আজকের অ্যালার্ট", count: todayAlerts.length, icon: Clock, color: "text-amber-500" },
            { label: "আসন্ন", count: upcomingAlerts.length, icon: Calendar, color: "text-blue-500" },
            { label: "ওভারডিউ", count: overdueAlerts.length, icon: AlertTriangle, color: "text-destructive" },
            { label: "সম্পন্ন", count: completedAlerts.length, icon: CheckCircle2, color: "text-emerald-500" },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={`h-8 w-8 ${s.color}`} />
                <div>
                  <p className="text-2xl font-bold">{s.count}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today">আজকে ({todayAlerts.length})</TabsTrigger>
            <TabsTrigger value="upcoming">আসন্ন ({upcomingAlerts.length})</TabsTrigger>
            <TabsTrigger value="completed">সম্পন্ন</TabsTrigger>
            <TabsTrigger value="settings">সেটিংস</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-3 mt-4">
            {overdueAlerts.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> ওভারডিউ অ্যালার্ট ({overdueAlerts.length})
                </h3>
                {overdueAlerts.map(renderAlert)}
              </div>
            )}
            {todayAlerts.length === 0 && overdueAlerts.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>আজকে কোনো অ্যালার্ট নেই</p>
                <Button onClick={generateSmartAlerts} variant="outline" size="sm" className="mt-3">
                  <Sparkles className="h-4 w-4 mr-1" /> স্মার্ট অ্যালার্ট তৈরি করুন
                </Button>
              </CardContent></Card>
            ) : todayAlerts.map(renderAlert)}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-3 mt-4">
            {upcomingAlerts.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>কোনো আসন্ন অ্যালার্ট নেই</p>
              </CardContent></Card>
            ) : upcomingAlerts.map(renderAlert)}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3 mt-4">
            {completedAlerts.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>কোনো সম্পন্ন অ্যালার্ট নেই</p>
              </CardContent></Card>
            ) : completedAlerts.slice(0, 20).map(renderAlert)}
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> অ্যালার্ট সেটিংস</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                {/* Feed Reminder */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">খাদ্য রিমাইন্ডার</p>
                    <p className="text-xs text-muted-foreground">দৈনিক খাদ্য প্রদানের সময়সূচী</p>
                  </div>
                  <Switch checked={settings.feed_reminder_enabled} onCheckedChange={(c) => setSettings((p) => ({ ...p, feed_reminder_enabled: c }))} />
                </div>

                {/* Medicine */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">ঔষধ রিমাইন্ডার</p>
                    <p className="text-xs text-muted-foreground">ঔষধ প্রয়োগের সময়সূচী</p>
                  </div>
                  <Switch checked={settings.medicine_reminder_enabled} onCheckedChange={(c) => setSettings((p) => ({ ...p, medicine_reminder_enabled: c }))} />
                </div>

                {/* Water check */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">পানি পরীক্ষা রিমাইন্ডার</p>
                      <p className="text-xs text-muted-foreground">প্রতি কত দিনে পানি পরীক্ষা</p>
                    </div>
                    <Switch checked={settings.water_check_enabled} onCheckedChange={(c) => setSettings((p) => ({ ...p, water_check_enabled: c }))} />
                  </div>
                  {settings.water_check_enabled && (
                    <div className="flex items-center gap-2 ml-4">
                      <Input type="number" className="w-20" value={settings.water_check_interval_days}
                        onChange={(e) => setSettings((p) => ({ ...p, water_check_interval_days: parseInt(e.target.value) || 7 }))} />
                      <span className="text-sm text-muted-foreground">দিন পর পর</span>
                    </div>
                  )}
                </div>

                {/* Sampling */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">স্যাম্পলিং রিমাইন্ডার</p>
                      <p className="text-xs text-muted-foreground">মাছের ওজন পরীক্ষার জন্য</p>
                    </div>
                    <Switch checked={settings.sampling_reminder_enabled} onCheckedChange={(c) => setSettings((p) => ({ ...p, sampling_reminder_enabled: c }))} />
                  </div>
                  {settings.sampling_reminder_enabled && (
                    <div className="flex items-center gap-2 ml-4">
                      <Input type="number" className="w-20" value={settings.sampling_interval_days}
                        onChange={(e) => setSettings((p) => ({ ...p, sampling_interval_days: parseInt(e.target.value) || 30 }))} />
                      <span className="text-sm text-muted-foreground">দিন পর পর</span>
                    </div>
                  )}
                </div>

                {/* Harvest reminder */}
                <div className="space-y-2">
                  <p className="font-medium text-sm">মাছ ধরার রিমাইন্ডার</p>
                  <div className="flex items-center gap-2">
                    <Input type="number" className="w-20" value={settings.harvest_reminder_days_before}
                      onChange={(e) => setSettings((p) => ({ ...p, harvest_reminder_days_before: parseInt(e.target.value) || 10 }))} />
                    <span className="text-sm text-muted-foreground">দিন আগে রিমাইন্ডার</span>
                  </div>
                </div>

                <Button onClick={saveSettings} className="w-full">সেটিংস সংরক্ষণ করুন</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
