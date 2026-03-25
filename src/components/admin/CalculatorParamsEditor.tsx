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
import { toast } from "sonner";
import { Save, Settings2, Loader2, RotateCcw } from "lucide-react";
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

export function CalculatorParamsEditor() {
  const [params, setParams] = useState<CalculatorParam[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedModule, setSelectedModule] = useState("all");

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

  const filteredParams =
    selectedModule === "all"
      ? params
      : params.filter((p) => p.module_id === selectedModule);

  // Group params by module then by param_group
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
                ক্যালকুলেটরের ধ্রুবক, হার ও রূপান্তর মান পরিবর্তন করুন
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল মডিউল</SelectItem>
                  {modules.map((m) => (
                    <SelectItem key={m} value={m}>
                      {moduleLabels[m] || m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Parameter Groups */}
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
                    <Label
                      htmlFor={param.id}
                      className={`text-xs ${isEdited ? "text-primary font-semibold" : ""}`}
                    >
                      {param.param_label_bn}
                      {param.param_unit && (
                        <span className="text-muted-foreground ml-1">({param.param_unit})</span>
                      )}
                    </Label>
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
