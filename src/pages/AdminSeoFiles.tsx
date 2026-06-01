import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Copy, RefreshCw, Save, Globe, FileText, Send } from "lucide-react";

type SitemapEntry = {
  loc: string;
  changefreq?: string;
  priority?: string;
  lastmod?: string;
};

const DEFAULT_BASE_URL = "https://fishcare.com.bd";

const STATIC_ROUTES: SitemapEntry[] = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/shop", changefreq: "daily", priority: "0.9" },
  { loc: "/modules", changefreq: "weekly", priority: "0.8" },
  { loc: "/blog", changefreq: "daily", priority: "0.8" },
  { loc: "/fish-species", changefreq: "weekly", priority: "0.8" },
  { loc: "/disease-advice", changefreq: "weekly", priority: "0.8" },
  { loc: "/fish-advice", changefreq: "weekly", priority: "0.7" },
  { loc: "/market-price", changefreq: "daily", priority: "0.7" },
  { loc: "/fisheries-contact", changefreq: "monthly", priority: "0.6" },
  { loc: "/track-order", changefreq: "monthly", priority: "0.6" },
  { loc: "/pond-calculator", changefreq: "monthly", priority: "0.7" },
  { loc: "/fish-stocking", changefreq: "monthly", priority: "0.6" },
  { loc: "/stocking-density", changefreq: "monthly", priority: "0.6" },
  { loc: "/biomass-calculator", changefreq: "monthly", priority: "0.6" },
  { loc: "/feed-management", changefreq: "monthly", priority: "0.6" },
  { loc: "/feed-formula", changefreq: "monthly", priority: "0.6" },
  { loc: "/smart-feed-calculator", changefreq: "monthly", priority: "0.6" },
  { loc: "/medicine-application", changefreq: "monthly", priority: "0.7" },
  { loc: "/medicine-recommendation", changefreq: "monthly", priority: "0.7" },
  { loc: "/fertilizer-calculator", changefreq: "monthly", priority: "0.6" },
  { loc: "/water-quality", changefreq: "monthly", priority: "0.6" },
  { loc: "/cost-calculator", changefreq: "monthly", priority: "0.6" },
];

const DEFAULT_ROBOTS_OPTIONS = {
  allowAll: true,
  blockAiBots: true,
  includeSitemap: true,
  disallowPaths: [
    "/admin", "/admin/", "/dashboard", "/dashboard/",
    "/pos", "/pos/", "/checkout", "/order-confirmation",
    "/auth", "/register", "/forgot-password", "/reset-password",
    "/profile", "/wishlist", "/install",
    "/*?*utm_", "/*?*ref=",
  ].join("\n"),
};

