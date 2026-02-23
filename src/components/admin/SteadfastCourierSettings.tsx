import { useState } from "react";
import { useSteadfast } from "@/hooks/useSteadfast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2, Save, Truck, Wallet, RefreshCw, ShieldCheck, Settings2, Zap,
} from "lucide-react";

export const SteadfastCourierSettings = () => {
  const { settings, isLoading, updateSettings, getBalance, syncAllStatuses, fraudCheck } = useSteadfast();
  const [isSaving, setIsSaving] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [autoCreate, setAutoCreate] = useState(false);
  const [autoStatus, setAutoStatus] = useState("processing");
  const [balance, setBalance] = useState<number | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [fraudPhone, setFraudPhone] = useState("");
  const [fraudResult, setFraudResult] = useState<any>(null);
  const [isCheckingFraud, setIsCheckingFraud] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize form from settings
  if (settings && !initialized) {
    setApiKey(settings.api_key || "");
    setSecretKey(settings.secret_key || "");
    setIsEnabled(settings.is_enabled);
    setAutoCreate(settings.auto_create_order);
    setAutoStatus(settings.auto_create_on_status || "processing");
    setInitialized(true);
  }

  const handleSave = async () => {
    setIsSaving(true);
    await updateSettings({
      api_key: apiKey,
      secret_key: secretKey,
      is_enabled: isEnabled,
      auto_create_order: autoCreate,
      auto_create_on_status: autoStatus,
    });
    setIsSaving(false);
  };

  const handleCheckBalance = async () => {
    setIsCheckingBalance(true);
    const result = await getBalance();
    if (result.data?.current_balance !== undefined) {
      setBalance(result.data.current_balance);
    } else {
      toast.error(result.error || "ব্যালেন্স চেক করতে সমস্যা হয়েছে");
    }
    setIsCheckingBalance(false);
  };

  const handleSyncStatuses = async () => {
    setIsSyncing(true);
    await syncAllStatuses();
    setIsSyncing(false);
  };

  const handleFraudCheck = async () => {
    if (!fraudPhone) return;
    setIsCheckingFraud(true);
    const result = await fraudCheck(fraudPhone);
    setFraudResult(result.data);
    setIsCheckingFraud(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Steadfast কুরিয়ার সেটিংস
          </CardTitle>
          <CardDescription>
            Steadfast কুরিয়ার API কনফিগারেশন এবং অটোমেশন সেটিংস
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>কুরিয়ার সার্ভিস সক্রিয় করুন</Label>
              <p className="text-xs text-muted-foreground">
                সক্রিয় করলে অর্ডার থেকে সরাসরি Steadfast-এ পার্সেল বুক করা যাবে
              </p>
            </div>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>

          <Separator />

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sf-api-key">API Key</Label>
              <Input
                id="sf-api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="আপনার Steadfast API Key দিন"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sf-secret-key">Secret Key</Label>
              <Input
                id="sf-secret-key"
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="আপনার Steadfast Secret Key দিন"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              📌 API Key এবং Secret Key পেতে{" "}
              <a href="https://portal.packzy.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                portal.packzy.com
              </a>{" "}
              এ লগইন করে Settings → API থেকে কপি করুন।
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>অটোমেটিক অর্ডার তৈরি</Label>
                <p className="text-xs text-muted-foreground">
                  নির্দিষ্ট স্ট্যাটাসে পৌঁছালে অটোমেটিক Steadfast-এ অর্ডার তৈরি হবে
                </p>
              </div>
              <Switch checked={autoCreate} onCheckedChange={setAutoCreate} />
            </div>

            {autoCreate && (
              <div className="grid gap-2">
                <Label>কোন স্ট্যাটাসে অটো-তৈরি হবে</Label>
                <Select value={autoStatus} onValueChange={setAutoStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="processing">প্রসেসিং</SelectItem>
                    <SelectItem value="shipped">শিপড</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            সংরক্ষণ করুন
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            দ্রুত কার্যক্রম
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Balance Check */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">ব্যালেন্স চেক</p>
                {balance !== null && (
                  <p className="text-lg font-bold text-primary">৳{balance}</p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckBalance}
              disabled={isCheckingBalance || !isEnabled}
            >
              {isCheckingBalance ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
            </Button>
          </div>

          {/* Sync All Statuses */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">সকল স্ট্যাটাস সিঙ্ক</p>
                <p className="text-xs text-muted-foreground">সকল সক্রিয় কনসাইনমেন্টের স্ট্যাটাস আপডেট</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncStatuses}
              disabled={isSyncing || !isEnabled}
            >
              {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>

          {/* Fraud Check */}
          <div className="p-3 rounded-lg border space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
              <p className="font-medium text-sm">ফ্রড চেক</p>
            </div>
            <div className="flex gap-2">
              <Input
                value={fraudPhone}
                onChange={(e) => setFraudPhone(e.target.value)}
                placeholder="ফোন নম্বর দিন"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleFraudCheck}
                disabled={isCheckingFraud || !fraudPhone || !isEnabled}
              >
                {isCheckingFraud ? <Loader2 className="h-4 w-4 animate-spin" /> : "চেক"}
              </Button>
            </div>
            {fraudResult && (
              <div className="text-sm p-2 rounded bg-muted">
                <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(fraudResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
