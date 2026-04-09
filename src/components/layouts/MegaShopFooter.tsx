import { Link } from "react-router-dom";
import { Fish, Phone, Mail, MapPin, Facebook, Youtube, MessageCircle, Instagram, Twitter, Globe, Linkedin, Github, ShieldCheck, Truck, CreditCard, Headphones } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageContent } from "@/hooks/usePageContent";

const iconMap: Record<string, any> = {
  Facebook, Youtube, MessageCircle, Instagram, Twitter, Globe, Linkedin, Github,
  Send: MessageCircle, Phone, Mail, MapPin,
};

export const MegaShopFooter = () => {
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
  ];

  const socialLinks = footerData?.socialLinks || [
    { name: "Facebook", icon: "Facebook", url: "#" },
    { name: "YouTube", icon: "Youtube", url: "#" },
  ];

  const phone = footerData?.phone || "+880 1978 865277";
  const email = footerData?.email || "support@fishcare.com.bd";
  const addressLine1 = footerData?.address_line1 || "Manirampur, Jashore";
  const addressLine2 = footerData?.address_line2 || "Khulna, Bangladesh";

  const features = [
    { icon: Truck, label: language === "bn" ? "দ্রুত ডেলিভারি" : "Fast Delivery", desc: language === "bn" ? "সারাদেশে" : "Nationwide" },
    { icon: ShieldCheck, label: language === "bn" ? "নিরাপদ পেমেন্ট" : "Secure Payment", desc: language === "bn" ? "১০০% সিকিউর" : "100% Secure" },
    { icon: CreditCard, label: language === "bn" ? "ক্যাশ অন ডেলিভারি" : "Cash on Delivery", desc: language === "bn" ? "সুবিধাজনক" : "Convenient" },
    { icon: Headphones, label: language === "bn" ? "২৪/৭ সাপোর্ট" : "24/7 Support", desc: language === "bn" ? "যেকোনো সময়" : "Anytime" },
  ];

  return (
    <footer>
      {/* Feature Strip */}
      <div className="border-t border-b border-border bg-muted/30">
        <div className="container py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div style={{ backgroundColor: 'hsl(var(--footer-bg, 210 29% 18%))' }}>
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company */}
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2">
                {siteLogoUrl ? (
                  <img src={siteLogoUrl} alt={companyName} className="h-10 w-10 rounded-lg object-contain" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Fish className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}
                <span className="text-xl font-bold" style={{ color: 'hsl(var(--footer-heading, 0 0% 100%))' }}>{companyName}</span>
              </Link>
              <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--footer-text, 215 19% 78%))' }}>{companyDesc}</p>
              <div className="flex gap-2">
                {socialLinks.map((social: any, i: number) => {
                  const IconComponent = iconMap[social.icon] || Globe;
                  return (
                    <a key={i} href={social.url} target="_blank" rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-white/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all"
                      style={{ color: 'hsl(var(--footer-text, 215 19% 78%))' }}>
                      <IconComponent className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--footer-heading, 0 0% 100%))' }}>
                {language === "bn" ? "দ্রুত লিংক" : "Quick Links"}
              </h3>
              <ul className="space-y-2">
                {quickLinks.map((link: any, i: number) => (
                  <li key={i}>
                    <Link to={link.path} className="text-sm hover:text-primary transition-colors"
                      style={{ color: 'hsl(var(--footer-text, 215 19% 78%))' }}>
                      {language === "bn" ? link.name_bn : link.name_en}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tools */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--footer-heading, 0 0% 100%))' }}>
                {language === "bn" ? "মাছ চাষ টুলস" : "Farming Tools"}
              </h3>
              <ul className="space-y-2">
                <li><Link to="/pond-calculator" className="text-sm hover:text-primary transition-colors" style={{ color: 'hsl(var(--footer-text, 215 19% 78%))' }}>{t.pondCalculator}</Link></li>
                <li><Link to="/feed-management" className="text-sm hover:text-primary transition-colors" style={{ color: 'hsl(var(--footer-text, 215 19% 78%))' }}>{t.feedManagement}</Link></li>
                <li><Link to="/fish-stocking" className="text-sm hover:text-primary transition-colors" style={{ color: 'hsl(var(--footer-text, 215 19% 78%))' }}>{t.fishStocking}</Link></li>
                <li><Link to="/water-quality" className="text-sm hover:text-primary transition-colors" style={{ color: 'hsl(var(--footer-text, 215 19% 78%))' }}>{t.waterQuality}</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--footer-heading, 0 0% 100%))' }}>
                {language === "bn" ? "যোগাযোগ" : "Contact Us"}
              </h3>
              <div className="space-y-3">
                <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  style={{ color: 'hsl(var(--footer-text, 215 19% 78%))' }}>
                  <Phone className="h-4 w-4 shrink-0" />{phone}
                </a>
                <a href={`mailto:${email}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  style={{ color: 'hsl(var(--footer-text, 215 19% 78%))' }}>
                  <Mail className="h-4 w-4 shrink-0" />{email}
                </a>
                <div className="flex items-start gap-2 text-sm" style={{ color: 'hsl(var(--footer-text, 215 19% 78%))' }}>
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <div><p>{addressLine1}</p><p>{addressLine2}</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods & Copyright */}
        <div className="border-t border-white/10">
          <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs" style={{ color: 'hsl(var(--footer-text, 215 19% 78%) / 0.6)' }}>
              © {new Date().getFullYear()} {companyName}. {language === "bn" ? "সর্বস্বত্ব সংরক্ষিত।" : "All rights reserved."}
            </p>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded bg-white/10 text-xs font-semibold" style={{ color: 'hsl(var(--footer-text, 215 19% 78%))' }}>bKash</div>
              <div className="px-3 py-1 rounded bg-white/10 text-xs font-semibold" style={{ color: 'hsl(var(--footer-text, 215 19% 78%))' }}>Nagad</div>
              <div className="px-3 py-1 rounded bg-white/10 text-xs font-semibold" style={{ color: 'hsl(var(--footer-text, 215 19% 78%))' }}>COD</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
