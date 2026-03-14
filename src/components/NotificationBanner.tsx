import React, { useState, useEffect, useCallback } from "react";
import { subscribeNotifications, getNotifications, markAsRead, type BBGMNotification } from "@/lib/bbgm-notifications";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

const typeIcon: Record<string, React.ReactNode> = {
  info: <Info className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
  error: <AlertCircle className="w-4 h-4" />,
  success: <CheckCircle2 className="w-4 h-4" />,
};

const typeStyles: Record<string, string> = {
  info: "bg-blue-500/90 text-white",
  warning: "bg-yellow-500/90 text-black",
  error: "bg-destructive/90 text-white",
  success: "bg-green-600/90 text-white",
};

const NotificationBanner = () => {
  const [banners, setBanners] = useState<BBGMNotification[]>([]);
  const shownRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    const check = () => {
      const all = getNotifications();
      const critical = all.filter(n =>
        !n.read && (n.type === "error" || n.type === "warning" || n.persistent) && !shownRef.current.has(n.id)
      );
      if (critical.length > 0) {
        critical.forEach(n => shownRef.current.add(n.id));
        setBanners(prev => [...critical.slice(0, 3), ...prev].slice(0, 5));
      }
    };
    check();
    return subscribeNotifications(check);
  }, []);

  // Auto-dismiss after 15 seconds
  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setTimeout(() => {
      setBanners(prev => prev.slice(0, -1));
    }, 15000);
    return () => clearTimeout(timer);
  }, [banners]);

  const dismiss = useCallback((id: string) => {
    markAsRead(id);
    setBanners(prev => prev.filter(b => b.id !== id));
  }, []);

  if (banners.length === 0) return null;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-full max-w-lg px-4">
      {banners.map(b => (
        <div
          key={b.id}
          className={`rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 animate-fade-in ${typeStyles[b.type] || typeStyles.info}`}
          onPointerDown={(e) => {
            const startX = e.clientX;
            const el = e.currentTarget;
            const onMove = (ev: PointerEvent) => {
              const dx = ev.clientX - startX;
              el.style.transform = `translateX(${dx}px)`;
              el.style.opacity = String(1 - Math.abs(dx) / 200);
            };
            const onUp = (ev: PointerEvent) => {
              const dx = ev.clientX - startX;
              if (Math.abs(dx) > 80) dismiss(b.id);
              else { el.style.transform = ""; el.style.opacity = ""; }
              window.removeEventListener("pointermove", onMove);
              window.removeEventListener("pointerup", onUp);
            };
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
          }}
        >
          <div className="shrink-0 mt-0.5">{typeIcon[b.type]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{b.title}</p>
            <p className="text-xs opacity-90 mt-0.5 line-clamp-2">{b.message}</p>
          </div>
          <button onClick={() => dismiss(b.id)} className="shrink-0 opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationBanner;
