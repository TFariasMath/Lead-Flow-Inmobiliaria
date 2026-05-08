/**
 * Lead Flow - Notification Toast (Premium v3)
 * ============================================
 * Toast notifications with premium glass effect and smooth animations.
 */

"use client";

import { useEffect, useState } from "react";
import { Bell, X, ArrowRight, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  onClick?: () => void;
}

const TYPE_CONFIG = {
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/15" },
  success: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/15" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/15" },
};

export default function NotificationPortal() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    (window as any).notify = (n: Omit<Notification, "id">) => {
      const id = Math.random().toString(36).substring(7);
      setNotifications((prev) => [...prev, { ...n, id }]);

      setTimeout(() => {
        setNotifications((prev) => prev.filter((item) => item.id !== id));
      }, 5000);
    };
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {notifications.map((n) => {
        const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
        const Icon = config.icon;

        return (
          <div
            key={n.id}
            className={cn(
              "pointer-events-auto flex gap-3 p-4 rounded-2xl border backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-slideInRight",
              "bg-[#0a1428]/90 border-white/[0.06]"
            )}
          >
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border", config.bg, config.border)}>
              <Icon className={cn("w-4 h-4", config.color)} />
            </div>

            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-black text-white uppercase tracking-tight">{n.title}</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5 line-clamp-2">
                {n.message}
              </p>
              {n.onClick && (
                <button
                  onClick={() => {
                    n.onClick?.();
                    setNotifications((prev) => prev.filter((item) => item.id !== n.id));
                  }}
                  className="mt-2 flex items-center gap-1 text-[9px] font-black text-blue-400 uppercase hover:text-blue-300 transition-colors"
                >
                  Ver detalle <ArrowRight className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setNotifications((prev) => prev.filter((item) => item.id !== n.id))}
              className="text-slate-700 hover:text-white shrink-0 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
