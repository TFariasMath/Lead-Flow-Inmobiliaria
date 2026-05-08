/**
 * Lead Flow - Notification Toast
 * =============================
 * Componente ligero para mostrar alertas en tiempo real.
 */

"use client";

import { useEffect, useState } from "react";
import { Bell, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  onClick?: () => void;
}

export default function NotificationPortal() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Función global para disparar notificaciones
  useEffect(() => {
    (window as any).notify = (n: Omit<Notification, "id">) => {
      const id = Math.random().toString(36).substring(7);
      setNotifications((prev) => [...prev, { ...n, id }]);
      
      // Auto-remover después de 5 segundos
      setTimeout(() => {
        setNotifications((prev) => prev.filter((item) => item.id !== id));
      }, 5000);
    };
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={cn(
            "pointer-events-auto flex gap-4 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-slideInRight",
            "bg-[#1e293b]/90 border-white/10"
          )}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-blue-500" />
          </div>
          
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-black text-white uppercase tracking-tight">{n.title}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5 line-clamp-2">
              {n.message}
            </p>
            {n.onClick && (
              <button 
                onClick={() => {
                  n.onClick?.();
                  setNotifications((prev) => prev.filter((item) => item.id !== n.id));
                }}
                className="mt-2 flex items-center gap-1 text-[9px] font-black text-blue-500 uppercase hover:text-blue-400"
              >
                Ver detalle <ArrowRight className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          <button 
            onClick={() => setNotifications((prev) => prev.filter((item) => item.id !== n.id))}
            className="text-slate-500 hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
