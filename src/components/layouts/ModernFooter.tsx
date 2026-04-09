import { Link } from "react-router-dom";
import { Fish, Phone, Mail, MapPin, Facebook, Youtube, MessageCircle, Instagram, Twitter, Globe, Linkedin, Github, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageContent } from "@/hooks/usePageContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const iconMap: Record<string, any> = {
  Facebook, Youtube, MessageCircle, Instagram, Twitter, Globe, Linkedin, Github,
  Send: MessageCircle, Phone, Mail, MapPin,
};

export const ModernFooter = () => {
  const { t, language } = useLanguage();
  const { getSectionContent } = usePageContent();
  const footerData = getSectionContent<Record<string, any>>("footer");
  const headerData = getSectionContent<Record<string, any>>("header");

  const siteLogoUrl = headerData?.logoUrl || footerData?.logoUrl || null;
  const companyName = headerData?.companyName || footerData?.companyName || "FishCare";
  const companyDesc = footerData
    ? (language === "bn" ? footerData.companyDescription_bn : footerData.companyDescription_en)
    : (language === "bn" ? "মাছ চাষিদের জন্য সম্পূর্ণ ডিজিটাল সমাধান।" : "Complete digital solution for fish farmers.");

  const quickLinks = footerData?.quickLinks || [
    { name_bn: "হোম", name_en: "Home", path: "/" },
    { name_bn: "শপ", name_en: "Shop", path: "/shop" },
    { name_bn: "মডিউল", name_en: "Modules", path: "/modules" },
    { name_bn: "ব্লগ", name_en: "Blog", path: "/blog" },
    { name_bn: "মাছের পরামর্শ", name_en: "Fish Advice", path: "/fish-advice" },
  ];

  const socialLinks = footerData?.socialLinks || [
    { name: "Facebook", icon: "Facebook", url: "#" },
    { name: "YouTube", icon: "Youtube", url: "#" },
  ];

  const phone = footerData?.phone || "+880 1978 865277";
  const email = footerData?.email || "support@fishcare.com.bd";

  return (
    <footer className="border-t border-border" style={{ backgroundColor: 'hsl(var(--footer-bg, 210 29% 18%))' }}>
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="space-y-5">
            <Link to="/" className="flex items-center gap-2.5">
              {siteLogoUrl ? (
                <img src={siteLogoUrl} alt={companyName} className="h-12 w-12 rounded-xl object-contain" />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Fish className="h-6 w-6 text-primary-foreground" />
                </div>
              )}
              <span className="text-2xl font-bold" style={{ color: 'hsl(var(--footer-heading, 0 0% 100%))' }}>{companyName}</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'hsl(var(--footer-text, 215 19% 78%))' }}>{companyDesc}</p>
            
            {/* Social Icons Row */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social: any, i: number) => {
                const IconComponent = iconMap[social.icon] || Globe;
                return (
                  <a key={i} href={social.url} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-primary/30 flex items-center justify-center transition-colors"
                    style={{ color: 'hsl(var(--footer-text, 215 19% 78%))' }}>
                    <IconComponent className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--footer-heading, 0 0% 100%))' }}>
              {language === "bn" ? "দ্রুত লিংক" : "Quick Links"}
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link: any, i: number) => (
                <li key={i}>
                  <Link to={link.path} className="text-sm hover:text-primary transition-colors flex items-center gap-2 group"
                    style={{ color: 'hsl(var(--footer-text, 215 19% 78%))' }}>
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {language === "bn" ? link.name_bn : link.name_en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Newsletter */}
          <div className="space-y-6">
            <h3 className="text-base font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--footer-heading, 0 0% 100%))' }}>
              {language === "bn" ? "যোগাযোগ" : "Contact"}
            </h3>
            <div className="space-y-3">
              <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                style={{ color: 'hsl(var(--footer-text, 215 19% 78%))' }}>
                <Phone className="h-4 w-4 shrink-0" />
                {phone}
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                style={{ color: 'hsl(var(--footer-text, 215 19% 78%))' }}>
                <Mail className="h-4 w-4 shrink-0" />
                {email}
              </a>
            </div>

            {/* Newsletter */}
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--footer-heading, 0 0% 100%))' }}>
                {language === "bn" ? "আপডেট পেতে সাবস্ক্রাইব করুন" : "Subscribe for updates"}
              </p>
              <div className="flex gap-2">
                <Input placeholder={language === "bn" ? "ইমেইল দিন" : "Your email"} className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-full text-sm" />
                <Button size="sm" className="rounded-full px-4 shrink-0">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-xs" style={{ color: 'hsl(var(--footer-text, 215 19% 78%) / 0.6)' }}>
            © {new Date().getFullYear()} {companyName}. {language === "bn" ? "সর্বস্বত্ব সংরক্ষিত।" : "All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  );
};
