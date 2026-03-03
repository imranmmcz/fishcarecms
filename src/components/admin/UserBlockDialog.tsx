import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Ban, Loader2 } from "lucide-react";

interface UserBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  isCurrentlyBlocked: boolean;
  onSuccess: () => void;
}

export const UserBlockDialog = ({ open, onOpenChange, userId, userName, isCurrentlyBlocked, onSuccess }: UserBlockDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [blockType, setBlockType] = useState("permanent");
  const [blockDuration, setBlockDuration] = useState("24");
  const [blockReason, setBlockReason] = useState("");

  const handleBlock = async () => {
    setLoading(true);
    try {
      let blockedUntil: string | null = null;
      if (blockType === "temporary") {
        const hours = parseInt(blockDuration);
        const until = new Date();
        until.setHours(until.getHours() + hours);
        blockedUntil = until.toISOString();
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          is_blocked: true,
          blocked_until: blockedUntil,
          block_reason: blockReason || "অ্যাডমিন দ্বারা ব্লক করা হয়েছে",
        } as any)
        .eq("user_id", userId);

      if (error) throw error;

      toast({ title: "সফল", description: `${userName} ব্লক করা হয়েছে` });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_blocked: false,
          blocked_until: null,
          block_reason: null,
        } as any)
        .eq("user_id", userId);

      if (error) throw error;

      toast({ title: "সফল", description: `${userName} আনব্লক করা হয়েছে` });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (isCurrentlyBlocked) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ইউজার আনব্লক করুন</DialogTitle>
            <DialogDescription>{userName} কে আনব্লক করতে চান?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>বাতিল</Button>
            <Button onClick={handleUnblock} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              আনব্লক করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            ইউজার ব্লক করুন
          </DialogTitle>
          <DialogDescription>{userName} কে ব্লক করতে চান?</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>ব্লকের ধরন</Label>
            <Select value={blockType} onValueChange={setBlockType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="permanent">স্থায়ী ব্লক</SelectItem>
                <SelectItem value="temporary">নির্দিষ্ট সময়ের জন্য</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {blockType === "temporary" && (
            <div>
              <Label>সময়কাল (ঘণ্টা)</Label>
              <Select value={blockDuration} onValueChange={setBlockDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">১ ঘণ্টা</SelectItem>
                  <SelectItem value="6">৬ ঘণ্টা</SelectItem>
                  <SelectItem value="24">২৪ ঘণ্টা</SelectItem>
                  <SelectItem value="72">৩ দিন</SelectItem>
                  <SelectItem value="168">৭ দিন</SelectItem>
                  <SelectItem value="720">৩০ দিন</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>কারণ (ঐচ্ছিক)</Label>
            <Textarea
              placeholder="ব্লক করার কারণ লিখুন..."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>বাতিল</Button>
          <Button variant="destructive" onClick={handleBlock} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            ব্লক করুন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
