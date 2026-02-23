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
  FileJson, Clock, DownloadCloud, User
} from "lucide-react";
import { Input } from "@/components/ui/input";

const DashboardBackup = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupLogs, setBackupLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  const loadBackupLogs = useCallback(async () => {
    if (!user) return;
    setIsLoadingLogs(true);
    try {
      const { data } = await supabase.from("backup_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
      setBackupLogs(data || []);
    } catch (e) { console.error(e); }
    finally { setIsLoadingLogs(false); }
  }, [user]);

  useEffect(() => { loadBackupLogs(); }, [loadBackupLogs]);

  const getAllLocalStorageData = () => {
    const data: Record<string, any> = {};
    const keys = ['farmingPondData', 'farmingFishStockingData', 'feedManagementData', 'waterQualityData', 'medicineData', 'fertilizerData', 'biomassData'];
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) { try { data[key] = JSON.parse(value); } catch { data[key] = value; } }
    });
    return data;
  };

  const createBackup = async () => {
    if (!user) return;
    setIsBackingUp(true);
    try {
      // Fetch user data from Supabase
      const [pondsRes, incomesRes, expensesRes, samplingsRes] = await Promise.all([
        supabase.from("farmer_ponds").select("*").eq("user_id", user.id),
        supabase.from("farmer_incomes").select("*").eq("user_id", user.id),
        supabase.from("farmer_expenses").select("*").eq("user_id", user.id),
        supabase.from("farmer_samplings").select("*").eq("user_id", user.id),
      ]);

      const backupData = {
        ponds: pondsRes.data || [],
        incomes: incomesRes.data || [],
        expenses: expensesRes.data || [],
        samplings: samplingsRes.data || [],
        localStorage: getAllLocalStorageData(),
        created_at: new Date().toISOString(),
      };

      const fileName = `user_backup_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.json`;
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);

      // Log the backup
      await supabase.from("backup_logs").insert({
        user_id: user.id, backup_scope: 'user', backup_type: 'manual',
        status: 'completed', file_name: fileName,
        file_size: new Blob([JSON.stringify(backupData)]).size,
      });

      toast({ title: "সফল", description: "ব্যাকআপ ফাইল ডাউনলোড হয়েছে" });
      loadBackupLogs();
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally { setIsBackingUp(false); }
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
      case 'in_progress': return <Badge className="bg-blue-500/20 text-blue-700">চলমান</Badge>;
      case 'failed': return <Badge variant="destructive">ব্যর্থ</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><User className="h-6 w-6 text-primary" />ব্যাকআপ ও রিস্টোর</h1>
          <p className="text-muted-foreground">আপনার ব্যক্তিগত ডেটা সংরক্ষণ করুন</p>
        </div>

        <Card className="border-green-500/20">
          <CardHeader><CardTitle className="flex items-center gap-2"><CloudUpload className="h-5 w-5 text-green-500" />ব্যক্তিগত ব্যাকআপ</CardTitle><CardDescription>পুকুর, আয়, ব্যয় ও নমুনায়ন ডেটা ব্যাকআপ</CardDescription></CardHeader>
          <CardContent>
            <Button onClick={createBackup} disabled={isBackingUp} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
              {isBackingUp ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />ব্যাকআপ তৈরি হচ্ছে...</> : <><CloudUpload className="mr-2 h-4 w-4" />ব্যাকআপ নিন</>}
            </Button>
          </CardContent>
        </Card>

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
                  </div>
                ))}
              </div>}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardBackup;
