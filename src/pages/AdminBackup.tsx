import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api-client";
import { 
  CloudUpload, CloudDownload, HardDrive, Loader2, CheckCircle, 
  AlertCircle, RefreshCw, Trash2, Clock, FileJson, Link2, Link2Off, 
  Database, Shield, DownloadCloud, Settings, BarChart3, Mail
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

const AdminBackup = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [driveEmail, setDriveEmail] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [backupLogs, setBackupLogs] = useState<any[]>([]);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [backupStats, setBackupStats] = useState<{ total_size: number; total_count: number; oldest_backup: string | null }>({ total_size: 0, total_count: 0, oldest_backup: null });
  const [maxBackups, setMaxBackups] = useState(10);
  const [maxSizeMB, setMaxSizeMB] = useState(500);
  const [retentionDays, setRetentionDays] = useState(30);
  const [emailNotification, setEmailNotification] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const checkConnection = useCallback(async () => {
    if (!user) return;
    try {
      const res = await apiClient.checkDriveConnection();
      setIsConnected(res.data?.connected || false);
      setDriveEmail(res.data?.drive_email || "");
    } catch (e) { console.error(e); }
  }, [user]);

  const loadBackupLogs = useCallback(async () => {
    if (!user) return;
    setIsLoadingLogs(true);
    try {
      const res = await apiClient.listBackups();
      setBackupLogs(res.data?.backups || []);
    } catch (e) { console.error(e); }
    finally { setIsLoadingLogs(false); }
  }, [user]);

  const loadBackupStats = useCallback(async () => {
    if (!user) return;
    try {
      const res = await apiClient.getBackupStats();
      if (res.data) setBackupStats(res.data as any);
    } catch (e) { console.error(e); }
  }, [user]);

  const loadSettings = useCallback(async () => {
    try {
      const res = await apiClient.getSettings();
      const settings = res.data?.settings || [];
      const findVal = (key: string) => settings.find((s: any) => s.setting_key === key)?.setting_value;
      if (findVal('backup_max_count')) setMaxBackups(parseInt(findVal('backup_max_count')!));
      if (findVal('backup_max_size_mb')) setMaxSizeMB(parseInt(findVal('backup_max_size_mb')!));
      if (findVal('backup_retention_days')) setRetentionDays(parseInt(findVal('backup_retention_days')!));
      if (findVal('backup_email_notification')) setEmailNotification(findVal('backup_email_notification') !== 'false');
    } catch (e) { console.error(e); }
  }, []);

  const loadDriveFiles = useCallback(async () => {
    if (!user || !isConnected) return;
    try {
      const res = await apiClient.listDriveBackups();
      setDriveFiles(res.data?.files || []);
    } catch (e) { console.error(e); }
  }, [user, isConnected]);

  useEffect(() => {
    checkConnection(); loadBackupLogs(); loadBackupStats(); loadSettings();
  }, [checkConnection, loadBackupLogs, loadBackupStats, loadSettings]);

  useEffect(() => {
    if (isConnected) loadDriveFiles();
  }, [isConnected, loadDriveFiles]);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && user) {
      const exchangeCode = async () => {
        setIsConnecting(true);
        try {
          const redirectUri = `${window.location.origin}/admin/backup`;
          const res = await apiClient.exchangeDriveCode(code, redirectUri);
          if (res.error) throw new Error(res.error);
          if (res.data?.success) {
            setIsConnected(true);
            setDriveEmail(res.data.drive_email || "");
            toast({ title: "সফল", description: "Google Drive সংযুক্ত হয়েছে" });
            window.history.replaceState({}, '', '/admin/backup');
            loadDriveFiles();
          }
        } catch (e: any) {
          toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
        } finally { setIsConnecting(false); }
      };
      exchangeCode();
    }
  }, [user]);

  const connectGoogleDrive = async () => {
    setIsConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/admin/backup`;
      const res = await apiClient.getDriveAuthUrl(redirectUri);
      if (res.data?.auth_url) window.location.href = res.data.auth_url;
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
      setIsConnecting(false);
    }
  };

  const disconnectDrive = async () => {
    try {
      await apiClient.disconnectDrive();
      setIsConnected(false); setDriveEmail(""); setDriveFiles([]);
      toast({ title: "সফল", description: "Google Drive সংযোগ বিচ্ছিন্ন হয়েছে" });
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    }
  };

  const createBackup = async () => {
    setIsBackingUp(true);
    try {
      const res = await apiClient.createBackup('system');
      if (res.error) throw new Error(res.error);
      const data = res.data as any;
      const cleanupCount = (data?.auto_cleanup?.deleted || 0) + (data?.retention_cleanup?.deleted || 0);
      const cleanupMsg = cleanupCount > 0 ? ` (${cleanupCount}টি পুরানো ব্যাকআপ মুছে ফেলা হয়েছে)` : '';
      toast({
        title: "সফল",
        description: (data?.google_drive_uploaded 
          ? "সিস্টেম ব্যাকআপ Google Drive এ আপলোড হয়েছে" 
          : "সিস্টেম ব্যাকআপ তৈরি হয়েছে") + cleanupMsg,
      });
      loadBackupLogs(); loadBackupStats();
      if (isConnected) loadDriveFiles();
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally { setIsBackingUp(false); }
  };

  const manualCleanup = async () => {
    if (!confirm('আপনি কি নিশ্চিত? পুরানো ব্যাকআপ স্থায়ীভাবে মুছে ফেলা হবে।')) return;
    setIsCleaning(true);
    try {
      const res = await apiClient.cleanupBackups({ max_backups: maxBackups, max_size_mb: maxSizeMB });
      if (res.error) throw new Error(res.error);
      toast({ title: "সফল", description: `${(res.data as any)?.deleted || 0}টি পুরানো ব্যাকআপ মুছে ফেলা হয়েছে` });
      loadBackupLogs(); loadBackupStats();
      if (isConnected) loadDriveFiles();
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally { setIsCleaning(false); }
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const settingsToSave = [
        { key: 'backup_max_count', value: String(maxBackups), description: 'সর্বোচ্চ ব্যাকআপ সংখ্যা' },
        { key: 'backup_max_size_mb', value: String(maxSizeMB), description: 'সর্বোচ্চ ব্যাকআপ সাইজ (MB)' },
        { key: 'backup_retention_days', value: String(retentionDays), description: 'ব্যাকআপ রিটেনশন দিন' },
        { key: 'backup_email_notification', value: String(emailNotification), description: 'ব্যাকআপ ইমেইল নোটিফিকেশন' },
      ];
      for (const s of settingsToSave) {
        await apiClient.updateSetting(s.key, s.value, s.description);
      }
      toast({ title: "সফল", description: "ব্যাকআপ সেটিংস সংরক্ষিত হয়েছে" });
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally { setIsSavingSettings(false); }
  };

  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const downloadBackup = async (logId?: string, driveFileId?: string, fileName?: string) => {
    const key = logId || driveFileId || '';
    setIsDownloading(key);
    try {
      const res = await apiClient.downloadBackup(logId, driveFileId);
      if (res.error) throw new Error(res.error);
      const data = res.data as any;
      if (!data?.backup_content) throw new Error('ব্যাকআপ ডেটা পাওয়া যায়নি');
      const content = typeof data.backup_content === 'string' ? data.backup_content : JSON.stringify(data.backup_content, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.file_name || fileName || `backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "সফল", description: "ব্যাকআপ ফাইল ডাউনলোড হয়েছে" });
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally { setIsDownloading(null); }
  };

  const restoreBackup = async (fileId: string) => {
    if (!confirm('আপনি কি নিশ্চিত? এটি বিদ্যমান ডেটা প্রতিস্থাপন করবে।')) return;
    setIsRestoring(true);
    try {
      const res = await apiClient.restoreBackup(fileId);
      if (res.error) throw new Error(res.error);
      toast({ title: "সফল", description: `${(res.data as any)?.restored_tables?.length || 0}টি টেবিল পুনরুদ্ধার হয়েছে` });
      loadBackupLogs();
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally { setIsRestoring(false); }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500/20 text-green-700">সম্পন্ন</Badge>;
      case 'completed_local': return <Badge className="bg-yellow-500/20 text-yellow-700">লোকাল</Badge>;
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
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              সিস্টেম ব্যাকআপ
            </h1>
            <p className="text-muted-foreground">সম্পূর্ণ সিস্টেম ব্যাকআপ ও রিস্টোর ম্যানেজমেন্ট</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { loadBackupLogs(); loadDriveFiles(); loadBackupStats(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />রিফ্রেশ
            </Button>
          </div>
        </div>

        {/* Backup Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><BarChart3 className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{backupStats.total_count}</p><p className="text-sm text-muted-foreground">মোট ব্যাকআপ</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><HardDrive className="h-8 w-8 text-blue-500" /><div><p className="text-2xl font-bold">{formatSize(backupStats.total_size)}</p><p className="text-sm text-muted-foreground">মোট সাইজ</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-orange-500" /><div><p className="text-2xl font-bold">{backupStats.oldest_backup ? new Date(backupStats.oldest_backup).toLocaleDateString('bn-BD') : 'N/A'}</p><p className="text-sm text-muted-foreground">সবচেয়ে পুরানো</p></div></div></CardContent></Card>
        </div>

        {/* Settings */}
        <Card className="border-orange-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-orange-500" />ব্যাকআপ লিমিট ও স্বয়ংক্রিয় ক্লিনআপ</CardTitle>
            <CardDescription>সর্বোচ্চ ব্যাকআপ সংখ্যা, সাইজ ও রিটেনশন দিন নির্ধারণ করুন।</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>সর্বোচ্চ ব্যাকআপ সংখ্যা</Label><Input type="number" min={1} max={100} value={maxBackups} onChange={(e) => setMaxBackups(parseInt(e.target.value) || 10)} /></div>
              <div className="space-y-2"><Label>সর্বোচ্চ সাইজ (MB)</Label><Input type="number" min={10} max={10000} value={maxSizeMB} onChange={(e) => setMaxSizeMB(parseInt(e.target.value) || 500)} /></div>
              <div className="space-y-2"><Label>রিটেনশন দিন</Label><Input type="number" min={1} max={365} value={retentionDays} onChange={(e) => setRetentionDays(parseInt(e.target.value) || 30)} /></div>
            </div>
            <div className="flex items-center gap-3"><Switch checked={emailNotification} onCheckedChange={setEmailNotification} /><Label className="flex items-center gap-2"><Mail className="h-4 w-4" />ইমেইল নোটিফিকেশন</Label></div>
            <div className="flex gap-2">
              <Button onClick={saveSettings} disabled={isSavingSettings}>{isSavingSettings ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}সেটিংস সেভ করুন</Button>
              <Button variant="outline" onClick={manualCleanup} disabled={isCleaning}>{isCleaning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}ম্যানুয়াল ক্লিনআপ</Button>
            </div>
          </CardContent>
        </Card>

        {/* Google Drive Connection */}
        <Card className="border-primary/20">
          <CardHeader><CardTitle className="flex items-center gap-2"><HardDrive className="h-5 w-5 text-primary" />Google Drive সংযোগ</CardTitle></CardHeader>
          <CardContent>
            {isConnected ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 text-green-600"><CheckCircle className="h-5 w-5" /><div><p className="font-medium">সংযুক্ত</p><p className="text-sm text-muted-foreground">{driveEmail}</p></div></div>
                <Button variant="outline" size="sm" onClick={disconnectDrive}><Link2Off className="h-4 w-4 mr-2" />সংযোগ বিচ্ছিন্ন</Button>
              </div>
            ) : (
              <Button onClick={connectGoogleDrive} disabled={isConnecting} className="bg-blue-600 hover:bg-blue-700">
                {isConnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}Google Drive সংযুক্ত করুন
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Create Backup */}
        <Card className="border-green-500/20">
          <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-green-500" />সিস্টেম ব্যাকআপ</CardTitle></CardHeader>
          <CardContent>
            <Button onClick={createBackup} disabled={isBackingUp} className="w-full bg-gradient-to-r from-green-500 to-emerald-600">
              {isBackingUp ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />ব্যাকআপ তৈরি হচ্ছে...</> : <><CloudUpload className="mr-2 h-4 w-4" />সম্পূর্ণ সিস্টেম ব্যাকআপ</>}
            </Button>
          </CardContent>
        </Card>

        {/* Drive Files */}
        {isConnected && driveFiles.length > 0 && (
          <Card className="border-blue-500/20">
            <CardHeader><CardTitle className="flex items-center gap-2"><DownloadCloud className="h-5 w-5 text-blue-500" />Google Drive ফাইল</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {driveFiles.map((file: any) => (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/80">
                    <div className="flex items-center gap-2"><FileJson className="h-4 w-4 text-blue-500" /><div><p className="text-sm font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{new Date(file.createdTime).toLocaleDateString('bn-BD')}</p></div></div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => downloadBackup(undefined, file.id, file.name)} disabled={isDownloading === file.id}>{isDownloading === file.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}</Button>
                      <Button size="sm" variant="outline" onClick={() => restoreBackup(file.id)} disabled={isRestoring}>{isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CloudDownload className="mr-1 h-4 w-4" />রিস্টোর</>}</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Backup Logs */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-muted-foreground" />ব্যাকআপ লগ</CardTitle></CardHeader>
          <CardContent>
            {isLoadingLogs ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : backupLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">কোনো ব্যাকআপ রেকর্ড নেই</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {backupLogs.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(log.status)}
                      <div>
                        <p className="text-sm font-medium">{log.file_name || 'ব্যাকআপ'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(log.started_at).toLocaleString('bn-BD')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {log.file_size && <span className="text-xs text-muted-foreground">{formatSize(log.file_size)}</span>}
                      <Button size="sm" variant="ghost" onClick={() => downloadBackup(log.id)} disabled={isDownloading === log.id}>
                        {isDownloading === log.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminBackup;
