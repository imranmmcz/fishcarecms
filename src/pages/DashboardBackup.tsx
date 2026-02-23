import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api-client";
import { 
  CloudUpload, CloudDownload, HardDrive, Loader2, CheckCircle, 
  AlertCircle, RefreshCw, FileJson, Link2, Link2Off, Clock, 
  DownloadCloud, User
} from "lucide-react";
import { Input } from "@/components/ui/input";

const DashboardBackup = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [driveEmail, setDriveEmail] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupLogs, setBackupLogs] = useState<any[]>([]);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
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

  const loadDriveFiles = useCallback(async () => {
    if (!user || !isConnected) return;
    try {
      const res = await apiClient.listDriveBackups();
      setDriveFiles(res.data?.files || []);
    } catch (e) { console.error(e); }
  }, [user, isConnected]);

  useEffect(() => { checkConnection(); loadBackupLogs(); }, [checkConnection, loadBackupLogs]);
  useEffect(() => { if (isConnected) loadDriveFiles(); }, [isConnected, loadDriveFiles]);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && user) {
      const exchangeCode = async () => {
        setIsConnecting(true);
        try {
          const redirectUri = `${window.location.origin}/dashboard/backup`;
          const res = await apiClient.exchangeDriveCode(code, redirectUri);
          if (res.error) throw new Error(res.error);
          if (res.data?.success) {
            setIsConnected(true);
            setDriveEmail(res.data.drive_email || "");
            toast({ title: "সফল", description: "Google Drive সংযুক্ত হয়েছে" });
            window.history.replaceState({}, '', '/dashboard/backup');
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
      const redirectUri = `${window.location.origin}/dashboard/backup`;
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

  const getAllLocalStorageData = () => {
    const data: Record<string, any> = {};
    const keys = ['farmingPondData', 'farmingFishStockingData', 'farmerIncomes',
      'farmerExpenses', 'farmerPonds', 'feedManagementData', 'waterQualityData',
      'medicineData', 'fertilizerData', 'biomassData'];
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) { try { data[key] = JSON.parse(value); } catch { data[key] = value; } }
    });
    return data;
  };

  const createBackup = async () => {
    setIsBackingUp(true);
    try {
      const res = await apiClient.createBackup('user');
      if (res.error) throw new Error(res.error);
      const data = res.data as any;

      if (!data?.google_drive_uploaded && data?.backup_data) {
        const localData = { ...data.backup_data, localStorage: getAllLocalStorageData() };
        const blob = new Blob([JSON.stringify(localData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = data.file_name; a.click();
        URL.revokeObjectURL(url);
      }

      toast({
        title: "সফল",
        description: data?.google_drive_uploaded ? "ব্যাকআপ Google Drive এ আপলোড হয়েছে" : "ব্যাকআপ ফাইল ডাউনলোড হয়েছে",
      });
      loadBackupLogs();
      if (isConnected) loadDriveFiles();
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally { setIsBackingUp(false); }
  };

  const restoreFromDrive = async (fileId: string) => {
    if (!confirm('আপনি কি নিশ্চিত? এটি আপনার বর্তমান ডেটা প্রতিস্থাপন করবে।')) return;
    setIsRestoring(true);
    try {
      const res = await apiClient.restoreBackup(fileId);
      if (res.error) throw new Error(res.error);
      const data = res.data as any;
      if (data?.local_storage_data?.localStorage) {
        Object.entries(data.local_storage_data.localStorage).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
        });
      }
      toast({ title: "সফল", description: "ডেটা পুনরুদ্ধার হয়েছে" });
      loadBackupLogs();
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally { setIsRestoring(false); }
  };

  const handleLocalRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.localStorage) {
          Object.entries(data.localStorage).forEach(([key, value]) => {
            localStorage.setItem(key, JSON.stringify(value));
          });
        }
        toast({ title: "সফল", description: "ডেটা সফলভাবে পুনরুদ্ধার হয়েছে" });
      } catch {
        toast({ title: "ত্রুটি", description: "ফাইল পড়তে সমস্যা হয়েছে", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const handleLocalBackup = () => {
    const data = getAllLocalStorageData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `user_backup_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast({ title: "সফল", description: "ব্যাকআপ ফাইল ডাউনলোড হয়েছে" });
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
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />ব্যাকআপ ও রিস্টোর
          </h1>
          <p className="text-muted-foreground">আপনার ব্যক্তিগত ডেটা Google Drive এ সংরক্ষণ করুন</p>
        </div>

        {/* Google Drive Connection */}
        <Card className="border-primary/20">
          <CardHeader><CardTitle className="flex items-center gap-2"><HardDrive className="h-5 w-5 text-primary" />Google Drive সংযোগ</CardTitle><CardDescription>একবার সংযুক্ত করলে পুনরায় লগইন করতে হবে না</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {isConnected ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 text-green-600"><CheckCircle className="h-5 w-5" /><div><p className="font-medium">Google Drive সংযুক্ত</p><p className="text-sm text-muted-foreground">{driveEmail}</p></div></div>
                <Button variant="outline" size="sm" onClick={disconnectDrive}><Link2Off className="h-4 w-4 mr-2" />সংযোগ বিচ্ছিন্ন</Button>
              </div>
            ) : (
              <Button onClick={connectGoogleDrive} disabled={isConnecting} className="bg-blue-600 hover:bg-blue-700">
                {isConnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}Google Drive সংযুক্ত করুন
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Cloud Backup */}
        <Card className="border-green-500/20">
          <CardHeader><CardTitle className="flex items-center gap-2"><CloudUpload className="h-5 w-5 text-green-500" />ব্যক্তিগত ব্যাকআপ</CardTitle><CardDescription>অর্ডার, পুকুরের খরচ, ব্যবহারের তথ্য ব্যাকআপ</CardDescription></CardHeader>
          <CardContent>
            <Button onClick={createBackup} disabled={isBackingUp} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
              {isBackingUp ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />ব্যাকআপ তৈরি হচ্ছে...</> : <><CloudUpload className="mr-2 h-4 w-4" />ব্যাকআপ নিন</>}
            </Button>
          </CardContent>
        </Card>

        {/* Drive Files */}
        {isConnected && driveFiles.length > 0 && (
          <Card className="border-blue-500/20">
            <CardHeader><CardTitle className="flex items-center gap-2"><DownloadCloud className="h-5 w-5 text-blue-500" />Google Drive ব্যাকআপ ফাইল</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {driveFiles.map((file: any) => (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/80">
                    <div className="flex items-center gap-2"><FileJson className="h-4 w-4 text-blue-500" /><div><p className="text-sm font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{new Date(file.createdTime).toLocaleDateString('bn-BD')}</p></div></div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => downloadBackup(undefined, file.id, file.name)} disabled={isDownloading === file.id}>{isDownloading === file.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}</Button>
                      <Button size="sm" variant="outline" onClick={() => restoreFromDrive(file.id)} disabled={isRestoring}>{isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CloudDownload className="mr-1 h-4 w-4" />রিস্টোর</>}</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Local Backup */}
        <Card className="border-orange-500/20">
          <CardHeader><CardTitle className="flex items-center gap-2"><FileJson className="h-5 w-5 text-orange-500" />লোকাল ব্যাকআপ</CardTitle><CardDescription>JSON ফাইল হিসেবে ডাউনলোড বা আপলোড করুন</CardDescription></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Button onClick={handleLocalBackup} className="w-full bg-gradient-to-r from-orange-500 to-amber-600"><CloudDownload className="mr-2 h-4 w-4" />ব্যাকআপ ডাউনলোড</Button>
              <div className="relative">
                <Input type="file" accept=".json" onChange={handleLocalRestore} className="absolute inset-0 opacity-0 cursor-pointer" />
                <Button variant="outline" className="w-full border-orange-500/50 hover:bg-orange-500/10"><CloudUpload className="mr-2 h-4 w-4" />ব্যাকআপ থেকে রিস্টোর</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backup History */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-muted-foreground" />ব্যাকআপ ইতিহাস</CardTitle></CardHeader>
          <CardContent>
            {isLoadingLogs ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : backupLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">কোনো ব্যাকআপ রেকর্ড নেই</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {backupLogs.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(log.status)}
                      <div><p className="text-sm font-medium">{log.file_name || 'ব্যাকআপ'}</p><p className="text-xs text-muted-foreground">{new Date(log.started_at).toLocaleString('bn-BD')}</p></div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => downloadBackup(log.id)} disabled={isDownloading === log.id}>
                      {isDownloading === log.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardBackup;
