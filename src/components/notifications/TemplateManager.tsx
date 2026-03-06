import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, Mail, MessageSquare, Phone, Bell, Copy } from "lucide-react";
import { TemplatePreview } from "./TemplatePreview";

const CHANNEL_ICONS: Record<string, any> = {
  email: Mail,
  sms: Phone,
  whatsapp: MessageSquare,
  in_app: Bell,
};

const CHANNEL_LABELS: Record<string, { bn: string; en: string }> = {
  email: { bn: "ইমেইল", en: "Email" },
  sms: { bn: "SMS", en: "SMS" },
  whatsapp: { bn: "WhatsApp", en: "WhatsApp" },
  in_app: { bn: "ইন-অ্যাপ", en: "In-App" },
};

const TEMPLATE_TYPES = [
  { value: "order", bn: "অর্ডার", en: "Order" },
  { value: "reminder", bn: "রিমাইন্ডার", en: "Reminder" },
  { value: "alert", bn: "সতর্কতা", en: "Alert" },
  { value: "promotion", bn: "প্রমোশন", en: "Promotion" },
];

const DYNAMIC_VARS = [
  "{user_name}", "{order_id}", "{order_status}", "{product_name}",
  "{delivery_date}", "{due_amount}", "{farm_name}", "{pond_name}",
];

interface TemplateForm {
  name: string;
  name_bn: string;
  template_type: string;
  subject: string;
  subject_bn: string;
  message: string;
  message_bn: string;
  channels: string[];
  dynamic_variables: string[];
  status: string;
}

const emptyForm: TemplateForm = {
  name: "", name_bn: "", template_type: "alert", subject: "", subject_bn: "",
  message: "", message_bn: "", channels: ["in_app"], dynamic_variables: [], status: "active",
};

