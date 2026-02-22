import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  CloudUpload, CloudDownload, HardDrive, Loader2, CheckCircle, 
  AlertCircle, RefreshCw, Trash2, Clock, FileJson, Link2, Link2Off, 
  Database, Shield, DownloadCloud
} from "lucide-react";

const AdminBackup = () => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [driveEmail, setDriveEmail] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupLogs, setBackupLogs] = useState<any[]>([]);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

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
          const redirectUri = `${window.location.origin}/admin/backup`;
          const { data, error } = await supabase.functions.invoke('google-drive-auth', {
            body: { action: 'exchange_code', code, redirect_uri: redirectUri },
          });
          if (error) throw error;
          if (data?.success) {
            setIsConnected(true);
            setDriveEmail(data.drive_email);
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
  }, [session]);

  const connectGoogleDrive = async () => {
    setIsConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/admin/backup`;
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

  const createBackup = async () => {
    setIsBackingUp(true);
    try {
      const { data, error } = await supabase.functions.invoke('system-backup', {
        body: { action: 'create_backup', backup_scope: 'system' },
      });
      if (error) throw error;
      toast({
        title: "সফল",
        description: data?.google_drive_uploaded 
          ? "সিস্টেম ব্যাকআপ Google Drive এ আপলোড হয়েছে" 
          : "সিস্টেম ব্যাকআপ তৈরি হয়েছে",
      });
      loadBackupLogs();
      if (isConnected) loadDriveFiles();
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally { setIsBackingUp(false); }
  };

  const restoreBackup = async (fileId: string) => {
    if (!confirm('আপনি কি নিশ্চিত? এটি বিদ্যমান ডেটা প্রতিস্থাপন করবে।')) return;
    setIsRestoring(true);
    try {
      const { data, error } = await supabase.functions.invoke('system-backup', {
        body: { action: 'restore_backup', file_id: fileId },
      });
      if (error) throw error;
      toast({
        title: "সফল",
        description: `${data?.restored_tables?.length || 0}টি টেবিল পুনরুদ্ধার হয়েছে`,
      });
      loadBackupLogs();
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally { setIsRestoring(false); }
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
            <Button variant="outline" onClick={() => { loadBackupLogs(); loadDriveFiles(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              রিফ্রেশ
            </Button>
          </div>
        </div>

        {/* Google Drive Connection */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              Google Drive সংযোগ
            </CardTitle>
            <CardDescription>
              ব্যাকআপ ফাইল স্বয়ংক্রিয়ভাবে Google Drive এ আপলোড হবে
            </CardDescription>
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

        {/* Backup Actions */}
        <Card className="border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-500" />
              সিস্টেম ব্যাকআপ
            </CardTitle>
            <CardDescription>
              সম্পূর্ণ ডাটাবেজ, পণ্যের ছবি, অর্ডার, ব্যবহারকারী ডেটা ব্যাকআপ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={createBackup}
              disabled={isBackingUp}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              size="lg"
            >
              {isBackingUp ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />ব্যাকআপ তৈরি হচ্ছে...</>
              ) : (
                <><CloudUpload className="mr-2 h-5 w-5" />এখনই ব্যাকআপ নিন</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Google Drive Files - Restore */}
        {isConnected && driveFiles.length > 0 && (
          <Card className="border-blue-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DownloadCloud className="h-5 w-5 text-blue-500" />
                Google Drive ব্যাকআপ ফাইল
              </CardTitle>
              <CardDescription>Drive থেকে রিস্টোর করুন</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => restoreBackup(file.id)}
                      disabled={isRestoring}
                    >
                      {isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <><CloudDownload className="mr-1 h-4 w-4" />রিস্টোর</>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {backupLogs.map((log: any) => (
                  <div key={log.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-muted/50 gap-2">
                    <div className="flex items-center gap-3">
                      <FileJson className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{log.file_name || 'Unknown'}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{new Date(log.created_at).toLocaleString('bn-BD')}</span>
                          {log.file_size && <span>• {(log.file_size / 1024).toFixed(1)} KB</span>}
                          {log.backup_scope && <Badge variant="outline" className="text-xs">{log.backup_scope}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(log.status)}
                      {log.google_drive_url && (
                        <a href={log.google_drive_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm"><HardDrive className="h-3 w-3" /></Button>
                        </a>
                      )}
                      {log.restore_status === 'restored' && (
                        <Badge className="bg-purple-500/20 text-purple-700">রিস্টোর করা হয়েছে</Badge>
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
                <p className="font-medium text-blue-700">সিস্টেম ব্যাকআপে যা অন্তর্ভুক্ত:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>সমস্ত ডাটাবেজ টেবিল (পণ্য, অর্ডার, ব্যবহারকারী ইত্যাদি)</li>
                  <li>পণ্যের ছবি ও ফাইল তালিকা</li>
                  <li>সিস্টেম সেটিংস ও কনফিগারেশন</li>
                  <li>স্বয়ংক্রিয় দৈনিক ব্যাকআপ (রাত ২:০০ টায়)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminBackup;
