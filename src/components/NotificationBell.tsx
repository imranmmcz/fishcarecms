import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, Trash2, Package, ShoppingCart, Sprout, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { bn, enUS } from "date-fns/locale";

const typeIcons: Record<string, React.ReactNode> = {
  order_update: <Package className="h-4 w-4 text-blue-500" />,
  new_product: <ShoppingCart className="h-4 w-4 text-green-500" />,
  farming_reminder: <Sprout className="h-4 w-4 text-emerald-500" />,
  promotion: <Megaphone className="h-4 w-4 text-orange-500" />,
  general: <Bell className="h-4 w-4 text-muted-foreground" />,
};

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, requestPushPermission } = useNotifications();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    requestPushPermission();
  }, [requestPushPermission]);

  const handleClick = (notif: Notification) => {
    if (!notif.is_read) markAsRead(notif.id);
    if (notif.reference_type === "order" && notif.reference_id) {
      navigate("/dashboard/orders");
      setOpen(false);
    }
  };

  const timeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: language === "bn" ? bn : enUS,
      });
    } catch {
      return "";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h4 className="font-semibold text-sm">
            {language === "bn" ? "নোটিফিকেশন" : "Notifications"}
          </h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={markAllAsRead}>
              <CheckCheck className="h-3 w-3" />
              {language === "bn" ? "সব পড়া হয়েছে" : "Mark all read"}
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">{language === "bn" ? "কোনো নোটিফিকেশন নেই" : "No notifications"}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                    !notif.is_read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => handleClick(notif)}
                >
                  <div className="mt-0.5 shrink-0">
                    {typeIcons[notif.type] || typeIcons.general}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight ${!notif.is_read ? "font-semibold" : "font-medium"}`}>
                      {language === "bn" ? (notif.title_bn || notif.title) : notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {language === "bn" ? (notif.message_bn || notif.message) : notif.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(notif.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!notif.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
