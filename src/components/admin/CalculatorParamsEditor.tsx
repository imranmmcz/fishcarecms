import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Save, Settings2, Loader2, RotateCcw, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { CalculatorParam } from "@/hooks/useCalculatorParams";

const moduleLabels: Record<string, string> = {
  pond: "পুকুর ক্যালকুলেটর",
  feed: "খাদ্য ব্যবস্থাপনা",
  fertilizer: "সার ক্যালকুলেটর",
  biomass: "বায়োমাস",
  stocking: "মজুদ ঘনত্ব ও খরচ",
  "stocking-density": "মজুদ ঘনত্ব",
  fish_stocking: "মাছের মজুদ",
  water: "পানির গুণাগুণ",
  cost: "খরচ ক্যালকুলেটর",
  medicine: "ঔষধ প্রয়োগ",
  formula: "খাদ্য ফর্মুলা",
  advice: "মাছ পরামর্শ",
  reports: "রিপোর্ট",
};

const allModuleOptions = [
  { value: "pond", label: "পুকুর ক্যালকুলেটর" },
  { value: "feed", label: "খাদ্য ব্যবস্থাপনা" },
  { value: "fertilizer", label: "সার ক্যালকুলেটর" },
  { value: "biomass", label: "বায়োমাস" },
  { value: "stocking", label: "মজুদ ঘনত্ব ও খরচ" },
  { value: "stocking-density", label: "মজুদ ঘনত্ব" },
  { value: "fish_stocking", label: "মাছের মজুদ" },
  { value: "water", label: "পানির গুণাগুণ" },
  { value: "cost", label: "খরচ ক্যালকুলেটর" },
  { value: "medicine", label: "ঔষধ প্রয়োগ" },
  { value: "formula", label: "খাদ্য ফর্মুলা" },
  { value: "advice", label: "মাছ পরামর্শ" },
  { value: "reports", label: "রিপোর্ট" },
];

const groupLabels: Record<string, string> = {
  unit_conversion: "একক রূপান্তর",
  feed_rate: "খাদ্যের হার",
  fcr: "FCR (খাদ্য রূপান্তর অনুপাত)",
  general: "সাধারণ",
  new_pond: "নতুন পুকুর",
  regular_pond: "পুরাতন পুকুর",
  pond_preparation: "পুকুর প্রস্তুতি",
  labor: "শ্রমিক খরচ",
  feed: "খাদ্য খরচ",
  medicine: "ঔষধ খরচ",
  equipment: "সরঞ্জাম খরচ",
  miscellaneous: "অন্যান্য খরচ",
  ideal_range: "আদর্শ পরিসীমা",
  utility: "ইউটিলিটি",
  fixed_cost: "স্থায়ী খরচ",
  dosage: "ডোজ",
  fish_density: "মাছের ঘনত্ব",
  fingerling_weight: "পোনার ওজন",
};

const groupOptions = Object.entries(groupLabels).map(([value, label]) => ({ value, label }));

interface CalculatorParamsEditorProps {
  moduleFilter?: string;
}

interface NewParamForm {
  module_id: string;
  param_key: string;
  param_value: string;
  param_label: string;
  param_label_bn: string;
  param_group: string;
  param_unit: string;
  display_order: number;
}

const emptyNewParam: NewParamForm = {
  module_id: "",
  param_key: "",
  param_value: "0",
  param_label: "",
  param_label_bn: "",
  param_group: "general",
  param_unit: "",
  display_order: 0,
};

