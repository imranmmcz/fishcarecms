import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CloudUpload, CloudDownload, FileJson, HardDrive, Loader2, CheckCircle, AlertCircle } from "lucide-react";

declare global {
  interface Window {
    google: any;
    gapi: any;
    tokenClient: any;
  }
}

const CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"; // User needs to replace this
const API_KEY = "YOUR_GOOGLE_API_KEY"; // User needs to replace this
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";
const SCOPES = "https://www.googleapis.com/auth/drive.file";

const DashboardBackup = () => {
  const { toast } = useToast();
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [backupFiles, setBackupFiles] = useState<any[]>([]);
  const [clientId, setClientId] = useState(localStorage.getItem("googleClientId") || "");
  const [apiKey, setApiKey] = useState(localStorage.getItem("googleApiKey") || "");

  const getAllLocalStorageData = () => {
    const data: Record<string, any> = {};
    const keysToBackup = [
      "farmingPondData",
      "farmingFishStockingData",
      "farmerIncomes",
      "farmerExpenses",
      "farmerPonds",
      "feedManagementData",
      "waterQualityData",
      "medicineData",
      "fertilizerData",
      "biomassData"
    ];
    
    keysToBackup.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          data[key] = JSON.parse(value);
        } catch {
          data[key] = value;
        }
      }
    });
    
    data.backupDate = new Date().toISOString();
    data.appVersion = "1.0.0";
    
    return data;
  };

  const restoreLocalStorageData = (data: Record<string, any>) => {
    Object.keys(data).forEach(key => {
      if (key !== "backupDate" && key !== "appVersion") {
        localStorage.setItem(key, JSON.stringify(data[key]));
      }
    });
  };

  const saveCredentials = () => {
    localStorage.setItem("googleClientId", clientId);
    localStorage.setItem("googleApiKey", apiKey);
    toast({
      title: "সংরক্ষিত হয়েছে",
      description: "Google API credentials সংরক্ষণ করা হয়েছে",
    });
  };

  const loadGoogleApi = async () => {
    if (!clientId || !apiKey) {
      toast({
        title: "ত্রুটি",
        description: "অনুগ্রহ করে Google Client ID এবং API Key প্রদান করুন",
        variant: "destructive",
      });
      return;
    }

    try {
      // Load the Google API script
      if (!window.gapi) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://apis.google.com/js/api.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Google API"));
          document.body.appendChild(script);
        });
      }

      // Load the Google Identity Services script
      if (!window.google?.accounts) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://accounts.google.com/gsi/client";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
          document.body.appendChild(script);
        });
      }

      // Initialize GAPI
      await new Promise<void>((resolve) => {
        window.gapi.load("client", async () => {
          await window.gapi.client.init({
            apiKey: apiKey,
            discoveryDocs: [DISCOVERY_DOC],
          });
          resolve();
        });
      });

      // Initialize the token client
      window.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.error) {
            toast({
              title: "ত্রুটি",
              description: "Google সাইন ইন ব্যর্থ হয়েছে",
              variant: "destructive",
            });
            return;
          }
          setIsSignedIn(true);
          loadBackupFiles();
          toast({
            title: "সফল",
            description: "Google Drive এ সংযুক্ত হয়েছে",
          });
        },
      });

      setIsGoogleLoaded(true);
      toast({
        title: "প্রস্তুত",
        description: "Google API লোড হয়েছে। এখন সাইন ইন করুন।",
      });
    } catch (error) {
      console.error("Error loading Google API:", error);
      toast({
        title: "ত্রুটি",
        description: "Google API লোড করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    }
  };

  const signIn = () => {
    if (window.tokenClient) {
      window.tokenClient.requestAccessToken();
    }
  };

  const signOut = () => {
    const token = window.gapi?.client?.getToken();
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken(null);
    }
    setIsSignedIn(false);
    setBackupFiles([]);
    toast({
      title: "সাইন আউট",
      description: "Google Drive থেকে সংযোগ বিচ্ছিন্ন হয়েছে",
    });
  };

  const loadBackupFiles = async () => {
    try {
      const response = await window.gapi.client.drive.files.list({
        q: "name contains 'fishfarm_backup' and mimeType='application/json'",
        fields: "files(id, name, createdTime, size)",
        orderBy: "createdTime desc",
      });
      setBackupFiles(response.result.files || []);
    } catch (error) {
      console.error("Error loading backup files:", error);
    }
  };

  const uploadBackup = async () => {
    if (!isSignedIn) {
      toast({
        title: "ত্রুটি",
        description: "অনুগ্রহ করে প্রথমে Google Drive এ সাইন ইন করুন",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const data = getAllLocalStorageData();
      const fileName = `fishfarm_backup_${new Date().toISOString().split("T")[0]}.json`;
      const fileContent = JSON.stringify(data, null, 2);
      const blob = new Blob([fileContent], { type: "application/json" });

      const metadata = {
        name: fileName,
        mimeType: "application/json",
      };

      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      form.append("file", blob);

      const token = window.gapi.client.getToken().access_token;
      const response = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        }
      );

      if (response.ok) {
        toast({
          title: "সফল",
          description: "ব্যাকআপ Google Drive এ আপলোড হয়েছে",
        });
        loadBackupFiles();
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "ত্রুটি",
        description: "ব্যাকআপ আপলোড করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadAndRestore = async (fileId: string, fileName: string) => {
    if (!isSignedIn) return;

    setIsDownloading(true);
    try {
      const token = window.gapi.client.getToken().access_token;
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        restoreLocalStorageData(data);
        toast({
          title: "সফল",
          description: `${fileName} থেকে ডেটা পুনরুদ্ধার হয়েছে`,
        });
      } else {
        throw new Error("Download failed");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "ত্রুটি",
        description: "ডেটা পুনরুদ্ধার করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleLocalBackup = () => {
    const data = getAllLocalStorageData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fishfarm_backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "সফল",
      description: "ব্যাকআপ ফাইল ডাউনলোড হয়েছে",
    });
  };

  const handleLocalRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        restoreLocalStorageData(data);
        toast({
          title: "সফল",
          description: "ডেটা সফলভাবে পুনরুদ্ধার হয়েছে",
        });
      } catch {
        toast({
          title: "ত্রুটি",
          description: "ফাইল পড়তে সমস্যা হয়েছে",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ব্যাকআপ ও রিস্টোর</h1>
          <p className="text-muted-foreground">আপনার সমস্ত ডেটা Google Drive এ সংরক্ষণ করুন</p>
        </div>

        {/* Google API Credentials */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              Google Drive সেটআপ
            </CardTitle>
            <CardDescription>
              Google Cloud Console থেকে Client ID এবং API Key সংগ্রহ করুন
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="আপনার Google Client ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="আপনার Google API Key"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={saveCredentials} variant="outline">
                সংরক্ষণ করুন
              </Button>
              {!isGoogleLoaded ? (
                <Button onClick={loadGoogleApi} className="bg-blue-600 hover:bg-blue-700">
                  Google API লোড করুন
                </Button>
              ) : !isSignedIn ? (
                <Button onClick={signIn} className="bg-green-600 hover:bg-green-700">
                  Google Drive এ সাইন ইন
                </Button>
              ) : (
                <Button onClick={signOut} variant="destructive">
                  সাইন আউট
                </Button>
              )}
            </div>
            {isSignedIn && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Google Drive সংযুক্ত</span>
              </div>
            )}
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-2">Google Cloud Console সেটআপ নির্দেশনা:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>console.cloud.google.com এ যান</li>
                <li>একটি নতুন প্রজেক্ট তৈরি করুন</li>
                <li>Google Drive API সক্রিয় করুন</li>
                <li>Credentials থেকে OAuth Client ID তৈরি করুন</li>
                <li>API Key তৈরি করুন</li>
                <li>OAuth consent screen কনফিগার করুন</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Google Drive Backup */}
        <Card className="border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudUpload className="h-5 w-5 text-green-500" />
              Google Drive ব্যাকআপ
            </CardTitle>
            <CardDescription>
              সরাসরি Google Drive এ ব্যাকআপ নিন
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={uploadBackup}
              disabled={!isSignedIn || isUploading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  আপলোড হচ্ছে...
                </>
              ) : (
                <>
                  <CloudUpload className="mr-2 h-4 w-4" />
                  Google Drive এ ব্যাকআপ নিন
                </>
              )}
            </Button>

            {backupFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">সংরক্ষিত ব্যাকআপ ফাইল:</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {backupFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/80"
                    >
                      <div className="flex items-center gap-2">
                        <FileJson className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(file.createdTime).toLocaleDateString("bn-BD")}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadAndRestore(file.id, file.name)}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CloudDownload className="mr-1 h-4 w-4" />
                            রিস্টোর
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Local Backup */}
        <Card className="border-orange-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-orange-500" />
              লোকাল ব্যাকআপ
            </CardTitle>
            <CardDescription>
              JSON ফাইল হিসেবে ডাউনলোড বা আপলোড করুন
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Button
                onClick={handleLocalBackup}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
              >
                <CloudDownload className="mr-2 h-4 w-4" />
                ব্যাকআপ ডাউনলোড করুন
              </Button>
              <div className="relative">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleLocalRestore}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Button
                  variant="outline"
                  className="w-full border-orange-500/50 hover:bg-orange-500/10"
                >
                  <CloudUpload className="mr-2 h-4 w-4" />
                  ব্যাকআপ থেকে রিস্টোর
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-blue-700">ব্যাকআপে যা অন্তর্ভুক্ত:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>পুকুরের তথ্য</li>
                  <li>মাছ মজুদের তথ্য</li>
                  <li>আয়ের রেকর্ড</li>
                  <li>ব্যয়ের রেকর্ড</li>
                  <li>খাবার ব্যবস্থাপনা</li>
                  <li>পানির গুণমান</li>
                  <li>ওষুধ ও সারের তথ্য</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardBackup;
