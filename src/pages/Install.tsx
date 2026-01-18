import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Download,
  Smartphone, 
  Wifi, 
  WifiOff, 
  Zap, 
  Shield, 
  CheckCircle2,
  Share,
  PlusSquare,
  MoreVertical,
  ArrowDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check device type
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast({
        title: "সফলভাবে ইনস্টল হয়েছে! 🎉",
        description: "অ্যাপটি আপনার হোম স্ক্রিনে যোগ করা হয়েছে।",
      });
    };

    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast({
        title: "ইনস্টল প্রম্পট পাওয়া যায়নি",
        description: "আপনার ব্রাউজার মেনু থেকে 'Add to Home Screen' বা 'Install App' অপশন ব্যবহার করুন।",
        variant: "destructive",
      });
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const features = [
    {
      icon: Zap,
      title: "দ্রুত লোডিং",
      description: "অ্যাপটি তাৎক্ষণিকভাবে লোড হয়, ইন্টারনেট স্পিড যাই হোক না কেন"
    },
    {
      icon: WifiOff,
      title: "অফলাইনে কাজ করে",
      description: "ইন্টারনেট সংযোগ ছাড়াই সব ক্যালকুলেটর ব্যবহার করুন"
    },
    {
      icon: Smartphone,
      title: "নেটিভ অ্যাপ অনুভূতি",
      description: "ফুলস্ক্রিন মোডে চালান, ব্রাউজার বার ছাড়াই"
    },
    {
      icon: Shield,
      title: "নিরাপদ ও সুরক্ষিত",
      description: "HTTPS এনক্রিপশন দ্বারা সুরক্ষিত"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Status Banner */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Badge 
            variant={isOnline ? "default" : "destructive"} 
            className="flex items-center gap-1"
          >
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? "অনলাইন" : "অফলাইন"}
          </Badge>
          {isInstalled && (
            <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800">
              <CheckCircle2 className="w-3 h-3" />
              ইনস্টল করা আছে
            </Badge>
          )}
        </div>

        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-xl">
            <span className="text-4xl">🐟</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            মৎস্য ক্যালকুলেটর অ্যাপ
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            আপনার ফোনে ইনস্টল করুন এবং যেকোনো সময় ব্যবহার করুন - এমনকি অফলাইনেও!
          </p>
        </div>

        {/* Install Card */}
        <Card className="max-w-lg mx-auto mb-10 border-2 border-primary/20 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {isInstalled ? "অ্যাপ ইনস্টল করা আছে ✓" : "এখনই ইনস্টল করুন"}
            </CardTitle>
            <CardDescription>
              {isInstalled 
                ? "আপনার হোম স্ক্রিন থেকে অ্যাপটি খুলুন" 
                : "হোম স্ক্রিনে যোগ করুন এবং দ্রুত অ্যাক্সেস পান"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isInstalled && (
              <>
                {/* Android/Chrome Install Button */}
                {deferredPrompt && (
                  <Button 
                    onClick={handleInstall} 
                    className="w-full h-14 text-lg gap-2"
                    size="lg"
                  >
                    <Download className="w-5 h-5" />
                    এখনই ইনস্টল করুন
                  </Button>
                )}

                {/* iOS Instructions */}
                {isIOS && !deferredPrompt && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold text-center">iPhone/iPad এ ইনস্টল করুন:</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Share className="w-4 h-4 text-primary" />
                        </div>
                        <span>Safari ব্রাউজারে <strong>Share</strong> বাটনে ক্লিক করুন</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <ArrowDown className="w-4 h-4 text-primary" />
                        </div>
                        <span>নিচে স্ক্রল করুন</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <PlusSquare className="w-4 h-4 text-primary" />
                        </div>
                        <span><strong>"Add to Home Screen"</strong> এ ট্যাপ করুন</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Android Instructions (fallback) */}
                {isAndroid && !deferredPrompt && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold text-center">Android এ ইনস্টল করুন:</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <MoreVertical className="w-4 h-4 text-primary" />
                        </div>
                        <span>ব্রাউজারের <strong>মেনু (⋮)</strong> বাটনে ক্লিক করুন</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <PlusSquare className="w-4 h-4 text-primary" />
                        </div>
                        <span><strong>"Install App"</strong> বা <strong>"Add to Home Screen"</strong> এ ট্যাপ করুন</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Desktop Instructions */}
                {!isIOS && !isAndroid && !deferredPrompt && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold text-center">Desktop এ ইনস্টল করুন:</h3>
                    <p className="text-sm text-center text-muted-foreground">
                      Chrome/Edge এ URL বারের ডান দিকে Install আইকন (⊕) এ ক্লিক করুন
                    </p>
                  </div>
                )}
              </>
            )}

            {isInstalled && (
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-700 dark:text-green-300">
                  অ্যাপটি সফলভাবে ইনস্টল করা হয়েছে!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">অ্যাপের সুবিধাসমূহ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <Card key={index} className="border border-border/50">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        {!isInstalled && (
          <div className="text-center mt-10">
            <p className="text-muted-foreground mb-4">
              ইনস্টল করতে সমস্যা হচ্ছে? আমাদের সাথে যোগাযোগ করুন।
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Install;
