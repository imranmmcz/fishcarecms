import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  CloudUpload, HardDrive, Loader2, CheckCircle, 
  RefreshCw, Trash2, Clock, FileJson,
  Database, Shield, DownloadCloud, Settings, BarChart3, Mail, Timer, Play, Pause,
  Link2, Unlink, Eye, EyeOff, Save, ExternalLink, KeyRound
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminBackup = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupLogs, setBackupLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [backupStats, setBackupStats] = useState<{ total_size: number; total_count: number; oldest_backup: string | null }>({ total_size: 0, total_count: 0, oldest_backup: null });
  const [maxBackups, setMaxBackups] = useState(10);
  const [maxSizeMB, setMaxSizeMB] = useState(500);
  const [retentionDays, setRetentionDays] = useState(30);
  const [emailNotification, setEmailNotification] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [cronEnabled, setCronEnabled] = useState(false);
  const [cronSchedule, setCronSchedule] = useState('0 2 * * *');
  const [isSavingCron, setIsSavingCron] = useState(false);
  const [cronStatus, setCronStatus] = useState<{ active: boolean; schedule: string | null } | null>(null);

  // Google Drive states
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isSavingGoogle, setIsSavingGoogle] = useState(false);
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveEmail, setDriveEmail] = useState('');
  const [driveConnectedAt, setDriveConnectedAt] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCheckingDrive, setIsCheckingDrive] = useState(true);
  const loadBackupLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const { data } = await supabase.from("backup_logs").select("*").order("created_at", { ascending: false }).limit(20);
      setBackupLogs(data || []);
      // Calculate stats
      const totalSize = (data || []).reduce((s, l) => s + (l.file_size || 0), 0);
      const oldest = data && data.length > 0 ? data[data.length - 1].created_at : null;
      setBackupStats({ total_size: totalSize, total_count: (data || []).length, oldest_backup: oldest });
    } catch (e) { console.error(e); }
    finally { setIsLoadingLogs(false); }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const { data } = await supabase.from("system_settings").select("setting_key, setting_value").like("setting_key", "backup_%");
      const settings = data || [];
      const findVal = (key: string) => settings.find((s) => s.setting_key === key)?.setting_value;
      if (findVal('backup_max_count')) setMaxBackups(parseInt(findVal('backup_max_count')!));
      if (findVal('backup_max_size_mb')) setMaxSizeMB(parseInt(findVal('backup_max_size_mb')!));
      if (findVal('backup_retention_days')) setRetentionDays(parseInt(findVal('backup_retention_days')!));
      if (findVal('backup_email_notification')) setEmailNotification(findVal('backup_email_notification') !== 'false');
      if (findVal('backup_cron_enabled')) setCronEnabled(findVal('backup_cron_enabled') === 'true');
      if (findVal('backup_cron_schedule')) setCronSchedule(findVal('backup_cron_schedule')!);
    } catch (e) { console.error(e); }
  }, []);

  const loadCronStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('manage_backup_cron', { _action: 'status' });
      if (!error && data) setCronStatus(data as any);
    } catch (e) { console.error(e); }
  }, []);

  // Google Drive functions
  const loadGoogleSettings = useCallback(async () => {
    try {
      const { data } = await supabase.from("system_settings").select("setting_key, setting_value")
        .in("setting_key", ["google_client_id", "google_client_secret"]);
      const settings = data || [];
      const findVal = (key: string) => settings.find((s) => s.setting_key === key)?.setting_value || '';
      setGoogleClientId(findVal('google_client_id'));
      setGoogleClientSecret(findVal('google_client_secret'));
    } catch (e) { console.error(e); }
  }, []);

  const checkDriveConnection = useCallback(async () => {
    setIsCheckingDrive(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-auth', {
        body: { action: 'check_connection' }
      });
      if (!error && data) {
        setDriveConnected(data.connected);
        setDriveEmail(data.drive_email || '');
        setDriveConnectedAt(data.connected_at || '');
      }
    } catch (e) { console.error(e); }
    finally { setIsCheckingDrive(false); }
  }, []);

  const saveGoogleCredentials = async () => {
    setIsSavingGoogle(true);
    try {
      const settingsToSave = [
        { key: 'google_client_id', value: googleClientId, desc: 'Google OAuth Client ID' },
        { key: 'google_client_secret', value: googleClientSecret, desc: 'Google OAuth Client Secret' },
      ];
      for (const s of settingsToSave) {
        await supabase.from("system_settings").upsert(
          { setting_key: s.key, setting_value: s.value, description: s.desc },
          { onConflict: "setting_key" }
        );
      }
      toast({ title: "সফল", description: "Google OAuth ক্রেডেনশিয়াল সংরক্ষিত হয়েছে" });
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally { setIsSavingGoogle(false); }
  };

  const connectGoogleDrive = async () => {
    setIsConnecting(true);
    try {
      const redirectUri = window.location.origin + '/admin/backup';
      const { data, error } = await supabase.functions.invoke('google-drive-auth', {
        body: { action: 'get_auth_url', redirect_uri: redirectUri }
      });
      if (error) throw error;
      if (data?.auth_url) {
        window.location.href = data.auth_url;
      } else {
        toast({ title: "ত্রুটি", description: "Google OAuth URL তৈরি করতে সমস্যা হয়েছে। Client ID ও Secret সঠিকভাবে কনফিগার করা আছে কিনা নিশ্চিত করুন।", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally { setIsConnecting(false); }
  };

  const disconnectGoogleDrive = async () => {
    try {
      const { error } = await supabase.functions.invoke('google-drive-auth', {
        body: { action: 'disconnect' }
      });
      if (error) throw error;
      setDriveConnected(false);
      setDriveEmail('');
      setDriveConnectedAt('');
      toast({ title: "সফল", description: "Google Drive সংযোগ বিচ্ছিন্ন হয়েছে" });
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    }
  };

  // Handle OAuth callback code
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      const exchangeCode = async () => {
        try {
          const redirectUri = window.location.origin + '/admin/backup';
          const { data, error } = await supabase.functions.invoke('google-drive-auth', {
            body: { action: 'exchange_code', code, redirect_uri: redirectUri }
          });
          if (error) throw error;
          if (data?.success) {
            setDriveConnected(true);
            setDriveEmail(data.drive_email || '');
            toast({ title: "সফল", description: "Google Drive সফলভাবে সংযুক্ত হয়েছে!" });
          }
        } catch (e: any) {
          toast({ title: "ত্রুটি", description: "Google Drive সংযোগ করতে সমস্যা হয়েছে", variant: "destructive" });
        }
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      };
      exchangeCode();
    }
  }, [toast]);

  useEffect(() => { loadBackupLogs(); loadSettings(); loadCronStatus(); loadGoogleSettings(); checkDriveConnection(); }, [loadBackupLogs, loadSettings, loadCronStatus, loadGoogleSettings, checkDriveConnection]);

  const createBackup = async () => {
    setIsBackingUp(true);
    try {
      // Create a backup log entry
      const { error } = await supabase.from("backup_logs").insert({
        user_id: user?.id, backup_scope: 'system', backup_type: 'manual',
        status: 'completed', file_name: `backup_${new Date().toISOString().split('T')[0]}.json`,
      });
      if (error) throw error;
      toast({ title: "সফল", description: "সিস্টেম ব্যাকআপ রেকর্ড তৈরি হয়েছে" });
      loadBackupLogs();
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally { setIsBackingUp(false); }
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const settingsToSave = [
        { key: 'backup_max_count', value: String(maxBackups), desc: 'সর্বোচ্চ ব্যাকআপ সংখ্যা' },
        { key: 'backup_max_size_mb', value: String(maxSizeMB), desc: 'সর্বোচ্চ ব্যাকআপ সাইজ (MB)' },
        { key: 'backup_retention_days', value: String(retentionDays), desc: 'ব্যাকআপ রিটেনশন দিন' },
        { key: 'backup_email_notification', value: String(emailNotification), desc: 'ব্যাকআপ ইমেইল নোটিফিকেশন' },
      ];
      for (const s of settingsToSave) {
        await supabase.from("system_settings").upsert({ setting_key: s.key, setting_value: s.value, description: s.desc }, { onConflict: "setting_key" });
      }
      toast({ title: "সফল", description: "ব্যাকআপ সেটিংস সংরক্ষিত হয়েছে" });
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally { setIsSavingSettings(false); }
  };

  const saveCronSettings = async () => {
    setIsSavingCron(true);
    try {
      const action = cronEnabled ? 'create' : 'disable';
      const { data, error } = await supabase.rpc('manage_backup_cron', { 
        _action: action, 
        _schedule: cronSchedule,
        _backup_scope: 'system'
      });
      if (error) throw error;
      toast({ title: "সফল", description: cronEnabled ? `স্বয়ংক্রিয় ব্যাকআপ সক্রিয় হয়েছে (${getCronLabel(cronSchedule)})` : "স্বয়ংক্রিয় ব্যাকআপ বন্ধ হয়েছে" });
      loadCronStatus();
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally { setIsSavingCron(false); }
  };

  const getCronLabel = (cron: string) => {
    const labels: Record<string, string> = {
      '0 2 * * *': 'প্রতিদিন রাত ২:০০',
      '0 3 * * 0': 'প্রতি রবিবার রাত ৩:০০',
      '0 2 1,15 * *': 'মাসে ২ বার (১ ও ১৫ তারিখ)',
      '0 2 1 * *': 'মাসে ১ বার (১ তারিখ)',
      '0 */6 * * *': 'প্রতি ৬ ঘণ্টায়',
      '0 */12 * * *': 'প্রতি ১২ ঘণ্টায়',
    };
    return labels[cron] || cron;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500/20 text-green-700">সম্পন্ন</Badge>;
      case 'in_progress': return <Badge className="bg-blue-500/20 text-blue-700">চলমান</Badge>;
      case 'failed': return <Badge variant="destructive">ব্যর্থ</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Shield className="h-6 w-6 text-primary" />সিস্টেম ব্যাকআপ</h1>
            <p className="text-muted-foreground">সম্পূর্ণ সিস্টেম ব্যাকআপ ও রিস্টোর ম্যানেজমেন্ট</p>
          </div>
          <Button variant="outline" onClick={loadBackupLogs}><RefreshCw className="h-4 w-4 mr-2" />রিফ্রেশ</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><BarChart3 className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{backupStats.total_count}</p><p className="text-sm text-muted-foreground">মোট ব্যাকআপ</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><HardDrive className="h-8 w-8 text-blue-500" /><div><p className="text-2xl font-bold">{formatSize(backupStats.total_size)}</p><p className="text-sm text-muted-foreground">মোট সাইজ</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-orange-500" /><div><p className="text-2xl font-bold">{backupStats.oldest_backup ? new Date(backupStats.oldest_backup).toLocaleDateString('bn-BD') : 'N/A'}</p><p className="text-sm text-muted-foreground">সবচেয়ে পুরানো</p></div></div></CardContent></Card>
        </div>

        <Card className="border-orange-500/20">
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-orange-500" />ব্যাকআপ লিমিট ও স্বয়ংক্রিয় ক্লিনআপ</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>সর্বোচ্চ ব্যাকআপ সংখ্যা</Label><Input type="number" min={1} max={100} value={maxBackups} onChange={(e) => setMaxBackups(parseInt(e.target.value) || 10)} /></div>
              <div className="space-y-2"><Label>সর্বোচ্চ সাইজ (MB)</Label><Input type="number" min={10} max={10000} value={maxSizeMB} onChange={(e) => setMaxSizeMB(parseInt(e.target.value) || 500)} /></div>
              <div className="space-y-2"><Label>রিটেনশন দিন</Label><Input type="number" min={1} max={365} value={retentionDays} onChange={(e) => setRetentionDays(parseInt(e.target.value) || 30)} /></div>
            </div>
            <div className="flex items-center gap-3"><Switch checked={emailNotification} onCheckedChange={setEmailNotification} /><Label className="flex items-center gap-2"><Mail className="h-4 w-4" />ইমেইল নোটিফিকেশন</Label></div>
            <Button onClick={saveSettings} disabled={isSavingSettings}>{isSavingSettings ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}সেটিংস সেভ করুন</Button>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Timer className="h-5 w-5 text-primary" />স্বয়ংক্রিয় ব্যাকআপ (Cron Job)</CardTitle>
            <CardDescription>নির্ধারিত সময়ে স্বয়ংক্রিয়ভাবে ব্যাকআপ নেওয়া হবে</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch checked={cronEnabled} onCheckedChange={setCronEnabled} />
              <Label className="flex items-center gap-2">
                {cronEnabled ? <Play className="h-4 w-4 text-green-500" /> : <Pause className="h-4 w-4 text-muted-foreground" />}
                {cronEnabled ? 'স্বয়ংক্রিয় ব্যাকআপ সক্রিয়' : 'স্বয়ংক্রিয় ব্যাকআপ বন্ধ'}
              </Label>
            </div>
            {cronEnabled && (
              <div className="space-y-2">
                <Label>শিডিউল নির্বাচন করুন</Label>
                <Select value={cronSchedule} onValueChange={setCronSchedule}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0 */6 * * *">প্রতি ৬ ঘণ্টায়</SelectItem>
                    <SelectItem value="0 */12 * * *">প্রতি ১২ ঘণ্টায়</SelectItem>
                    <SelectItem value="0 2 * * *">প্রতিদিন রাত ২:০০</SelectItem>
                    <SelectItem value="0 3 * * 0">প্রতি রবিবার রাত ৩:০০</SelectItem>
                    <SelectItem value="0 2 1,15 * *">মাসে ২ বার (১ ও ১৫ তারিখ)</SelectItem>
                    <SelectItem value="0 2 1 * *">মাসে ১ বার (১ তারিখ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {cronStatus && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">বর্তমান স্ট্যাটাস:</span>
                {cronStatus.active ? (
                  <Badge className="bg-green-500/20 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />সক্রিয় — {getCronLabel(cronStatus.schedule || '')}</Badge>
                ) : (
                  <Badge variant="outline">নিষ্ক্রিয়</Badge>
                )}
              </div>
            )}
            <Button onClick={saveCronSettings} disabled={isSavingCron}>
              {isSavingCron ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Timer className="h-4 w-4 mr-2" />}
              Cron Job সেভ করুন
            </Button>
          </CardContent>
        </Card>

        <Card className="border-green-500/20">
          <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-green-500" />সিস্টেম ব্যাকআপ</CardTitle></CardHeader>
          <CardContent>
            <Button onClick={createBackup} disabled={isBackingUp} className="w-full bg-gradient-to-r from-green-500 to-emerald-600">
              {isBackingUp ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />ব্যাকআপ তৈরি হচ্ছে...</> : <><CloudUpload className="mr-2 h-4 w-4" />সম্পূর্ণ সিস্টেম ব্যাকআপ</>}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-muted-foreground" />ব্যাকআপ ইতিহাস</CardTitle></CardHeader>
          <CardContent>
            {isLoadingLogs ? <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            : backupLogs.length === 0 ? <p className="text-center text-muted-foreground py-8">কোনো ব্যাকআপ রেকর্ড নেই</p>
            : <div className="space-y-2 max-h-64 overflow-y-auto">
                {backupLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(log.status)}
                      <div><p className="text-sm font-medium">{log.file_name || 'ব্যাকআপ'}</p><p className="text-xs text-muted-foreground">{new Date(log.started_at).toLocaleString('bn-BD')}</p></div>
                    </div>
                    {log.file_size && <span className="text-xs text-muted-foreground">{formatSize(log.file_size)}</span>}
                  </div>
                ))}
              </div>}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminBackup;
