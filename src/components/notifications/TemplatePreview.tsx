import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Phone, Bell } from "lucide-react";

const SAMPLE_DATA: Record<string, string> = {
  "{user_name}": "রহিম উদ্দিন",
  "{order_id}": "ORD-20260306-0001",
  "{order_status}": "শিপড",
  "{product_name}": "ফিশ ফিড প্রিমিয়াম",
  "{delivery_date}": "২০২৬-০৩-১০",
  "{due_amount}": "৳ ১,৫০০",
  "{farm_name}": "সবুজ মৎস্য খামার",
  "{pond_name}": "পুকুর-১",
};

const CHANNEL_ICONS: Record<string, any> = { email: Mail, sms: Phone, whatsapp: MessageSquare, in_app: Bell };
const CHANNEL_LABELS: Record<string, { bn: string; en: string }> = {
  email: { bn: "ইমেইল", en: "Email" },
  sms: { bn: "SMS", en: "SMS" },
  whatsapp: { bn: "WhatsApp", en: "WhatsApp" },
  in_app: { bn: "ইন-অ্যাপ", en: "In-App" },
};

function replaceVars(text: string): string {
  let result = text;
  Object.entries(SAMPLE_DATA).forEach(([key, val]) => {
    result = result.replaceAll(key, val);
  });
  return result;
}

interface TemplatePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: any;
}

export function TemplatePreview({ open, onOpenChange, template }: TemplatePreviewProps) {
  const { language } = useLanguage();
  const t = (bn: string, en: string) => language === "bn" ? bn : en;

  if (!template) return null;

  const subject = language === "bn" && template.subject_bn ? template.subject_bn : template.subject;
  const message = language === "bn" && template.message_bn ? template.message_bn : template.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("টেমপ্লেট প্রিভিউ", "Template Preview")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t("টেমপ্লেট", "Template")}</p>
            <p className="font-semibold">{language === "bn" && template.name_bn ? template.name_bn : template.name}</p>
          </div>

          <div className="flex gap-2">
            {(template.channels || []).map((ch: string) => {
              const Icon = CHANNEL_ICONS[ch];
              return (
                <Badge key={ch} variant="outline" className="gap-1">
                  {Icon && <Icon className="h-3 w-3" />}
                  {CHANNEL_LABELS[ch]?.[language === "bn" ? "bn" : "en"]}
                </Badge>
              );
            })}
          </div>

          {subject && (
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">{t("সাবজেক্ট", "Subject")}</p>
              <p className="font-medium">{replaceVars(subject)}</p>
            </div>
          )}

          <div className="bg-muted rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-2">{t("মেসেজ প্রিভিউ", "Message Preview")}</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{replaceVars(message)}</p>
          </div>

          {template.dynamic_variables?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t("ব্যবহৃত ভেরিয়েবল", "Variables Used")}</p>
              <div className="flex flex-wrap gap-1">
                {template.dynamic_variables.map((v: string) => (
                  <Badge key={v} variant="secondary" className="font-mono text-xs">{v}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
