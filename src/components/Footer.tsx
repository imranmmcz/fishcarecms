import { Link } from "react-router-dom";
import { Fish, Phone, Mail, MapPin, Facebook, Youtube, MessageCircle, Instagram, Twitter, Globe, Linkedin, Github } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { UnderwaterEffect } from "@/components/UnderwaterEffect";
import { usePageContent } from "@/hooks/usePageContent";

const iconMap: Record<string, any> = {
  Facebook, Youtube, MessageCircle, Instagram, Twitter, Globe, Linkedin, Github
};

const Footer = () => {
  const { t, language } = useLanguage();
  const { getSectionContent } = usePageContent();

  const footerData = getSectionContent<Record<string, any>>("footer");

  // Fallback data
  const companyName = footerData?.companyName || "FishCare";
  const companyDesc = footerData
    ? (language === "bn" ? footerData.companyDescription_bn : footerData.companyDescription_en)
    : (language === "bn"
      ? "মাছ চাষিদের জন্য সম্পূর্ণ ডিজিটাল সমাধান। পুকুর ব্যবস্থাপনা, খাদ্য গণনা, রোগ নির্ণয় এবং আরও অনেক কিছু।"
      : "Complete digital solution for fish farmers. Pond management, feed calculation, disease diagnosis and much more.");

  const quickLinks = footerData?.quickLinks || [
    { name_bn: t.modules, name_en: "Modules", path: "/modules" },
    { name_bn: t.pondCalculator, name_en: "Pond Calculator", path: "/pond-calculator" },
    { name_bn: t.fishStocking, name_en: "Fish Stocking", path: "/fish-stocking" },
    { name_bn: t.feedManagement, name_en: "Feed Management", path: "/feed-management" },
    { name_bn: t.fishAdvice, name_en: "Fish Advice", path: "/fish-advice" },
    { name_bn: t.shop, name_en: "Shop", path: "/shop" },
  ];

  const socialLinks = footerData?.socialLinks || [
    { name: "Facebook", icon: "Facebook", url: "https://www.facebook.com/fishcare.com.bd" },
    { name: "YouTube", icon: "Youtube", url: "https://youtube.com/fishcare" },
    { name: "WhatsApp", icon: "MessageCircle", url: "https://wa.me/8801978865277" },
  ];

  const phone = footerData?.phone || "+880 1978 865277";
  const email = footerData?.email || "support@fishcare.com.bd";
  const addressLine1 = footerData?.address_line1 || "Manirampur, Jashore";
  const addressLine2 = footerData?.address_line2 || "Khulna, Bangladesh";
  const bottomText = footerData
    ? (language === "bn" ? footerData.bottomText_bn : footerData.bottomText_en)
    : (language === "bn" ? "মাছ চাষিদের সেবায় নিবেদিত 🐟" : "Dedicated to serving fish farmers 🐟");

  const quickLinksHeading = footerData
    ? (language === "bn" ? footerData.quickLinksHeading_bn : footerData.quickLinksHeading_en)
    : (language === "bn" ? "দ্রুত লিংক" : "Quick Links");

  const socialHeading = footerData
    ? (language === "bn" ? footerData.socialHeading_bn : footerData.socialHeading_en)
    : (language === "bn" ? "সোশ্যাল মিডিয়া" : "Social Media");

  const contactHeading = footerData
    ? (language === "bn" ? footerData.contactHeading_bn : footerData.contactHeading_en)
    : (language === "bn" ? "যোগাযোগ" : "Contact");

  const socialSubtext = footerData
    ? (language === "bn" ? footerData.socialSubtext_bn : footerData.socialSubtext_en)
    : (language === "bn" ? "আমাদের সাথে সংযুক্ত থাকুন" : "Stay connected with us");

  return (
    <footer className="bg-gradient-to-b from-cyan-900/30 via-teal-800/25 to-primary/20 border-t border-border relative overflow-hidden">
      <UnderwaterEffect bubbleCount={18} fishCount={6} />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Logo & Company Details */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Fish className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">{companyName}</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">{companyDesc}</p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">{quickLinksHeading}</h3>
            <ul className="space-y-2">
              {quickLinks.map((link: any, i: number) => (
                <li key={i}>
                  <Link 
                    to={link.path}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {language === "bn" ? link.name_bn : link.name_en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Social Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">{socialHeading}</h3>
            <div className="flex flex-col space-y-3">
              {socialLinks.map((social: any, i: number) => {
                const IconComponent = iconMap[social.icon] || Globe;
                return (
                  <a
                    key={i}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors text-sm group"
                  >
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span>{social.name}</span>
                  </a>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground pt-2">{socialSubtext}</p>
          </div>

          {/* Column 4: Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">{contactHeading}</h3>
            <div className="space-y-3">
              <a 
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <span>{phone}</span>
              </a>
              <a 
                href={`mailto:${email}`}
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <span>{email}</span>
              </a>
              <div className="flex items-start gap-3 text-muted-foreground text-sm">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p>{addressLine1}</p>
                  <p>{addressLine2}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-xs text-muted-foreground">{bottomText}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