export function TemplateManager() {
  const { language } = useLanguage();
  const t = (bn: string, en: string) => language === "bn" ? bn : en;
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>(emptyForm);
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["notification-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: TemplateForm & { id?: string }) => {
      const payload = {
        name: formData.name,
        name_bn: formData.name_bn,
        template_type: formData.template_type,
        subject: formData.subject,
        subject_bn: formData.subject_bn,
        message: formData.message,
        message_bn: formData.message_bn,
        channels: formData.channels,
        dynamic_variables: formData.dynamic_variables,
        status: formData.status,
      };

      if (formData.id) {
        const { error } = await supabase
          .from("notification_templates")
          .update(payload)
          .eq("id", formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("notification_templates")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
      setDialogOpen(false);
      setEditId(null);
      setForm(emptyForm);
      toast.success(t("টেমপ্লেট সেভ হয়েছে", "Template saved"));
    },
    onError: () => toast.error(t("সেভ করতে সমস্যা হয়েছে", "Failed to save")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notification_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
      toast.success(t("টেমপ্লেট ডিলিট হয়েছে", "Template deleted"));
    },
  });

  const openEdit = (tmpl: any) => {
    setEditId(tmpl.id);
    setForm({
      name: tmpl.name, name_bn: tmpl.name_bn || "", template_type: tmpl.template_type,
      subject: tmpl.subject || "", subject_bn: tmpl.subject_bn || "",
      message: tmpl.message, message_bn: tmpl.message_bn || "",
      channels: tmpl.channels || ["in_app"], dynamic_variables: tmpl.dynamic_variables || [],
      status: tmpl.status,
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const toggleChannel = (ch: string) => {
    setForm(prev => ({
      ...prev,
      channels: prev.channels.includes(ch)
        ? prev.channels.filter(c => c !== ch)
        : [...prev.channels, ch],
    }));
  };

  const insertVariable = (v: string) => {
    setForm(prev => ({
      ...prev,
      message: prev.message + v,
      dynamic_variables: prev.dynamic_variables.includes(v)
        ? prev.dynamic_variables
        : [...prev.dynamic_variables, v],
    }));
  };

  const filteredTemplates = typeFilter === "all"
    ? templates
    : templates.filter((t: any) => t.template_type === typeFilter);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{t("টেমপ্লেট তালিকা", "Template List")}</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("সব", "All")}</SelectItem>
              {TEMPLATE_TYPES.map(tp => (
                <SelectItem key={tp.value} value={tp.value}>{t(tp.bn, tp.en)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openNew} size="sm">
            <Plus className="h-4 w-4 mr-1" /> {t("নতুন টেমপ্লেট", "New Template")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">{t("লোড হচ্ছে...", "Loading...")}</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("নাম", "Name")}</TableHead>
                  <TableHead>{t("টাইপ", "Type")}</TableHead>
                  <TableHead>{t("চ্যানেল", "Channels")}</TableHead>
                  <TableHead>{t("স্ট্যাটাস", "Status")}</TableHead>
                  <TableHead className="text-right">{t("অ্যাকশন", "Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((tmpl: any) => (
                  <TableRow key={tmpl.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{language === "bn" && tmpl.name_bn ? tmpl.name_bn : tmpl.name}</p>
                        {tmpl.is_default && <Badge variant="secondary" className="text-[10px] mt-0.5">{t("ডিফল্ট", "Default")}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TEMPLATE_TYPES.find(tp => tp.value === tmpl.template_type)?.[language === "bn" ? "bn" : "en"] || tmpl.template_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {(tmpl.channels || []).map((ch: string) => {
                          const Icon = CHANNEL_ICONS[ch];
                          return Icon ? <Icon key={ch} className="h-4 w-4 text-muted-foreground" title={CHANNEL_LABELS[ch]?.[language === "bn" ? "bn" : "en"]} /> : null;
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tmpl.status === "active" ? "default" : "secondary"}>
                        {tmpl.status === "active" ? t("সক্রিয়", "Active") : t("নিষ্ক্রিয়", "Disabled")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setPreviewTemplate(tmpl); setPreviewOpen(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(tmpl)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => {
                          if (confirm(t("ডিলিট করতে চান?", "Delete this template?"))) deleteMutation.mutate(tmpl.id);
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTemplates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t("কোনো টেমপ্লেট নেই", "No templates found")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? t("টেমপ্লেট সম্পাদনা", "Edit Template") : t("নতুন টেমপ্লেট", "New Template")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("নাম (English)", "Name (English)")}</Label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <Label>{t("নাম (বাংলা)", "Name (Bangla)")}</Label>
                  <Input value={form.name_bn} onChange={e => setForm(p => ({ ...p, name_bn: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("টাইপ", "Type")}</Label>
                  <Select value={form.template_type} onValueChange={v => setForm(p => ({ ...p, template_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_TYPES.map(tp => (
                        <SelectItem key={tp.value} value={tp.value}>{t(tp.bn, tp.en)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("স্ট্যাটাস", "Status")}</Label>
                  <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t("সক্রিয়", "Active")}</SelectItem>
                      <SelectItem value="disabled">{t("নিষ্ক্রিয়", "Disabled")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("সাবজেক্ট (English)", "Subject (English)")}</Label>
                  <Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
                </div>
                <div>
                  <Label>{t("সাবজেক্ট (বাংলা)", "Subject (Bangla)")}</Label>
                  <Input value={form.subject_bn} onChange={e => setForm(p => ({ ...p, subject_bn: e.target.value }))} />
                </div>
              </div>

              {/* Channels */}
              <div>
                <Label className="mb-2 block">{t("ডেলিভারি চ্যানেল", "Delivery Channels")}</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(CHANNEL_LABELS).map(([key, label]) => {
                    const Icon = CHANNEL_ICONS[key];
                    const selected = form.channels.includes(key);
                    return (
                      <Button key={key} type="button" size="sm"
                        variant={selected ? "default" : "outline"}
                        onClick={() => toggleChannel(key)}
                        className="gap-1.5"
                      >
                        {Icon && <Icon className="h-3.5 w-3.5" />}
                        {t(label.bn, label.en)}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Variables */}
              <div>
                <Label className="mb-2 block">{t("ডাইনামিক ভেরিয়েবল", "Dynamic Variables")}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {DYNAMIC_VARS.map(v => (
                    <Button key={v} type="button" size="sm" variant="outline"
                      onClick={() => insertVariable(v)}
                      className="text-xs font-mono gap-1"
                    >
                      <Copy className="h-3 w-3" /> {v}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>{t("মেসেজ (English)", "Message (English)")}</Label>
                <Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={4} />
              </div>
              <div>
                <Label>{t("মেসেজ (বাংলা)", "Message (Bangla)")}</Label>
                <Textarea value={form.message_bn} onChange={e => setForm(p => ({ ...p, message_bn: e.target.value }))} rows={4} />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("বাতিল", "Cancel")}</Button>
                <Button onClick={() => saveMutation.mutate({ ...form, id: editId || undefined })}
                  disabled={saveMutation.isPending || !form.name || !form.message}>
                  {saveMutation.isPending ? t("সেভ হচ্ছে...", "Saving...") : t("সেভ করুন", "Save")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <TemplatePreview open={previewOpen} onOpenChange={setPreviewOpen} template={previewTemplate} />
      </CardContent>
    </Card>
  );
}
