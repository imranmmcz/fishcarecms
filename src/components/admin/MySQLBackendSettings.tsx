import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Database, Globe, Save, Loader2, RefreshCw, Eye, EyeOff, AlertTriangle, CheckCircle2, XCircle, Server } from "lucide-react";

interface MySQLConfig {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
  charset: string;
  timezone: string;
}

interface APIConfig {
  baseUrl: string;
  frontendUrl: string;
}

const STORAGE_KEY = "mysql_backend_config";
const API_STORAGE_KEY = "api_server_config";
const BACKEND_ENABLED_KEY = "mysql_backend_enabled";

const MySQLBackendSettings = () => {
  const { toast } = useToast();
  const { language } = useLanguage();

  const [isEnabled, setIsEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [showPassword, setShowPassword] = useState(false);

  const [mysqlConfig, setMysqlConfig] = useState<MySQLConfig>({
    host: "localhost",
    port: "3306",
    database: "",
    user: "",
    password: "",
    charset: "utf8mb4",
    timezone: "+06:00",
  });

  const [apiConfig, setApiConfig] = useState<APIConfig>({
    baseUrl: "",
    frontendUrl: window.location.origin,
  });

  // Load saved config
  useEffect(() => {
    try {
      const savedMySQL = localStorage.getItem(STORAGE_KEY);
      if (savedMySQL) setMysqlConfig(JSON.parse(savedMySQL));

      const savedAPI = localStorage.getItem(API_STORAGE_KEY);
      if (savedAPI) setApiConfig(JSON.parse(savedAPI));

      const savedEnabled = localStorage.getItem(BACKEND_ENABLED_KEY);
      if (savedEnabled) setIsEnabled(savedEnabled === "true");
    } catch (e) {
      console.error("Error loading backend config:", e);
    }
  }, []);

  const handleMySQLChange = (key: keyof MySQLConfig, value: string) => {
    setMysqlConfig((prev) => ({ ...prev, [key]: value }));
    setConnectionStatus("idle");
  };

  const handleAPIChange = (key: keyof APIConfig, value: string) => {
    setApiConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleBackend = (enabled: boolean) => {
    setIsEnabled(enabled);
    localStorage.setItem(BACKEND_ENABLED_KEY, enabled.toString());
    toast({
      title: language === "bn" ? "সফল" : "Success",
      description: enabled
        ? language === "bn"
          ? "MySQL ব্যাকএন্ড সক্রিয় করা হয়েছে"
          : "MySQL backend enabled"
        : language === "bn"
        ? "MySQL ব্যাকএন্ড নিষ্ক্রিয় করা হয়েছে"
        : "MySQL backend disabled",
    });
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mysqlConfig));
      localStorage.setItem(API_STORAGE_KEY, JSON.stringify(apiConfig));
      localStorage.setItem(BACKEND_ENABLED_KEY, isEnabled.toString());

      toast({
        title: language === "bn" ? "সফল" : "Success",
        description: language === "bn"
          ? "ব্যাকএন্ড কনফিগারেশন সেভ করা হয়েছে"
          : "Backend configuration saved",
      });
    } catch (error) {
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn"
          ? "কনফিগারেশন সেভ করতে সমস্যা হয়েছে"
          : "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setConnectionStatus("idle");
    try {
      const url = apiConfig.baseUrl.replace(/\/$/, "");
      const response = await fetch(`${url}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        setConnectionStatus("success");
        toast({
          title: language === "bn" ? "সফল" : "Success",
          description: language === "bn"
            ? "API সার্ভারের সাথে সংযোগ সফল!"
            : "API server connection successful!",
        });
      } else {
        throw new Error("Server returned error");
      }
    } catch (error) {
      setConnectionStatus("error");
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn"
          ? "API সার্ভারের সাথে সংযোগ ব্যর্থ। URL এবং সার্ভার চেক করুন।"
          : "API server connection failed. Check URL and server.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Enable/Disable Toggle */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {language === "bn" ? "ব্যাকএন্ড কানেকশন" : "Backend Connection"}
                </CardTitle>
                <CardDescription>
                  {language === "bn"
                    ? "PHP/MySQL ব্যাকএন্ড সক্রিয়/নিষ্ক্রিয় করুন"
                    : "Enable/Disable PHP/MySQL backend"}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={isEnabled ? "default" : "secondary"}>
                {isEnabled
                  ? language === "bn" ? "সক্রিয়" : "Active"
                  : language === "bn" ? "নিষ্ক্রিয়" : "Inactive"}
              </Badge>
              <Switch checked={isEnabled} onCheckedChange={handleToggleBackend} />
            </div>
          </div>
        </CardHeader>
      </Card>

      {isEnabled && (
        <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {language === "bn"
              ? "MySQL ব্যাকএন্ড সক্রিয় করলে ডাটা Hostinger MySQL সার্ভার থেকে লোড হবে। নিশ্চিত করুন API সার্ভার চালু আছে।"
              : "When MySQL backend is active, data will load from Hostinger MySQL server. Make sure API server is running."}
          </AlertDescription>
        </Alert>
      )}

      {/* API Server Config */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Globe className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {language === "bn" ? "API সার্ভার কনফিগারেশন" : "API Server Configuration"}
              </CardTitle>
              <CardDescription>
                {language === "bn"
                  ? "Node.js/Express API সার্ভারের URL এবং এনভায়রনমেন্ট"
                  : "Node.js/Express API server URL and environment"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === "bn" ? "API বেস URL" : "API Base URL"}</Label>
              <Input
                value={apiConfig.baseUrl}
                onChange={(e) => handleAPIChange("baseUrl", e.target.value)}
                placeholder="https://blog.fishcare.com.bd/api"
              />
              <p className="text-xs text-muted-foreground">
                {language === "bn" ? "ব্যাকএন্ড API-এর পূর্ণ URL" : "Full URL of backend API"}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{language === "bn" ? "ফ্রন্টএন্ড URL (CORS)" : "Frontend URL (CORS)"}</Label>
              <Input
                value={apiConfig.frontendUrl}
                onChange={(e) => handleAPIChange("frontendUrl", e.target.value)}
                placeholder="https://fishcare.lovable.app"
              />
              <p className="text-xs text-muted-foreground">
                {language === "bn" ? "CORS-এর জন্য ফ্রন্টএন্ড ডোমেইন" : "Frontend domain for CORS"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={testConnection} disabled={isTesting || !apiConfig.baseUrl}>
              {isTesting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {language === "bn" ? "কানেকশন টেস্ট" : "Test Connection"}
            </Button>
            {connectionStatus === "success" && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">{language === "bn" ? "সংযুক্ত" : "Connected"}</span>
              </div>
            )}
            {connectionStatus === "error" && (
              <div className="flex items-center gap-1 text-destructive">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">{language === "bn" ? "ব্যর্থ" : "Failed"}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* MySQL Database Config */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Server className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {language === "bn" ? "MySQL ডাটাবেজ কনফিগারেশন" : "MySQL Database Configuration"}
              </CardTitle>
              <CardDescription>
                {language === "bn"
                  ? "Hostinger MySQL ডাটাবেজের সংযোগ তথ্য"
                  : "Hostinger MySQL database connection details"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === "bn" ? "হোস্ট" : "Host"}</Label>
              <Input
                value={mysqlConfig.host}
                onChange={(e) => handleMySQLChange("host", e.target.value)}
                placeholder="localhost"
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "bn" ? "পোর্ট" : "Port"}</Label>
              <Input
                value={mysqlConfig.port}
                onChange={(e) => handleMySQLChange("port", e.target.value)}
                placeholder="3306"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{language === "bn" ? "ডাটাবেজ নাম" : "Database Name"}</Label>
            <Input
              value={mysqlConfig.database}
              onChange={(e) => handleMySQLChange("database", e.target.value)}
              placeholder="u109046763_cal"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === "bn" ? "ইউজার" : "Username"}</Label>
              <Input
                value={mysqlConfig.user}
                onChange={(e) => handleMySQLChange("user", e.target.value)}
                placeholder="u109046763_cal"
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "bn" ? "পাসওয়ার্ড" : "Password"}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={mysqlConfig.password}
                  onChange={(e) => handleMySQLChange("password", e.target.value)}
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === "bn" ? "ক্যারেক্টার সেট" : "Character Set"}</Label>
              <Input
                value={mysqlConfig.charset}
                onChange={(e) => handleMySQLChange("charset", e.target.value)}
                placeholder="utf8mb4"
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "bn" ? "টাইমজোন" : "Timezone"}</Label>
              <Input
                value={mysqlConfig.timezone}
                onChange={(e) => handleMySQLChange("timezone", e.target.value)}
                placeholder="+06:00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveConfig} disabled={isSaving} size="lg">
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {language === "bn" ? "কনফিগারেশন সেভ করুন" : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
};

export default MySQLBackendSettings;
