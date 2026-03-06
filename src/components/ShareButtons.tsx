import { useState } from 'react';
import { Share2, Facebook, MessageCircle, Send, Copy, Check, Link2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ShareButtonsProps {
  title: string;
  description?: string;
  url?: string;
  image?: string;
  className?: string;
  variant?: 'floating' | 'inline';
}

const shareChannels = [
  {
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-[#1877F2] hover:bg-[#166FE5]',
    getUrl: (url: string, title: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`,
  },
  {
    name: 'WhatsApp',
    icon: MessageCircle,
    color: 'bg-[#25D366] hover:bg-[#20BD5A]',
    getUrl: (url: string, title: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`,
  },
  {
    name: 'Messenger',
    icon: MessageCircle,
    color: 'bg-[#0084FF] hover:bg-[#0077E6]',
    getUrl: (url: string) =>
      `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=966242223397117&redirect_uri=${encodeURIComponent(url)}`,
  },
  {
    name: 'Telegram',
    icon: Send,
    color: 'bg-[#0088CC] hover:bg-[#007AB8]',
    getUrl: (url: string, title: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
];

const ShareButtons = ({ title, description, url, image, className, variant = 'floating' }: ShareButtonsProps) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const handleShare = (getUrl: (url: string, title: string) => string) => {
    const popup = window.open(getUrl(shareUrl, title), '_blank', 'width=600,height=400,scrollbars=yes');
    if (!popup) window.open(getUrl(shareUrl, title), '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(language === 'bn' ? 'লিংক কপি হয়েছে!' : 'Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(language === 'bn' ? 'কপি করা যায়নি' : 'Failed to copy');
    }
  };

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2 flex-wrap', className)}>
        <span className="text-sm font-medium text-muted-foreground">
          {language === 'bn' ? 'শেয়ার করুন:' : 'Share:'}
        </span>
        {shareChannels.map(ch => (
          <button
            key={ch.name}
            onClick={() => handleShare(ch.getUrl)}
            className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110', ch.color)}
            title={ch.name}
          >
            <ch.icon className="h-4 w-4" />
          </button>
        ))}
        <button
          onClick={handleCopyLink}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground transition-transform hover:scale-110"
          title={language === 'bn' ? 'লিংক কপি' : 'Copy Link'}
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4" />}
        </button>
      </div>
    );
  }

  // Floating variant
  return (
    <div className={cn('fixed right-4 bottom-20 z-50 flex flex-col items-end gap-2', className)}>
      {isOpen && (
        <div className="flex flex-col gap-2 animate-fade-in">
          {shareChannels.map(ch => (
            <button
              key={ch.name}
              onClick={() => handleShare(ch.getUrl)}
              className={cn(
                'w-11 h-11 rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-110',
                ch.color
              )}
              title={ch.name}
            >
              <ch.icon className="h-5 w-5" />
            </button>
          ))}
          <button
            onClick={handleCopyLink}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-card border border-border shadow-lg text-foreground hover:scale-110 transition-all"
            title={language === 'bn' ? 'লিংক কপি' : 'Copy Link'}
          >
            {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
          </button>
        </div>
      )}
      <Button
        size="icon"
        className="w-12 h-12 rounded-full shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
      </Button>
    </div>
  );
};

export default ShareButtons;
