import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Loader2, Clock } from "lucide-react";

interface ActivityLog {
  id: string;
  activity_type: string;
  page_path: string | null;
  description: string | null;
  created_at: string;
}

interface UserActivityLogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export const UserActivityLog = ({ open, onOpenChange, userId, userName }: UserActivityLogProps) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      fetchLogs();
    }
  }, [open, userId]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_activity_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100) as any;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case "page_view": return <Badge variant="secondary">পেজ ভিজিট</Badge>;
      case "login": return <Badge className="bg-green-500 text-white">লগইন</Badge>;
      case "logout": return <Badge className="bg-orange-500 text-white">লগআউট</Badge>;
      case "signup": return <Badge className="bg-blue-500 text-white">নিবন্ধন</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            {userName} — অ্যাক্টিভিটি হিস্ট্রি
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : logs.length > 0 ? (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getActivityBadge(log.activity_type)}
                    {log.page_path && (
                      <span className="text-sm font-mono text-muted-foreground truncate">{log.page_path}</span>
                    )}
                  </div>
                  {log.description && (
                    <p className="text-xs text-muted-foreground mt-1">{log.description}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(log.created_at).toLocaleString("bn-BD")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>কোনো অ্যাক্টিভিটি লগ পাওয়া যায়নি</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
