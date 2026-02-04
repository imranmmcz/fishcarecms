import React, { useEffect } from 'react';
import { useAdSettings } from '@/contexts/AdSettingsContext';

interface AdUnitProps {
  position: 'header' | 'sidebar' | 'footer' | 'in-article' | 'between-modules';
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const AdUnit: React.FC<AdUnitProps> = ({ position, className = '' }) => {
  const { adSettings, loading } = useAdSettings();

  useEffect(() => {
    if (!loading && adSettings?.ad_client_id) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error('AdSense error:', err);
      }
    }
  }, [loading, adSettings]);

  if (loading) return null;

  if (!adSettings?.ad_client_id) return null;

  const getAdSlotAndEnabled = () => {
    switch (position) {
      case 'header':
        return { enabled: adSettings.header_ad_enabled, slot: adSettings.header_ad_slot };
      case 'sidebar':
        return { enabled: adSettings.sidebar_ad_enabled, slot: adSettings.sidebar_ad_slot };
      case 'footer':
        return { enabled: adSettings.footer_ad_enabled, slot: adSettings.footer_ad_slot };
      case 'in-article':
        return { enabled: adSettings.in_article_ad_enabled, slot: adSettings.in_article_ad_slot };
      case 'between-modules':
        return { enabled: adSettings.between_modules_ad_enabled, slot: adSettings.between_modules_ad_slot };
      default:
        return { enabled: false, slot: null };
    }
  };

  const { enabled, slot } = getAdSlotAndEnabled();

  if (!enabled || !slot) return null;

  return (
    <div className={`ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adSettings.ad_client_id}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdUnit;
