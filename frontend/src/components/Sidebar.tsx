/**
 * Lead Flow - Sidebar Component (Macro-Modules v4)
 * ================================================
 * Barra lateral ultra-compacta que utiliza macro-módulos para agrupar
 * la funcionalidad y optimizar el espacio visual.
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Webhook,
  UserPlus,
  LogOut,
  Zap,
  BarChart,
  Mail,
  Globe,
  Shield,
  Building2,
  Target,
  ChevronRight,
  FlaskConical,
  Settings,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { prefetchData } from "@/hooks/useData";

interface NavItem {
  href: string;
  label: string;
  icon: any;
  swrKey?: string;
}

interface MacroGroup {
  id: string;
  label: string;
  icon: any;
  items: NavItem[];
  isAdminOnly?: boolean;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const isAdmin = user && (user.isStaff || user.groups.includes("Administrador"));

  const macroGroups: MacroGroup[] = [
    {
      id: "leads",
      label: "Gestión",
      icon: Zap,
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, swrKey: "/dashboard/stats" },
        { href: "/dashboard/leads", label: "Listado de Leads", icon: Users, swrKey: "/leads" },
        { href: "/dashboard/leads/new", label: "Nuevo Lead", icon: UserPlus },
      ],
    },
    {
      id: "marketing",
      label: "Marketing",
      icon: Target,
      isAdminOnly: true,
      items: [
        { href: "/dashboard/landings", label: "Landing Pages", icon: Globe },
        { href: "/dashboard/campaigns", label: "Campañas PDF", icon: Target, swrKey: "/campaigns" },
        { href: "/dashboard/properties", label: "Catálogo", icon: Building2, swrKey: "/properties" },
      ],
    },
    {
      id: "lab",
      label: "Laboratorio",
      icon: FlaskConical,
      isAdminOnly: true,
      items: [
        { href: "/dashboard/analytics", label: "Rendimiento", icon: BarChart, swrKey: "/analytics/performance" },
        { href: "/dashboard/emails", label: "Email Sandbox", icon: Mail },
        { href: "/dashboard/webhooks", label: "Webhook Logs", icon: Webhook },
      ],
    },
    {
      id: "config",
      label: "Ajustes",
      icon: Settings,
      isAdminOnly: true,
      items: [
        { href: "/dashboard/settings/users", label: "Usuarios", icon: Users },
        { href: "/dashboard/settings/roles", label: "Roles", icon: Shield },
      ],
    },
  ];

  const handlePrefetch = (key?: string) => {
    if (key && token) {
      prefetchData(key, token);
    }
  };

  const filteredGroups = macroGroups.filter(g => !g.isAdminOnly || isAdmin);

  return (
    <>
      {/* ── TRIGGER AREA (The "Handle") ── */}
      <div 
        className="fixed left-0 top-0 bottom-0 w-4 z-[60] cursor-pointer group/trigger"
        onMouseEnter={() => setIsOpen(true)}
      >
        <div className="absolute top-1/2 -translate-y-1/2 left-2 w-2.5 h-20 bg-orange-500/30 rounded-full border border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.4)] group-hover/trigger:h-32 group-hover/trigger:bg-orange-500/50 group-hover/trigger:shadow-[0_0_30px_rgba(249,115,22,0.6)] transition-all duration-500 animate-pulse" />
      </div>

      {/* ── THE SIDEBAR DOCK ── */}
      <aside 
        className={cn(
          "fixed top-3 bottom-3 w-[72px] flex flex-col items-center py-7 bg-[rgba(2,6,23,0.98)] backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] z-[70] shadow-[20px_0_50px_rgba(0,0,0,0.5)] transition-all duration-700 ease-out",
          isOpen ? "left-3 opacity-100 translate-x-0" : "-left-20 opacity-0 -translate-x-full pointer-events-none"
        )}
        onMouseLeave={() => setIsOpen(false)}
      >
        {/* Decorative top glow */}
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        {/* Close hint icon for better UX */}
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-[#0f172a] border border-white/10 rounded-r-xl flex items-center justify-center cursor-pointer hover:bg-slate-900 transition-colors" onClick={() => setIsOpen(false)}>
           <ChevronRight className={cn("w-3 h-3 text-slate-500 transition-transform", isOpen && "rotate-180")} />
        </div>

        {/* User Profile - Now at the Top */}
        <div className="relative group/profile mb-10 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center cursor-pointer group-hover/profile:border-orange-500/40 transition-all">
             <span className="text-sm font-black text-orange-500 group-hover/profile:scale-110 transition-transform">
               {user?.username?.charAt(0).toUpperCase() || "U"}
             </span>
             <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-orange-500 border-2 border-[#020617] rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)] animate-pulse" />
          </div>
          
          {/* Profile Flyout (Top Aligned) */}
          <div className="absolute left-[64px] top-0 opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible group-hover/profile:translate-x-0 translate-x-[-10px] transition-all duration-500 z-[80]">
            <div className="bg-[#0f172a]/98 backdrop-blur-3xl border border-white/[0.1] rounded-2xl p-4 min-w-[200px] shadow-2xl ml-4 ring-1 ring-white/10">
               <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-xs font-black text-orange-500">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-tight">{user?.username}</p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{isAdmin ? "Administrador" : "Usuario"}</p>
                  </div>
               </div>
               <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">
                 <LogOut className="w-3 h-3" /> Cerrar Sesión
               </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-6 w-full items-center shrink-0">
          {/* Dashboard */}
          <div className="relative flex flex-col items-center group/macro">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-500 relative",
                pathname === "/dashboard"
                  ? "bg-orange-500/10 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                  : "text-slate-600 hover:text-slate-300 hover:bg-white/[0.05]"
              )}
            >
              <LayoutDashboard className={cn("w-5 h-5 transition-all", pathname === "/dashboard" && "scale-110")} />
              {pathname === "/dashboard" && (
                <div className="absolute -left-3 w-1.5 h-6 bg-orange-500 rounded-r-full shadow-[0_0_15px_rgba(249,115,22,0.6)]" />
              )}
            </Link>
            <span className={cn("mt-1.5 text-[7px] font-black uppercase tracking-widest", pathname === "/dashboard" ? "text-orange-500" : "text-slate-700")}>Home</span>
          </div>

          {/* Dynamic Groups */}
          {filteredGroups.map((group) => {
            const isGroupActive = group.items.some(item => 
              item.href !== "/dashboard" && pathname.startsWith(item.href)
            );

            return (
              <div key={group.id} className="relative flex flex-col items-center group/macro">
                <button
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-500 relative",
                    isGroupActive
                      ? "bg-orange-500/10 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                      : "text-slate-600 hover:text-slate-300 hover:bg-white/[0.05]"
                  )}
                >
                  <group.icon className={cn("w-5 h-5 transition-all duration-500", isGroupActive && "scale-110")} />
                  {isGroupActive && (
                    <div className="absolute -left-3 w-1.5 h-6 bg-orange-500 rounded-r-full shadow-[0_0_15px_rgba(249,115,22,0.6)]" />
                  )}
                </button>
                <span className={cn("mt-1.5 text-[7px] font-black uppercase tracking-widest", isGroupActive ? "text-orange-500" : "text-slate-700")}>
                  {group.id}
                </span>

                {/* Submenu - Dynamic positioning (Top for upper items, Bottom for lower items) */}
                <div className={cn(
                  "absolute left-[64px] opacity-0 invisible group-hover/macro:opacity-100 group-hover/macro:visible group-hover/macro:translate-x-0 translate-x-[-10px] transition-all duration-500 z-[80]",
                  group.id === "config" || group.id === "lab" ? "bottom-0" : "top-0"
                )}>
                  <div className="bg-[#0f172a]/98 backdrop-blur-3xl border border-white/[0.1] rounded-2xl p-2 min-w-[200px] shadow-2xl ml-4 ring-1 ring-white/5">
                    <div className="px-4 py-2 border-b border-white/5 mb-1">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500">{group.label}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {group.items.filter(i => i.href !== "/dashboard").map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            onMouseEnter={() => handlePrefetch(item.swrKey)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                              isActive ? "bg-amber-500/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                          >
                            <item.icon className="w-4 h-4" />
                            <span className="text-xs font-bold">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Logo - Now at the Bottom */}
        <div className="mt-auto flex flex-col items-center gap-6 w-full px-2 pb-2 shrink-0">
          <div className="w-6 h-px bg-white/10" />
          <div className="relative group mb-2">
            <div className="w-10 h-10 rounded-[14px] bg-orange-500/5 border border-orange-500/10 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
              <Zap className="w-5 h-5 text-orange-500" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
