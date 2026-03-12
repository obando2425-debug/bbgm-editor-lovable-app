import React, { useState, useEffect, useCallback } from "react";
import { Bell, X, Trash2, CheckCheck, AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, clearNotifications, subscribeNotifications, type BBGMNotification } from "@/lib/bbgm-notifications";

const typeIcon: Record<string, React.ReactNode> = {
  info: <Info className="w-3.5 h-3.5 text-blue-400" />,
  warning: <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />,
  error: <AlertCircle className="w-3.5 h-3.5 text-destructive" />,
  success: <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
};

const typeBg: Record<string, string> = {
  info: "bg-blue-500/5 border-blue-500/20",
  warning: "bg-yellow-500/5 border-yellow-500/20",
  error: "bg-destructive/5 border-destructive/20",
  success: "bg-green-500/5 border-green-500/20",
};

const NotificationCenter = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<BBGMNotification[]>(getNotifications());
  const [unread, setUnread] = useState(getUnreadCount());

  useEffect(() => {
    return subscribeNotifications(() => {
      setNotifications(getNotifications());
      setUnread(getUnreadCount());
    });
  }, []);

  const handleOpen = () => {
    setOpen(!open);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleClear = () => {
    clearNotifications();
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" onClick={handleOpen} className="relative gap-1 text-xs">
        <Bell className="w-3.5 h-3.5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 max-h-[400px] bg-card border border-border rounded-lg shadow-xl z-50 flex flex-col animate-fade-in">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <span className="text-sm font-medium text-foreground">Notificaciones</span>
            <div className="flex gap-1">
              {unread > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" /> Leer todo
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={handleClear} className="text-xs text-muted-foreground hover:text-destructive ml-2">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="ml-2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-xs">Sin notificaciones</div>
            ) : (
              notifications.slice(0, 50).map(n => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`p-2.5 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {typeIcon[n.type]}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{n.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <span className="text-[9px] text-muted-foreground/60">{new Date(n.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
