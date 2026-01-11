import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Save, RefreshCw, Tv, LayoutTemplate, Sidebar, FileText, Layers } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface AdSettings {
  id: string;
  ad_client_id: string | null;
  header_ad_enabled: boolean;
  header_ad_slot: string | null;
  sidebar_ad_enabled: boolean;
  sidebar_ad_slot: string | null;
  footer_ad_enabled: boolean;
  footer_ad_slot: string | null;
  in_article_ad_enabled: boolean;
  in_article_ad_slot: string | null;
  between_modules_ad_enabled: boolean;
  between_modules_ad_slot: string | null;
}

const AdminAds = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AdSettings | null>(null);

  const t = {
    title: language === 'bn' ? 'বিজ্ঞাপন ব্যবস্থাপনা' : 'Ad Management',
    subtitle: language === 'bn' ? 'Google AdSense সেটিংস কনফিগার করুন' : 'Configure Google AdSense settings',
    clientId: language === 'bn' ? 'AdSense ক্লায়েন্ট আইডি' : 'AdSense Client ID',
    clientIdDesc: language === 'bn' ? 'আপনার AdSense পাবলিশার আইডি (ca-pub-XXXXXXXXXX)' : 'Your AdSense publisher ID (ca-pub-XXXXXXXXXX)',
    headerAd: language === 'bn' ? 'হেডার বিজ্ঞাপন' : 'Header Ad',
    headerAdDesc: language === 'bn' ? 'পেজের উপরে বিজ্ঞাপন দেখান' : 'Show ad at the top of pages',
    sidebarAd: language === 'bn' ? 'সাইডবার বিজ্ঞাপন' : 'Sidebar Ad',
    sidebarAdDesc: language === 'bn' ? 'সাইডবারে বিজ্ঞাপন দেখান' : 'Show ad in sidebar',
    footerAd: language === 'bn' ? 'ফুটার বিজ্ঞাপন' : 'Footer Ad',
    footerAdDesc: language === 'bn' ? 'পেজের নিচে বিজ্ঞাপন দেখান' : 'Show ad at the bottom of pages',
    inArticleAd: language === 'bn' ? 'আর্টিকেল বিজ্ঞাপন' : 'In-Article Ad',
    inArticleAdDesc: language === 'bn' ? 'কন্টেন্টের মধ্যে বিজ্ঞাপন দেখান' : 'Show ad within content',
    betweenModulesAd: language === 'bn' ? 'মডিউল বিজ্ঞাপন' : 'Between Modules Ad',
    betweenModulesAdDesc: language === 'bn' ? 'মডিউল কার্ডের মধ্যে বিজ্ঞাপন দেখান' : 'Show ad between module cards',
    adSlot: language === 'bn' ? 'অ্যাড স্লট আইডি' : 'Ad Slot ID',
    enabled: language === 'bn' ? 'সক্রিয়' : 'Enabled',
    save: language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Settings',
    refresh: language === 'bn' ? 'রিফ্রেশ' : 'Refresh',
    saveSuccess: language === 'bn' ? 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে' : 'Settings saved successfully',
    saveError: language === 'bn' ? 'সেটিংস সংরক্ষণে সমস্যা হয়েছে' : 'Error saving settings',
    loadError: language === 'bn' ? 'সেটিংস লোড করতে সমস্যা হয়েছে' : 'Error loading settings',
    adPositions: language === 'bn' ? 'বিজ্ঞাপন অবস্থান' : 'Ad Positions',
    adPositionsDesc: language === 'bn' ? 'কোথায় বিজ্ঞাপন প্রদর্শিত হবে তা নিয়ন্ত্রণ করুন' : 'Control where ads are displayed',
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ad_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error fetching ad settings:', error);
      toast({
        title: t.loadError,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('ad_settings')
        .update({
          ad_client_id: settings.ad_client_id,
          header_ad_enabled: settings.header_ad_enabled,
          header_ad_slot: settings.header_ad_slot,
          sidebar_ad_enabled: settings.sidebar_ad_enabled,
          sidebar_ad_slot: settings.sidebar_ad_slot,
          footer_ad_enabled: settings.footer_ad_enabled,
          footer_ad_slot: settings.footer_ad_slot,
          in_article_ad_enabled: settings.in_article_ad_enabled,
          in_article_ad_slot: settings.in_article_ad_slot,
          between_modules_ad_enabled: settings.between_modules_ad_enabled,
          between_modules_ad_slot: settings.between_modules_ad_slot,
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: t.saveSuccess,
      });
    } catch (error) {
      console.error('Error saving ad settings:', error);
      toast({
        title: t.saveError,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof AdSettings, value: any) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  const AdPositionCard = ({
    icon: Icon,
    title,
    description,
    enabledKey,
    slotKey,
  }: {
    icon: React.ElementType;
    title: string;
    description: string;
    enabledKey: keyof AdSettings;
    slotKey: keyof AdSettings;
  }) => (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              <Switch
                checked={settings?.[enabledKey] as boolean}
                onCheckedChange={(checked) => updateSetting(enabledKey, checked)}
              />
            </div>
            {settings?.[enabledKey] && (
              <div className="space-y-2">
                <Label className="text-sm">{t.adSlot}</Label>
                <Input
                  placeholder="1234567890"
                  value={settings?.[slotKey] as string || ''}
                  onChange={(e) => updateSetting(slotKey, e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchSettings} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t.refresh}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? '...' : t.save}
            </Button>
          </div>
        </div>

        {/* AdSense Client ID */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tv className="h-5 w-5" />
              {t.clientId}
            </CardTitle>
            <CardDescription>{t.clientIdDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="ca-pub-XXXXXXXXXX"
              value={settings?.ad_client_id || ''}
              onChange={(e) => updateSetting('ad_client_id', e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Ad Positions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5" />
              {t.adPositions}
            </CardTitle>
            <CardDescription>{t.adPositionsDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AdPositionCard
              icon={LayoutTemplate}
              title={t.headerAd}
              description={t.headerAdDesc}
              enabledKey="header_ad_enabled"
              slotKey="header_ad_slot"
            />

            <AdPositionCard
              icon={Sidebar}
              title={t.sidebarAd}
              description={t.sidebarAdDesc}
              enabledKey="sidebar_ad_enabled"
              slotKey="sidebar_ad_slot"
            />

            <AdPositionCard
              icon={LayoutTemplate}
              title={t.footerAd}
              description={t.footerAdDesc}
              enabledKey="footer_ad_enabled"
              slotKey="footer_ad_slot"
            />

            <AdPositionCard
              icon={FileText}
              title={t.inArticleAd}
              description={t.inArticleAdDesc}
              enabledKey="in_article_ad_enabled"
              slotKey="in_article_ad_slot"
            />

            <AdPositionCard
              icon={Layers}
              title={t.betweenModulesAd}
              description={t.betweenModulesAdDesc}
              enabledKey="between_modules_ad_enabled"
              slotKey="between_modules_ad_slot"
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAds;
