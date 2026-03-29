/**
 * Delivery Settings Admin Component
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Save, Loader2, Plus, Trash2, Truck, Percent, Package } from "lucide-react";
import { districtsByDivision } from "@/data/bangladeshLocationData";

interface DeliveryRule {
  id?: string;
  rule_type: string;
  district_name: string;
  min_value: number;
  max_value: number | null;
  charge_amount: number;
  is_active: boolean;
  priority: number;
}

const allDistricts = Object.values(districtsByDivision).flat().sort();

export default function DeliverySettingsAdmin() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [rules, setRules] = useState<DeliveryRule[]>([]);

  // System settings state
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [defaultCharge, setDefaultCharge] = useState("100");
  const [freeAbove, setFreeAbove] = useState("0");
  const [deliveryChargeMandatory, setDeliveryChargeMandatory] = useState("none");
  const [partialEnabled, setPartialEnabled] = useState(false);
  const [minAdvancePercent, setMinAdvancePercent] = useState("50");

  // New rule form
  const [newRule, setNewRule] = useState<DeliveryRule>({
    rule_type: "district",
    district_name: "",
    min_value: 0,
    max_value: null,
    charge_amount: 100,
    is_active: true,
    priority: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch system settings
      const { data: sysData } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .in("setting_key", [
          "delivery_charge_enabled",
          "delivery_default_charge",
          "delivery_free_above",
          "delivery_charge_mandatory",
          "partial_payment_enabled",
          "partial_payment_min_percent",
        ]);

      const map: Record<string, string> = {};
      sysData?.forEach((s) => { map[s.setting_key] = s.setting_value || ""; });

      setDeliveryEnabled(map.delivery_charge_enabled !== "false");
      setDefaultCharge(map.delivery_default_charge || "100");
      setFreeAbove(map.delivery_free_above || "0");
      setDeliveryChargeMandatory(map.delivery_charge_mandatory || "none");
      setPartialEnabled(map.partial_payment_enabled === "true");
      setMinAdvancePercent(map.partial_payment_min_percent || "50");

      // Fetch rules
      const { data: rulesData } = await supabase
        .from("delivery_charge_rules" as any)
        .select("*")
        .order("priority", { ascending: false });

      setRules((rulesData as any[] || []).map((r: any) => ({
        id: r.id,
        rule_type: r.rule_type,
        district_name: r.district_name || "",
        min_value: r.min_value || 0,
        max_value: r.max_value,
        charge_amount: r.charge_amount,
        is_active: r.is_active,
        priority: r.priority,
      })));
    } catch (err) {
      console.error("Error fetching delivery settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSystemSettings = async () => {
    setIsSaving(true);
    try {
      const updates: Record<string, string> = {
        delivery_charge_enabled: deliveryEnabled.toString(),
        delivery_default_charge: defaultCharge,
        delivery_free_above: freeAbove,
        delivery_charge_mandatory: deliveryChargeMandatory,
        partial_payment_enabled: partialEnabled.toString(),
        partial_payment_min_percent: minAdvancePercent,
      };

      for (const [key, value] of Object.entries(updates)) {
        const { data: existing } = await supabase
          .from("system_settings")
          .select("id")
          .eq("setting_key", key)
          .single();

        if (existing) {
          await supabase
            .from("system_settings")
            .update({ setting_value: value })
            .eq("setting_key", key);
        } else {
          await supabase
            .from("system_settings")
            .insert({ setting_key: key, setting_value: value });
        }
      }

      toast({
        title: language === "bn" ? "সফল" : "Success",
        description: language === "bn" ? "ডেলিভারি সেটিংস সেভ হয়েছে" : "Delivery settings saved",
      });
    } catch (err) {
      console.error("Error saving delivery settings:", err);
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const addRule = async () => {
    try {
      const { error } = await supabase
        .from("delivery_charge_rules" as any)
        .insert({
          rule_type: newRule.rule_type,
          district_name: newRule.rule_type === "district" ? newRule.district_name : null,
          min_value: newRule.min_value,
          max_value: newRule.max_value,
          charge_amount: newRule.charge_amount,
          is_active: true,
          priority: newRule.priority,
        } as any);

      if (error) throw error;

      toast({
        title: language === "bn" ? "সফল" : "Success",
        description: language === "bn" ? "নতুন রুল যোগ হয়েছে" : "Rule added",
      });

      setNewRule({
        rule_type: "district",
        district_name: "",
        min_value: 0,
        max_value: null,
        charge_amount: 100,
        is_active: true,
        priority: 0,
      });

      fetchData();
    } catch (err) {
      console.error("Error adding rule:", err);
      toast({ title: "Error", description: "Failed to add rule", variant: "destructive" });
    }
  };

  const deleteRule = async (id: string) => {
    try {
      await supabase.from("delivery_charge_rules" as any).delete().eq("id", id);
      setRules((prev) => prev.filter((r) => r.id !== id));
      toast({
        title: language === "bn" ? "সফল" : "Success",
        description: language === "bn" ? "রুল মুছে ফেলা হয়েছে" : "Rule deleted",
      });
    } catch (err) {
      console.error("Error deleting rule:", err);
    }
  };

  const toggleRule = async (id: string, isActive: boolean) => {
    try {
      await supabase
        .from("delivery_charge_rules" as any)
        .update({ is_active: isActive } as any)
        .eq("id", id);
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: isActive } : r))
      );
    } catch (err) {
      console.error("Error toggling rule:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const ruleTypeLabel = (type: string) => {
    if (type === "district") return language === "bn" ? "জেলা" : "District";
    if (type === "order_amount") return language === "bn" ? "অর্ডার পরিমাণ" : "Order Amount";
    if (type === "product_weight") return language === "bn" ? "ওজন" : "Weight";
    return type;
  };

  return (
    <div className="space-y-6">
      {/* General Delivery Settings */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <CardTitle className="text-sm sm:text-base">{language === "bn" ? "ডেলিভারি চার্জ সেটিংস" : "Delivery Charge Settings"}</CardTitle>
                <CardDescription className="text-xs">
                  {language === "bn" ? "ডেলিভারি চার্জ এবং ফ্রি ডেলিভারি কনফিগার করুন" : "Configure delivery charges and free delivery"}
                </CardDescription>
              </div>
            </div>
            <Button onClick={saveSystemSettings} disabled={isSaving} size="sm" className="w-full sm:w-auto">
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {language === "bn" ? "সেভ" : "Save"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{language === "bn" ? "ডেলিভারি চার্জ সক্রিয়" : "Delivery Charge Enabled"}</Label>
            <Switch checked={deliveryEnabled} onCheckedChange={setDeliveryEnabled} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === "bn" ? "ডিফল্ট ডেলিভারি চার্জ (৳)" : "Default Delivery Charge (৳)"}</Label>
              <Input
                type="number"
                value={defaultCharge}
                onChange={(e) => setDefaultCharge(e.target.value)}
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                {language === "bn" ? "কোন রুল ম্যাচ না করলে এই চার্জ প্রযোজ্য হবে" : "Applied when no rule matches"}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{language === "bn" ? "ফ্রি ডেলিভারি (৳ এর উপরে)" : "Free Delivery Above (৳)"}</Label>
              <Input
                type="number"
                value={freeAbove}
                onChange={(e) => setFreeAbove(e.target.value)}
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                {language === "bn" ? "0 = ফ্রি ডেলিভারি নিষ্ক্রিয়" : "0 = free delivery disabled"}
              </p>
            </div>
          </div>

          <Separator />

          {/* Mandatory Delivery Charge */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {language === "bn" ? "ডেলিভারি চার্জ বাধ্যতামূলক" : "Mandatory Delivery Charge"}
            </Label>
            <Select value={deliveryChargeMandatory} onValueChange={setDeliveryChargeMandatory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {language === "bn" ? "বাধ্যতামূলক নয় (ফ্রি ডেলিভারি প্রযোজ্য)" : "Not mandatory (free delivery applies)"}
                </SelectItem>
                <SelectItem value="all">
                  {language === "bn" ? "সকল অর্ডারে বাধ্যতামূলক" : "Mandatory for all orders"}
                </SelectItem>
                <SelectItem value="cod_only">
                  {language === "bn" ? "শুধু ক্যাশ অন ডেলিভারিতে বাধ্যতামূলক" : "Mandatory for COD only"}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {deliveryChargeMandatory === "none" && (language === "bn"
                ? "ফ্রি ডেলিভারি সীমার উপরে অর্ডার করলে ডেলিভারি চার্জ মওকুফ হবে"
                : "Free delivery will apply when order exceeds the threshold")}
              {deliveryChargeMandatory === "all" && (language === "bn"
                ? "সকল অর্ডারে বাধ্যতামূলক — ফ্রি ডেলিভারি থ্রেশহোল্ড পূরণ হলেও চার্জ মওকুফ হবে না"
                : "Mandatory for all orders — delivery charge will not be waived even if free delivery threshold is met")}
              {deliveryChargeMandatory === "cod_only" && (language === "bn"
                ? "ক্যাশ অন ডেলিভারি অর্ডারে সবসময় ডেলিভারি চার্জ নেওয়া হবে। অন্যান্য পেমেন্টে ফ্রি ডেলিভারি প্রযোজ্য"
                : "COD orders will always have delivery charge. Other payment methods can get free delivery")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Partial Payment Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Percent className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>{language === "bn" ? "আংশিক পেমেন্ট (অ্যাডভান্স)" : "Partial Payment (Advance)"}</CardTitle>
              <CardDescription>
                {language === "bn" ? "গ্রাহকদের আংশিক অ্যাডভান্স পেমেন্টের সুযোগ দিন" : "Allow customers to pay a partial advance"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{language === "bn" ? "আংশিক পেমেন্ট সক্রিয়" : "Partial Payment Enabled"}</Label>
            <Switch checked={partialEnabled} onCheckedChange={setPartialEnabled} />
          </div>

          {partialEnabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{language === "bn" ? "সর্বনিম্ন অ্যাডভান্স (%)" : "Minimum Advance (%)"}</Label>
                <Input
                  type="number"
                  value={minAdvancePercent}
                  onChange={(e) => setMinAdvancePercent(e.target.value)}
                  min="10"
                  max="100"
                />
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                {language === "bn"
                  ? `গ্রাহক সর্বনিম্ন ${minAdvancePercent}% অ্যাডভান্স দিতে হবে। বাকি টাকা ডেলিভারির সময় পরিশোধ করবে।`
                  : `Customer must pay at least ${minAdvancePercent}% advance. Remaining due on delivery.`}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Charge Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>{language === "bn" ? "ডেলিভারি চার্জ রুলস" : "Delivery Charge Rules"}</CardTitle>
              <CardDescription>
                {language === "bn" ? "জেলা, অর্ডার পরিমাণ বা ওজন অনুযায়ী আলাদা ডেলিভারি চার্জ সেট করুন" : "Set different charges by district, order amount or weight"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Rule */}
          <div className="rounded-lg border p-4 space-y-4">
            <p className="text-sm font-medium">{language === "bn" ? "নতুন রুল যোগ করুন" : "Add New Rule"}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{language === "bn" ? "রুল টাইপ" : "Rule Type"}</Label>
                <Select value={newRule.rule_type} onValueChange={(v) => setNewRule((p) => ({ ...p, rule_type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="district">{language === "bn" ? "জেলা অনুযায়ী" : "By District"}</SelectItem>
                    <SelectItem value="order_amount">{language === "bn" ? "অর্ডার পরিমাণ" : "By Order Amount"}</SelectItem>
                    <SelectItem value="product_weight">{language === "bn" ? "ওজন অনুযায়ী" : "By Weight"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newRule.rule_type === "district" ? (
                <div className="space-y-1">
                  <Label className="text-xs">{language === "bn" ? "জেলা" : "District"}</Label>
                  <Select value={newRule.district_name} onValueChange={(v) => setNewRule((p) => ({ ...p, district_name: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === "bn" ? "জেলা নির্বাচন" : "Select"} />
                    </SelectTrigger>
                    <SelectContent>
                      {allDistricts.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      {newRule.rule_type === "order_amount"
                        ? (language === "bn" ? "সর্বনিম্ন (৳)" : "Min (৳)")
                        : (language === "bn" ? "সর্বনিম্ন (kg)" : "Min (kg)")}
                    </Label>
                    <Input
                      type="number"
                      value={newRule.min_value}
                      onChange={(e) => setNewRule((p) => ({ ...p, min_value: parseFloat(e.target.value) || 0 }))}
                      min="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      {newRule.rule_type === "order_amount"
                        ? (language === "bn" ? "সর্বোচ্চ (৳)" : "Max (৳)")
                        : (language === "bn" ? "সর্বোচ্চ (kg)" : "Max (kg)")}
                    </Label>
                    <Input
                      type="number"
                      value={newRule.max_value ?? ""}
                      onChange={(e) => setNewRule((p) => ({ ...p, max_value: e.target.value ? parseFloat(e.target.value) : null }))}
                      min="0"
                      placeholder={language === "bn" ? "সীমাহীন" : "Unlimited"}
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <Label className="text-xs">{language === "bn" ? "চার্জ (৳)" : "Charge (৳)"}</Label>
                <Input
                  type="number"
                  value={newRule.charge_amount}
                  onChange={(e) => setNewRule((p) => ({ ...p, charge_amount: parseFloat(e.target.value) || 0 }))}
                  min="0"
                />
              </div>
            </div>
            <Button size="sm" onClick={addRule}>
              <Plus className="h-4 w-4 mr-1" />
              {language === "bn" ? "রুল যোগ করুন" : "Add Rule"}
            </Button>
          </div>

          {/* Existing Rules Table */}
          {rules.length > 0 ? (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "bn" ? "টাইপ" : "Type"}</TableHead>
                    <TableHead>{language === "bn" ? "শর্ত" : "Condition"}</TableHead>
                    <TableHead>{language === "bn" ? "চার্জ" : "Charge"}</TableHead>
                    <TableHead>{language === "bn" ? "স্ট্যাটাস" : "Status"}</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <Badge variant="outline">{ruleTypeLabel(rule.rule_type)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {rule.rule_type === "district"
                          ? rule.district_name
                          : `${rule.min_value} - ${rule.max_value ?? "∞"} ${rule.rule_type === "order_amount" ? "৳" : "kg"}`}
                      </TableCell>
                      <TableCell className="font-medium">{formatPrice(rule.charge_amount)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={(v) => rule.id && toggleRule(rule.id, v)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => rule.id && deleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {language === "bn" ? "কোন রুল নেই। উপরে থেকে নতুন রুল যোগ করুন।" : "No rules yet. Add a new rule above."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
