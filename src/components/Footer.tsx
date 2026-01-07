import { Link } from "react-router-dom";
import { Fish, Phone, Mail, MapPin, Facebook, Youtube, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t, language } = useLanguage();

  const quickLinks = [
    { name: t.modules, path: "/modules" },
    { name: t.pondCalculator, path: "/pond-calculator" },
    { name: t.fishStocking, path: "/fish-stocking" },
    { name: t.feedManagement, path: "/feed-management" },
    { name: t.fishAdvice, path: "/fish-advice" },
    { name: t.shop, path: "/shop" },
  ];

  const socialLinks = [
    { name: "Facebook", icon: Facebook, url: "https://www.facebook.com/fishcare.com.bd" },
    { name: "YouTube", icon: Youtube, url: "https://youtube.com/fishcare" },
    { name: "WhatsApp", icon: MessageCircle, url: "https://wa.me/8801978865277" },
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Logo & Company Details */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Fish className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">FishCare</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {language === "bn" 
                ? "মাছ চাষিদের জন্য সম্পূর্ণ ডিজিটাল সমাধান। পুকুর ব্যবস্থাপনা, খাদ্য গণনা, রোগ নির্ণয় এবং আরও অনেক কিছু।"
                : "Complete digital solution for fish farmers. Pond management, feed calculation, disease diagnosis and much more."
              }
            </p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} FishCare. All rights reserved.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              {language === "bn" ? "দ্রুত লিংক" : "Quick Links"}
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Social Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              {language === "bn" ? "সোশ্যাল মিডিয়া" : "Social Media"}
            </h3>
            <div className="flex flex-col space-y-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors text-sm group"
                >
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <social.icon className="w-4 h-4" />
                  </div>
                  <span>{social.name}</span>
                </a>
              ))}
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              {language === "bn" 
                ? "আমাদের সাথে সংযুক্ত থাকুন"
                : "Stay connected with us"
              }
            </p>
          </div>

          {/* Column 4: Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              {language === "bn" ? "যোগাযোগ" : "Contact"}
            </h3>
            <div className="space-y-3">
              <a 
                href="tel:+8801978865277"
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <span>+880 1978 865277</span>
              </a>
              <a 
                href="mailto:support@fishcare.com.bd"
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <span>support@fishcare.com.bd</span>
              </a>
              <div className="flex items-start gap-3 text-muted-foreground text-sm">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p>Manirampur, Jashore</p>
                  <p>Khulna, Bangladesh</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-xs text-muted-foreground">
            {language === "bn" 
              ? "মাছ চাষিদের সেবায় নিবেদিত 🐟"
              : "Dedicated to serving fish farmers 🐟"
            }
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