export function CalculatorParamsEditor({ moduleFilter }: CalculatorParamsEditorProps) {
  const [params, setParams] = useState<CalculatorParam[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedModule, setSelectedModule] = useState(moduleFilter || "all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newParam, setNewParam] = useState<NewParamForm>({ ...emptyNewParam });
  const [addingParam, setAddingParam] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchParams();
  }, []);

  const fetchParams = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("calculator_parameters")
      .select("*")
      .order("module_id")
      .order("display_order", { ascending: true });

    if (error) {
      toast.error("প্যারামিটার লোড করতে সমস্যা হয়েছে");
    } else {
      setParams((data || []) as CalculatorParam[]);
    }
    setLoading(false);
  };

  const handleValueChange = (id: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleSaveAll = async () => {
    const entries = Object.entries(editedValues);
    if (entries.length === 0) {
      toast.info("কোনো পরিবর্তন নেই");
      return;
    }

    setSaving(true);
    try {
      for (const [id, value] of entries) {
        const { error } = await supabase
          .from("calculator_parameters")
          .update({ param_value: value })
          .eq("id", id);
        if (error) throw error;
      }
      toast.success(`${entries.length}টি প্যারামিটার আপডেট হয়েছে`);
      setEditedValues({});
      fetchParams();
    } catch {
      toast.error("সংরক্ষণে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEditedValues({});
    toast.success("পরিবর্তনগুলো বাতিল করা হয়েছে");
  };

  const handleAddParam = async () => {
    if (!newParam.module_id || !newParam.param_key || !newParam.param_label_bn) {
      toast.error("মডিউল, কী এবং বাংলা লেবেল আবশ্যক");
      return;
    }

    setAddingParam(true);
    try {
      const { error } = await supabase.from("calculator_parameters").insert({
        module_id: newParam.module_id,
        param_key: newParam.param_key,
        param_value: newParam.param_value || "0",
        param_label: newParam.param_label || newParam.param_key,
        param_label_bn: newParam.param_label_bn,
        param_group: newParam.param_group || "general",
        param_unit: newParam.param_unit || "",
        display_order: newParam.display_order || 0,
      });
      if (error) throw error;
      toast.success("নতুন প্যারামিটার যোগ করা হয়েছে");
      setNewParam({ ...emptyNewParam });
      setAddDialogOpen(false);
      fetchParams();
    } catch (err: any) {
      toast.error(err?.message || "প্যারামিটার যোগ করতে সমস্যা হয়েছে");
    } finally {
      setAddingParam(false);
    }
  };

  const handleDeleteParam = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত এই প্যারামিটারটি মুছে ফেলতে চান?")) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from("calculator_parameters").delete().eq("id", id);
      if (error) throw error;
      toast.success("প্যারামিটার মুছে ফেলা হয়েছে");
      fetchParams();
    } catch {
      toast.error("মুছে ফেলতে সমস্যা হয়েছে");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredParams =
    selectedModule === "all"
      ? params
      : params.filter((p) => p.module_id === selectedModule);

  const grouped = filteredParams.reduce(
    (acc, param) => {
      const key = `${param.module_id}__${param.param_group}`;
      if (!acc[key]) {
        acc[key] = { module_id: param.module_id, param_group: param.param_group, items: [] };
      }
      acc[key].items.push(param);
      return acc;
    },
    {} as Record<string, { module_id: string; param_group: string; items: CalculatorParam[] }>
  );

  const modules = [...new Set(params.map((p) => p.module_id))];
  // Merge DB modules with all known modules
  const allModules = [...new Set([...allModuleOptions.map(m => m.value), ...modules])];
  const changedCount = Object.keys(editedValues).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                সূত্র ও প্যারামিটার এডিটর
              </CardTitle>
              <CardDescription>
                ক্যালকুলেটরের ধ্রুবক, হার ও রূপান্তর মান পরিবর্তন বা নতুন যোগ করুন
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল মডিউল</SelectItem>
                  {allModules.map((m) => (
                    <SelectItem key={m} value={m}>
                      {moduleLabels[m] || m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    নতুন প্যারামিটার
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>নতুন প্যারামিটার যোগ করুন</DialogTitle>
                    <DialogDescription>
                      ক্যালকুলেটর মডিউলে নতুন ধ্রুবক/ডোজ/একক যোগ করুন
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 py-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">মডিউল *</Label>
                        <Select
                          value={newParam.module_id}
                          onValueChange={(v) => setNewParam((p) => ({ ...p, module_id: v }))}
                        >
                          <SelectTrigger><SelectValue placeholder="মডিউল নির্বাচন" /></SelectTrigger>
                          <SelectContent>
                            {allModuleOptions.map((m) => (
                              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">গ্রুপ</Label>
                        <Select
                          value={newParam.param_group}
                          onValueChange={(v) => setNewParam((p) => ({ ...p, param_group: v }))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {groupOptions.map((g) => (
                              <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">প্যারামিটার কী (ইংরেজি) *</Label>
                        <Input
                          placeholder="যেমন: lime_dose_per_acre"
                          value={newParam.param_key}
                          onChange={(e) => setNewParam((p) => ({ ...p, param_key: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">ইংরেজি লেবেল</Label>
                        <Input
                          placeholder="Lime Dose Per Acre"
                          value={newParam.param_label}
                          onChange={(e) => setNewParam((p) => ({ ...p, param_label: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">বাংলা লেবেল *</Label>
                      <Input
                        placeholder="প্রতি একরে চুনের পরিমাণ"
                        value={newParam.param_label_bn}
                        onChange={(e) => setNewParam((p) => ({ ...p, param_label_bn: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">মান (ডিফল্ট)</Label>
                        <Input
                          type="number"
                          step="any"
                          value={newParam.param_value}
                          onChange={(e) => setNewParam((p) => ({ ...p, param_value: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">একক/ডোজ</Label>
                        <Input
                          placeholder="কেজি/শতক, মিলি/লিটার"
                          value={newParam.param_unit}
                          onChange={(e) => setNewParam((p) => ({ ...p, param_unit: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">ক্রম</Label>
                        <Input
                          type="number"
                          value={newParam.display_order}
                          onChange={(e) => setNewParam((p) => ({ ...p, display_order: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddParam} disabled={addingParam} className="mt-2">
                      {addingParam ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Plus className="h-4 w-4 mr-1.5" />}
                      প্যারামিটার যোগ করুন
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Parameter Groups */}
      {Object.values(grouped).length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            এই মডিউলে কোনো প্যারামিটার নেই। উপরের "নতুন প্যারামিটার" বাটনে ক্লিক করে যোগ করুন।
          </CardContent>
        </Card>
      )}

      {Object.values(grouped).map((group) => (
        <Card key={`${group.module_id}__${group.param_group}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{moduleLabels[group.module_id] || group.module_id}</Badge>
              <span className="text-sm font-medium text-muted-foreground">
                {groupLabels[group.param_group] || group.param_group}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map((param) => {
                const currentValue = editedValues[param.id] ?? param.param_value;
                const isEdited = editedValues[param.id] !== undefined && editedValues[param.id] !== param.param_value;
                return (
                  <div key={param.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor={param.id}
                        className={`text-xs ${isEdited ? "text-primary font-semibold" : ""}`}
                      >
                        {param.param_label_bn}
                        {param.param_unit && (
                          <span className="text-muted-foreground ml-1">({param.param_unit})</span>
                        )}
                      </Label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteParam(param.id)}
                        disabled={deletingId === param.id}
                      >
                        {deletingId === param.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <Input
                      id={param.id}
                      type="number"
                      step="any"
                      value={currentValue}
                      onChange={(e) => handleValueChange(param.id, e.target.value)}
                      className={isEdited ? "border-primary ring-1 ring-primary/20" : ""}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Save Bar */}
      {changedCount > 0 && (
        <div className="sticky bottom-4 z-10">
          <Card className="border-primary/30 bg-primary/5 shadow-lg">
            <CardContent className="p-4 flex items-center justify-between">
              <span className="text-sm font-medium">
                {changedCount}টি প্যারামিটার পরিবর্তিত হয়েছে
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  বাতিল
                </Button>
                <Button size="sm" onClick={handleSaveAll} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  সংরক্ষণ করুন
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
