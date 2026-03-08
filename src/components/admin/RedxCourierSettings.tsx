import { useState } from "react";
import { useRedx } from "@/hooks/useRedx";
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
  Loader2, Save, Truck, Settings2, Zap, Search, Package, MapPin, ExternalLink, CheckCircle2,
} from "lucide-react";

export const RedxCourierSettings = () => {
  const { settings, isLoading, updateSettings, trackParcel, getTrackingUrl } = useRedx();
  const [isSaving, setIsSaving] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [autoCreate, setAutoCreate] = useState(false);
  const [autoStatus, setAutoStatus] = useState("processing");
  const [initialized, setInitialized] = useState(false);

  // Tracking
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);

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

  const handleTrack = async () => {
    if (!trackingNumber.trim()) return;
    setIsTracking(true);
    setTrackingResult(null);
    const result = await trackParcel(trackingNumber.trim());
    if (result.data) {
      setTrackingResult(result.data);
    }
    setIsTracking(false);
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
            RedX কুরিয়ার সেটিংস
          </CardTitle>
          <CardDescription>
            RedX কুরিয়ার সার্ভিস কনফিগারেশন এবং ট্র্যাকিং সেটিংস
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>কুরিয়ার সার্ভিস সক্রিয় করুন</Label>
              <p className="text-xs text-muted-foreground">
                সক্রিয় করলে অর্ডার থেকে RedX কুরিয়ারে পার্সেল বুক করা যাবে
              </p>
            </div>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>

          <Separator />

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="redx-api-key">API Token</Label>
              <Input
                id="redx-api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="RedX API Token"
              />
              <p className="text-xs text-muted-foreground">
                RedX মার্চেন্ট প্যানেল থেকে API Token সংগ্রহ করুন
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="redx-secret-key">Secret Key (ঐচ্ছিক)</Label>
              <Input
                id="redx-secret-key"
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="RedX Secret Key (যদি থাকে)"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>অটোমেটিক পার্সেল তৈরি</Label>
                <p className="text-xs text-muted-foreground">
                  নির্দিষ্ট স্ট্যাটাসে পৌঁছালে অটোমেটিক RedX-এ পার্সেল তৈরি হবে (API প্রয়োজন)
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

      {/* Service Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            RedX কুরিয়ার সার্ভিস তথ্য
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-destructive" />
              সার্ভিস বৈশিষ্ট্য
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">সার্ভিস এলাকা</p>
                  <p className="text-xs text-muted-foreground">সারা বাংলাদেশ (৬৪ জেলা)</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Truck className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">ডেলিভারি সময়</p>
                  <p className="text-xs text-muted-foreground">ঢাকা: ১-২ দিন | জেলা: ৩-৫ দিন</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">সার্ভিস ধরন</p>
                  <p className="text-xs text-muted-foreground">হোম ডেলিভারি, COD, রিটার্ন সার্ভিস</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">ওয়েবসাইট</p>
                  <a
                    href="https://redx.com.bd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline"
                  >
                    redx.com.bd
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Charge Info */}
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-medium text-sm">আনুমানিক চার্জ (পরিবর্তনশীল)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex justify-between border-b pb-1">
                <span>ঢাকার ভিতর (০.৫ কেজি পর্যন্ত)</span>
                <span className="font-medium text-foreground">৳৭০</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>ঢাকার উপকণ্ঠ</span>
                <span className="font-medium text-foreground">৳১০০</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>ঢাকার বাহিরে</span>
                <span className="font-medium text-foreground">৳১২০ - ৳১৫০</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>COD চার্জ</span>
                <span className="font-medium text-foreground">১% (সর্বনিম্ন ৳১০)</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground italic mt-2">
              * চার্জ পরিবর্তনশীল। সঠিক চার্জ জানতে RedX মার্চেন্ট প্যানেল দেখুন।
            </p>
          </div>

          {/* Contact */}
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-medium text-sm">যোগাযোগ</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>📞 হটলাইন: 16478</p>
              <p>📧 ইমেইল: support@redx.com.bd</p>
              <p>🌐 মার্চেন্ট প্যানেল: <a href="https://merchant.redx.com.bd" target="_blank" rel="noopener noreferrer" className="text-primary underline">merchant.redx.com.bd</a></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Tool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            দ্রুত ট্র্যাকিং
          </CardTitle>
          <CardDescription>
            RedX ট্র্যাকিং আইডি দিয়ে পার্সেলের অবস্থা জানুন
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg border space-y-3">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <p className="font-medium text-sm">পার্সেল ট্র্যাক করুন</p>
            </div>
            <div className="flex gap-2">
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="RedX ট্র্যাকিং আইডি লিখুন"
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleTrack}
                disabled={isTracking || !trackingNumber.trim()}
              >
                {isTracking ? <Loader2 className="h-4 w-4 animate-spin" /> : "ট্র্যাক"}
              </Button>
            </div>

            {trackingNumber.trim() && (
              <a
                href={getTrackingUrl(trackingNumber.trim())}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                RedX ওয়েবসাইটে ট্র্যাক করুন
              </a>
            )}

            {trackingResult && (
              <div className="text-sm p-3 rounded bg-muted space-y-2">
                {trackingResult.tracking ? (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">স্ট্যাটাস:</span>
                      <Badge variant={
                        trackingResult.tracking.status === "delivered" ? "default" :
                        trackingResult.tracking.status === "in_transit" ? "secondary" :
                        "outline"
                      }>
                        {trackingResult.tracking.status_bn || trackingResult.tracking.status}
                      </Badge>
                    </div>
                    {trackingResult.tracking.created_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">তৈরি তারিখ:</span>
                        <span>{trackingResult.tracking.created_at}</span>
                      </div>
                    )}
                    {trackingResult.tracking.area && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">এলাকা:</span>
                        <span>{trackingResult.tracking.area}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(trackingResult, null, 2)}</pre>
                )}
              </div>
            )}
          </div>

          {/* How to use */}
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-destructive" />
              ব্যবহার নির্দেশিকা
            </h4>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>RedX মার্চেন্ট প্যানেলে রেজিস্ট্রেশন করুন (merchant.redx.com.bd)</li>
              <li>মার্চেন্ট প্যানেল থেকে API Token সংগ্রহ করুন</li>
              <li>উপরে API Token বসিয়ে সংরক্ষণ করুন</li>
              <li>অর্ডার ম্যানেজমেন্ট থেকে সরাসরি RedX-এ পার্সেল তৈরি করুন</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
