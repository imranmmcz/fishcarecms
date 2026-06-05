import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink, Eye } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type Device = "desktop" | "tablet" | "mobile";

const deviceWidths: Record<Device, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 390,
};

const routes = [
  { path: "/", labelEn: "Home", labelBn: "হোম" },
  { path: "/shop", labelEn: "Shop", labelBn: "শপ" },
  { path: "/modules", labelEn: "Modules", labelBn: "মডিউল" },
];

export default function ThemeLivePreview() {
  const { language } = useLanguage();
  const [device, setDevice] = useState<Device>("desktop");
  const [route, setRoute] = useState<string>("/");
  const [nonce, setNonce] = useState<number>(Date.now());
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const reload = () => setNonce(Date.now());

  // Auto-reload when window regains focus (after saving theme settings)
  useEffect(() => {
    const onFocus = () => reload();
    const onCustom = () => reload();
    window.addEventListener("focus", onFocus);
    window.addEventListener("lovable:theme-updated", onCustom as EventListener);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("lovable:theme-updated", onCustom as EventListener);
    };
  }, []);

  const src = `${route}${route.includes("?") ? "&" : "?"}preview=1&_=${nonce}`;
  const width = deviceWidths[device];

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          {language === "bn" ? "লাইভ প্রিভিউ" : "Live Preview"}
        </CardTitle>
        <CardDescription>
          {language === "bn"
            ? "থিম রঙ, ফন্ট ও লেআউট পরিবর্তন এখানে তাৎক্ষণিক দেখুন। সেভ করার পর রিফ্রেশ চাপুন।"
            : "Preview color, typography and layout changes instantly. Press refresh after saving."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center gap-1 rounded-md border bg-muted/30 p-1">
            <Button
              size="sm"
              variant={device === "desktop" ? "default" : "ghost"}
              onClick={() => setDevice("desktop")}
              className="h-8 px-2"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={device === "tablet" ? "default" : "ghost"}
              onClick={() => setDevice("tablet")}
              className="h-8 px-2"
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={device === "mobile" ? "default" : "ghost"}
              onClick={() => setDevice("mobile")}
              className="h-8 px-2"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1 rounded-md border bg-muted/30 p-1 overflow-x-auto">
            {routes.map((r) => (
              <Button
                key={r.path}
                size="sm"
                variant={route === r.path ? "default" : "ghost"}
                onClick={() => setRoute(r.path)}
                className="h-8 px-2 text-xs"
              >
                {language === "bn" ? r.labelBn : r.labelEn}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={reload} className="h-8">
              <RefreshCw className="h-4 w-4 mr-1" />
              {language === "bn" ? "রিফ্রেশ" : "Refresh"}
            </Button>
            <Button size="sm" variant="outline" asChild className="h-8">
              <a href={route} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                {language === "bn" ? "খুলুন" : "Open"}
              </a>
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {language === "bn"
            ? `ভিউপোর্ট: ${width}px`
            : `Viewport: ${width}px`}
        </div>

        <div className="w-full overflow-auto rounded-lg border bg-muted/20 p-2 sm:p-4 flex justify-center">
          <div
            className="bg-background rounded-md shadow-lg overflow-hidden transition-all"
            style={{ width: `${width}px`, maxWidth: "100%" }}
          >
            <iframe
              ref={iframeRef}
              key={`${route}-${nonce}`}
              src={src}
              title="Theme live preview"
              className="w-full border-0 bg-background"
              style={{ height: "720px" }}
              sandbox="allow-same-origin allow-scripts allow-forms"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}