function buildSitemap(baseUrl: string, entries: SitemapEntry[]): string {
  const url = baseUrl.replace(/\/$/, "");
  const today = new Date().toISOString().split("T")[0];
  const items = entries.map((e) => {
    const lines = [
      `  <url>`,
      `    <loc>${url}${e.loc}</loc>`,
      `    <lastmod>${e.lastmod || today}</lastmod>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ].filter(Boolean);
    return lines.join("\n");
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join("\n")}\n</urlset>`;
}

function buildRobots(baseUrl: string, opts: typeof DEFAULT_ROBOTS_OPTIONS): string {
  const lines: string[] = [];
  lines.push(`# Robots.txt - generated from Admin Panel`);
  lines.push("");
  lines.push("User-agent: *");
  lines.push(opts.allowAll ? "Allow: /" : "Disallow: /");
  for (const p of opts.disallowPaths.split("\n").map((s) => s.trim()).filter(Boolean)) {
    lines.push(`Disallow: ${p}`);
  }
  if (opts.blockAiBots) {
    lines.push("");
    lines.push("# AI scrapers");
    for (const bot of ["GPTBot", "ChatGPT-User", "CCBot", "anthropic-ai", "Claude-Web"]) {
      lines.push(`User-agent: ${bot}`);
      lines.push("Disallow: /admin/");
      lines.push("Disallow: /dashboard/");
      lines.push("");
    }
  }
  if (opts.includeSitemap) {
    lines.push("");
    lines.push(`Sitemap: ${baseUrl.replace(/\/$/, "")}/sitemap.xml`);
  }
  return lines.join("\n");
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function pingSearchEngine(url: string, label: string) {
  try {
    await fetch(url, { mode: "no-cors" });
    toast.success(`${label} ping sent`);
  } catch {
    toast.error(`${label} ping failed`);
  }
}

export default function AdminSeoFiles() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [sitemap, setSitemap] = useState("");
  const [robots, setRobots] = useState("");
  const [robotsOpts, setRobotsOpts] = useState(DEFAULT_ROBOTS_OPTIONS);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ total: 0, products: 0, posts: 0, pages: 0 });
  const [pinging, setPinging] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["sitemap_base_url", "sitemap_xml_content", "robots_txt_content", "robots_options"]);
      const map = new Map((data ?? []).map((r: any) => [r.setting_key, r.setting_value]));
      if (map.get("sitemap_base_url")) setBaseUrl(map.get("sitemap_base_url")!);
      if (map.get("sitemap_xml_content")) setSitemap(map.get("sitemap_xml_content")!);
      if (map.get("robots_txt_content")) setRobots(map.get("robots_txt_content")!);
      if (map.get("robots_options")) {
        try { setRobotsOpts({ ...DEFAULT_ROBOTS_OPTIONS, ...JSON.parse(map.get("robots_options")!) }); } catch {}
      }
    })();
  }, []);

  const generateSitemap = useCallback(async () => {
    setGenerating(true);
    try {
      const entries: SitemapEntry[] = [...STATIC_ROUTES];
      const [productsRes, postsRes, pagesRes] = await Promise.all([
        supabase.from("products").select("id, updated_at").limit(5000),
        supabase.from("blog_posts").select("slug, updated_at").eq("status", "published").limit(5000),
        supabase.from("custom_pages").select("slug, updated_at").eq("status", "published").limit(5000),
      ]);
      const products = productsRes.data ?? [];
      const posts = postsRes.data ?? [];
      const pages = pagesRes.data ?? [];
      for (const p of products) {
        entries.push({
          loc: `/product/${(p as any).id}`,
          lastmod: (p as any).updated_at?.split("T")[0],
          changefreq: "weekly",
          priority: "0.7",
        });
      }
      for (const p of posts) {
        if (!(p as any).slug) continue;
        entries.push({
          loc: `/blog/${(p as any).slug}`,
          lastmod: (p as any).updated_at?.split("T")[0],
          changefreq: "monthly",
          priority: "0.6",
        });
      }
      for (const p of pages) {
        if (!(p as any).slug) continue;
        entries.push({
          loc: `/pages/${(p as any).slug}`,
          lastmod: (p as any).updated_at?.split("T")[0],
          changefreq: "monthly",
          priority: "0.5",
        });
      }
      const xml = buildSitemap(baseUrl, entries);
      setSitemap(xml);
      setStats({ total: entries.length, products: products.length, posts: posts.length, pages: pages.length });
      toast.success(`Sitemap generated: ${entries.length} URLs`);
      await pingBoth();
    } catch (e: any) {
      toast.error(e.message || "Failed to generate sitemap");
    } finally {
      setGenerating(false);
    }
  }, [baseUrl]);

  const generateRobots = useCallback(async () => {
    setRobots(buildRobots(baseUrl, robotsOpts));
    toast.success("Robots.txt generated");
    await pingBoth();
  }, [baseUrl, robotsOpts, sitemap]);

  const saveAll = useCallback(async () => {
    setSaving(true);
    try {
      const rows = [
        { setting_key: "sitemap_base_url", setting_value: baseUrl, description: "Base URL for sitemap & robots" },
        { setting_key: "sitemap_xml_content", setting_value: sitemap, description: "Generated sitemap.xml content" },
        { setting_key: "robots_txt_content", setting_value: robots, description: "robots.txt content" },
        { setting_key: "robots_options", setting_value: JSON.stringify(robotsOpts), description: "robots.txt builder options" },
      ];
      const { error } = await supabase.from("system_settings").upsert(rows, { onConflict: "setting_key" });
      if (error) throw error;
      toast.success("Saved to database");
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }, [baseUrl, sitemap, robots, robotsOpts]);

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const handlePing = async (engine: "google" | "bing") => {
    const sitemapUrl = `${baseUrl.replace(/\/$/, "")}/sitemap.xml`;
    const label = engine === "google" ? "Google" : "Bing";
    const url = engine === "google"
      ? `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
      : `https://www.bing.com/webmaster/ping.aspx?siteMap=${encodeURIComponent(sitemapUrl)}`;
    setPinging(label);
    await pingSearchEngine(url, label);
    setPinging(null);
  };

  const pingBoth = async () => {
    if (!sitemap) return;
    const sitemapUrl = `${baseUrl.replace(/\/$/, "")}/sitemap.xml`;
    await pingSearchEngine(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, "Google");
    await pingSearchEngine(`https://www.bing.com/webmaster/ping.aspx?siteMap=${encodeURIComponent(sitemapUrl)}`, "Bing");
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-2 sm:p-4">
        <div>
          <h1 className="text-2xl font-bold">SEO Files Manager</h1>
          <p className="text-muted-foreground text-sm">Auto-generate sitemap.xml and manage robots.txt</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Base URL</CardTitle>
            <CardDescription>The public domain used for all sitemap URLs and the robots sitemap directive.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://fishcare.com.bd" />
          </CardContent>
        </Card>

        <Tabs defaultValue="sitemap" className="w-full">
          <TabsList>
            <TabsTrigger value="sitemap">Sitemap.xml</TabsTrigger>
            <TabsTrigger value="robots">Robots.txt</TabsTrigger>
          </TabsList>

          <TabsContent value="sitemap" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Sitemap Generator</CardTitle>
                <CardDescription>
                  Auto-generated from static routes plus products, blog posts, and custom pages from the database.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={generateSitemap} disabled={generating}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${generating ? "animate-spin" : ""}`} />
                    {generating ? "Generating..." : "Auto-Generate"}
                  </Button>
                  <Button variant="secondary" onClick={() => copy(sitemap, "Sitemap")} disabled={!sitemap}>
                    <Copy className="h-4 w-4 mr-2" /> Copy
                  </Button>
                  <Button variant="secondary" onClick={() => download("sitemap.xml", sitemap, "application/xml")} disabled={!sitemap}>
                    <Download className="h-4 w-4 mr-2" /> Download
                  </Button>
                  <Button variant="outline" onClick={() => handlePing("google")} disabled={!sitemap || !!pinging}>
                    <Send className={`h-4 w-4 mr-2 ${pinging === "Google" ? "animate-pulse" : ""}`} />
                    {pinging === "Google" ? "Pinging Google..." : "Ping Google"}
                  </Button>
                  <Button variant="outline" onClick={() => handlePing("bing")} disabled={!sitemap || !!pinging}>
                    <Send className={`h-4 w-4 mr-2 ${pinging === "Bing" ? "animate-pulse" : ""}`} />
                    {pinging === "Bing" ? "Pinging Bing..." : "Ping Bing"}
                  </Button>
                </div>
                {stats.total > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Total: <b>{stats.total}</b> · Static: <b>{STATIC_ROUTES.length}</b> · Products: <b>{stats.products}</b> · Blog: <b>{stats.posts}</b> · Pages: <b>{stats.pages}</b>
                  </div>
                )}
                <Textarea value={sitemap} onChange={(e) => setSitemap(e.target.value)} rows={20} className="font-mono text-xs" placeholder="Click Auto-Generate to build sitemap.xml" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="robots" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Robots.txt Builder</CardTitle>
                <CardDescription>Configure crawler access rules and regenerate.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between gap-2 rounded-md border p-3">
                    <Label htmlFor="allowAll">Allow all crawlers</Label>
                    <Switch id="allowAll" checked={robotsOpts.allowAll} onCheckedChange={(v) => setRobotsOpts({ ...robotsOpts, allowAll: v })} />
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-md border p-3">
                    <Label htmlFor="blockAi">Block AI scrapers</Label>
                    <Switch id="blockAi" checked={robotsOpts.blockAiBots} onCheckedChange={(v) => setRobotsOpts({ ...robotsOpts, blockAiBots: v })} />
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-md border p-3">
                    <Label htmlFor="incSitemap">Include sitemap link</Label>
                    <Switch id="incSitemap" checked={robotsOpts.includeSitemap} onCheckedChange={(v) => setRobotsOpts({ ...robotsOpts, includeSitemap: v })} />
                  </div>
                </div>
                <div>
                  <Label>Disallowed paths (one per line)</Label>
                  <Textarea value={robotsOpts.disallowPaths} onChange={(e) => setRobotsOpts({ ...robotsOpts, disallowPaths: e.target.value })} rows={8} className="font-mono text-xs mt-1" />
                </div>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={generateRobots}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Regenerate
                  </Button>
                  <Button variant="secondary" onClick={() => copy(robots, "Robots.txt")} disabled={!robots}>
                    <Copy className="h-4 w-4 mr-2" /> Copy
                  </Button>
                  <Button variant="secondary" onClick={() => download("robots.txt", robots, "text/plain")} disabled={!robots}>
                    <Download className="h-4 w-4 mr-2" /> Download
                  </Button>
                </div>
                <Textarea value={robots} onChange={(e) => setRobots(e.target.value)} rows={16} className="font-mono text-xs" placeholder="Click Regenerate to build robots.txt" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="sticky bottom-4 flex justify-end">
          <Button size="lg" onClick={saveAll} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save All Settings"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">How to deploy</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>1. Click <b>Auto-Generate</b> to build sitemap.xml from the latest content.</p>
            <p>2. Click <b>Regenerate</b> on the Robots tab to rebuild robots.txt from the toggles.</p>
            <p>3. Click <b>Download</b> on each tab and replace <code>public/sitemap.xml</code> and <code>public/robots.txt</code>, or paste into Lovable's file editor.</p>
            <p>4. Click <b>Save All Settings</b> to keep a copy in the database for future regeneration.</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}