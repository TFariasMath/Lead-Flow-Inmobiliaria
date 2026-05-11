/**
 * Lead Flow - Dashboard Layout (Premium v3)
 * ==========================================
 * Layout protegido con sidebar, noise overlay y main content area.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import NotificationPortal from "@/components/NotificationPortal";
import HistoryDock from "@/components/HistoryDock";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !token) {
      router.push("/");
    }
  }, [token, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-600 font-bold uppercase tracking-[0.2em]">
            Cargando sistema...
          </p>
        </div>
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="min-h-screen relative flex p-3 gap-3 overflow-hidden noise-overlay">
      {/* Spacer to preserve space for the fixed Sidebar */}
      <div className="w-[68px] shrink-0" />
      
      <Sidebar />
      <NotificationPortal />
      <main className="flex-1 glass-container rounded-[1.75rem] overflow-hidden relative">
        {/* Top gradient accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent z-10" />
        <div className="h-full overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </main>
      <HistoryDock />
    </div>
  );
}
