import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  CloudUpload, CloudDownload, HardDrive, Loader2, CheckCircle, 
  AlertCircle, RefreshCw, FileJson, Link2, Link2Off, Clock, 
  DownloadCloud, User
} from "lucide-react";
import { Input } from "@/components/ui/input";

const DashboardBackup = () => {
  const { toast } = useToast();
  const { session, user } = useAuth();
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
      const body: any = { action: 'download_backup' };
      if (logId) body.log_id = logId;
      if (driveFileId) body.drive_file_id = driveFileId;

      const { data, error } = await supabase.functions.invoke('system-backup', { body });
      if (error) throw error;
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
    if (!session?.access_token) return;
    try {
      const { data } = await supabase.functions.invoke('google-drive-auth', {
        body: { action: 'check_connection' },
      });
      setIsConnected(data?.connected || false);
      setDriveEmail(data?.drive_email || "");
    } catch (e) { console.error(e); }
  }, [session]);

  const loadBackupLogs = useCallback(async () => {
    if (!session?.access_token) return;
    setIsLoadingLogs(true);
    try {
      const { data } = await supabase.functions.invoke('system-backup', {
        body: { action: 'list_backups' },
      });
      setBackupLogs(data?.backups || []);
    } catch (e) { console.error(e); }
    finally { setIsLoadingLogs(false); }
  }, [session]);

  const loadDriveFiles = useCallback(async () => {
    if (!session?.access_token || !isConnected) return;
    try {
      const { data } = await supabase.functions.invoke('system-backup', {
        body: { action: 'list_drive_backups' },
      });
      setDriveFiles(data?.files || []);
    } catch (e) { console.error(e); }
  }, [session, isConnected]);

  useEffect(() => {
    checkConnection();
    loadBackupLogs();
  }, [checkConnection, loadBackupLogs]);

  useEffect(() => {
    if (isConnected) loadDriveFiles();
  }, [isConnected, loadDriveFiles]);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && session?.access_token) {
      const exchangeCode = async () => {
        setIsConnecting(true);
        try {
          const redirectUri = `${window.location.origin}/dashboard/backup`;
          const { data, error } = await supabase.functions.invoke('google-drive-auth', {
            body: { action: 'exchange_code', code, redirect_uri: redirectUri },
          });
          if (error) throw error;
          if (data?.success) {
            setIsConnected(true);
            setDriveEmail(data.drive_email);
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
  }, [session]);

  const connectGoogleDrive = async () => {
    setIsConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/dashboard/backup`;
      const { data } = await supabase.functions.invoke('google-drive-auth', {
        body: { action: 'get_auth_url', redirect_uri: redirectUri },
      });
      if (data?.auth_url) window.location.href = data.auth_url;
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
      setIsConnecting(false);
    }
  };

  const disconnectDrive = async () => {
    try {
      await supabase.functions.invoke('google-drive-auth', {
        body: { action: 'disconnect' },
      });
      setIsConnected(false);
      setDriveEmail("");
      setDriveFiles([]);
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
      const { data, error } = await supabase.functions.invoke('system-backup', {
        body: { action: 'create_backup', backup_scope: 'user' },
      });
      if (error) throw error;

      // If not connected to Drive, also download locally
      if (!data?.google_drive_uploaded && data?.backup_data) {
        const localData = { ...data.backup_data, localStorage: getAllLocalStorageData() };
        const blob = new Blob([JSON.stringify(localData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.file_name;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast({
        title: "সফল",
        description: data?.google_drive_uploaded 
          ? "ব্যাকআপ Google Drive এ আপলোড হয়েছে" 
          : "ব্যাকআপ ফাইল ডাউনলোড হয়েছে",
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
      const { data, error } = await supabase.functions.invoke('system-backup', {
        body: { action: 'restore_backup', file_id: fileId },
      });
      if (error) throw error;

      // Restore localStorage data
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
    a.href = url;
    a.download = `user_backup_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
            <User className="h-6 w-6 text-primary" />
            ব্যাকআপ ও রিস্টোর
          </h1>
          <p className="text-muted-foreground">আপনার ব্যক্তিগত ডেটা Google Drive এ সংরক্ষণ করুন</p>
        </div>

        {/* Google Drive Connection */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              Google Drive সংযোগ
            </CardTitle>
            <CardDescription>একবার সংযুক্ত করলে পুনরায় লগইন করতে হবে না</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isConnected ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Google Drive সংযুক্ত</p>
                    <p className="text-sm text-muted-foreground">{driveEmail}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={disconnectDrive}>
                  <Link2Off className="h-4 w-4 mr-2" />
                  সংযোগ বিচ্ছিন্ন
                </Button>
              </div>
            ) : (
              <Button onClick={connectGoogleDrive} disabled={isConnecting} className="bg-blue-600 hover:bg-blue-700">
                {isConnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
                Google Drive সংযুক্ত করুন
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Cloud Backup */}
        <Card className="border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudUpload className="h-5 w-5 text-green-500" />
              ব্যক্তিগত ব্যাকআপ
            </CardTitle>
            <CardDescription>অর্ডার, পুকুরের খরচ, ব্যবহারের তথ্য ব্যাকআপ</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={createBackup}
              disabled={isBackingUp}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {isBackingUp ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />ব্যাকআপ তৈরি হচ্ছে...</>
              ) : (
                <><CloudUpload className="mr-2 h-4 w-4" />ব্যাকআপ নিন</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Drive Files - Restore */}
        {isConnected && driveFiles.length > 0 && (
          <Card className="border-blue-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DownloadCloud className="h-5 w-5 text-blue-500" />
                Google Drive ব্যাকআপ ফাইল
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {driveFiles.map((file: any) => (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/80">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(file.createdTime).toLocaleDateString('bn-BD')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => downloadBackup(undefined, file.id, file.name)} disabled={isDownloading === file.id} title="ডাউনলোড">
                        {isDownloading === file.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => restoreFromDrive(file.id)} disabled={isRestoring}>
                        {isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                          <><CloudDownload className="mr-1 h-4 w-4" />রিস্টোর</>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Local Backup */}
        <Card className="border-orange-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-orange-500" />
              লোকাল ব্যাকআপ
            </CardTitle>
            <CardDescription>JSON ফাইল হিসেবে ডাউনলোড বা আপলোড করুন</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Button onClick={handleLocalBackup} className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700">
                <CloudDownload className="mr-2 h-4 w-4" />
                ব্যাকআপ ডাউনলোড
              </Button>
              <div className="relative">
                <Input type="file" accept=".json" onChange={handleLocalRestore} className="absolute inset-0 opacity-0 cursor-pointer" />
                <Button variant="outline" className="w-full border-orange-500/50 hover:bg-orange-500/10">
                  <CloudUpload className="mr-2 h-4 w-4" />
                  ব্যাকআপ থেকে রিস্টোর
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backup History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              ব্যাকআপ ইতিহাস
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingLogs ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : backupLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">কোনো ব্যাকআপ রেকর্ড নেই</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {backupLogs.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{log.file_name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString('bn-BD')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(log.status)}
                      {(log.status === 'completed' || log.status === 'completed_local') && (
                        <Button variant="ghost" size="sm" onClick={() => downloadBackup(log.id, undefined, log.file_name)} disabled={isDownloading === log.id} title="ডাউনলোড">
                          {isDownloading === log.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <DownloadCloud className="h-3 w-3" />}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-blue-700">ব্যাকআপে যা অন্তর্ভুক্ত:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>ব্যক্তিগত অর্ডার</li>
                  <li>পুকুরের তথ্য ও খরচ</li>
                  <li>আয়-ব্যয়ের রেকর্ড</li>
                  <li>খাবার ব্যবস্থাপনা ও পানির গুণমান</li>
                  <li>ওষুধ ও সারের তথ্য</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardBackup;
