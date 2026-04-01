import { useState } from "react";
import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Award, Plus, Pencil, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function POSBrands() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState("");
  const [nameBn, setNameBn] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["pos-brands"],
    queryFn: async () => {
      const { data } = await supabase.from("brands").select("*").order("name");
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("ব্র্যান্ডের নাম দিন");
      const payload = { name: name.trim(), name_bn: nameBn.trim() || null, is_active: isActive };
      if (editing) {
        const { error } = await supabase.from("brands").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("brands").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "ব্র্যান্ড আপডেট হয়েছে" : "ব্র্যান্ড যোগ হয়েছে");
      queryClient.invalidateQueries({ queryKey: ["pos-brands"] });
      closeDialog();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("brands").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("ব্র্যান্ড মুছে ফেলা হয়েছে");
      queryClient.invalidateQueries({ queryKey: ["pos-brands"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const openEdit = (b: any) => {
    setEditing(b);
    setName(b.name);
    setNameBn(b.name_bn || "");
    setIsActive(b.is_active);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setName("");
    setNameBn("");
    setIsActive(true);
  };

  const filtered = brands.filter((b: any) =>
    !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.name_bn?.includes(search)
  );

  return (
    <POSLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Award className="h-6 w-6 text-emerald-500" /> ব্র্যান্ড ব্যবস্থাপনা
            </h1>
            <p className="text-muted-foreground text-sm">পণ্যের ব্র্যান্ড যোগ, সম্পাদনা ও মুছুন</p>
          </div>
          <Button onClick={() => { closeDialog(); setDialogOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> নতুন ব্র্যান্ড
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="ব্র্যান্ড খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
              <TableHeader>
                <TableRow>
                  <TableHead>নাম</TableHead>
                  <TableHead>নাম (বাংলা)</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8">লোড হচ্ছে...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">কোনো ব্র্যান্ড পাওয়া যায়নি</TableCell></TableRow>
                ) : filtered.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell>{b.name_bn || "-"}</TableCell>
                    <TableCell><Badge variant={b.is_active ? "default" : "secondary"}>{b.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}</Badge></TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="text-red-500"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>ব্র্যান্ড মুছবেন?</AlertDialogTitle>
                            <AlertDialogDescription>"{b.name}" মুছে ফেলা হবে। এটি পূর্বাবস্থায় ফেরানো যাবে না।</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>বাতিল</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(b.id)} className="bg-red-600">মুছুন</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "ব্র্যান্ড সম্পাদনা" : "নতুন ব্র্যান্ড"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>নাম (ইংরেজি)</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Brand Name" /></div>
              <div className="space-y-2"><Label>নাম (বাংলা)</Label><Input value={nameBn} onChange={e => setNameBn(e.target.value)} placeholder="ব্র্যান্ডের নাম" /></div>
              <div className="flex items-center gap-2"><Switch checked={isActive} onCheckedChange={setIsActive} /><Label>সক্রিয়</Label></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>বাতিল</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                {saveMutation.isPending ? "সেভ হচ্ছে..." : "সেভ করুন"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </POSLayout>
  );
}
