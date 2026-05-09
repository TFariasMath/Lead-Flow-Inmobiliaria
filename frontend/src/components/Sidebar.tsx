/**
 * Lead Flow - Sidebar Component (Premium v3)
 * ============================================
 * Barra lateral con diseño de cristal oscuro, tooltips modernos
 * y separadores de sección visual.
 */

"use client";

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
} from "lucide-react";
import { useAuth, useAuth as useAuthHook } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { prefetchData } from "@/hooks/useData";

interface NavItem {
  href: string;
  label: string;
  icon: any;
  section?: string;
  swrKey?: string; // Llave de SWR para pre-carga
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, token } = useAuth();

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "principal", swrKey: "/dashboard/stats" },
    { href: "/dashboard/leads", label: "Leads", icon: Users, section: "principal", swrKey: "/leads" },
    { href: "/dashboard/leads/new", label: "Nuevo Lead", icon: UserPlus, section: "principal" },
  ];

  if (user && (user.isStaff || user.groups.includes("Administrador"))) {
    navItems.push(
      { href: "/dashboard/landings", label: "Landing Pages", icon: Globe, section: "marketing" },
      { href: "/dashboard/campaigns", label: "Campañas", icon: Target, section: "marketing", swrKey: "/campaigns" },
      { href: "/dashboard/properties", label: "Propiedades", icon: Building2, section: "marketing", swrKey: "/properties" },
      { href: "/dashboard/analytics", label: "Rendimiento", icon: BarChart, section: "analytics", swrKey: "/analytics/performance" },
      { href: "/dashboard/emails", label: "Email Sandbox", icon: Mail, section: "analytics" },
      { href: "/dashboard/webhooks", label: "Webhook Logs", icon: Webhook, section: "analytics" },
      { href: "/dashboard/settings/users", label: "Usuarios", icon: Users, section: "config" },
      { href: "/dashboard/settings/roles", label: "Roles", icon: Shield, section: "config" },
    );
  }

  const handlePrefetch = (key?: string) => {
    if (key && token) {
        prefetchData(key, token);
    }
  };

  // Group items by section
  const sections = navItems.reduce((acc, item) => {
    const sec = item.section || "principal";
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  return (
    <aside className="w-[72px] flex flex-col items-center py-6 gap-6 bg-[rgba(8,14,30,0.7)] backdrop-blur-2xl border border-white/[0.04] rounded-[2rem] z-50 animate-slideInLeft relative shadow-[0_0_60px_rgba(0,0,0,0.4)]">
      {/* Decorative top glow */}
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      {/* Logo */}
      <Link href="/dashboard" className="relative group mb-2">
        <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-500 group-hover:scale-105">
          <Zap className="w-5 h-5 text-white" />
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 w-full px-3 overflow-y-auto custom-scrollbar">
        {Object.entries(sections).map(([sectionKey, items], sIdx) => (
          <div key={sectionKey}>
            {sIdx > 0 && (
              <div className="mx-2 my-3 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            )}
            <div className="flex flex-col gap-1">
              {items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onMouseEnter={() => handlePrefetch(item.swrKey)}
                    className={cn(
                      "w-full h-11 flex items-center justify-center rounded-xl transition-all duration-300 relative group/nav",
                      isActive
                        ? "bg-blue-600/15 text-blue-400"
                        : "text-slate-600 hover:text-slate-300 hover:bg-white/[0.03]"
                    )}
                  >
                    <item.icon className={cn("w-[18px] h-[18px] transition-transform duration-200", isActive && "scale-110")} />

                    {isActive && (
                      <div className="absolute left-0 w-[3px] h-5 bg-blue-500 rounded-r-full shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
                    )}

                    {/* Tooltip */}
                    <div className="absolute left-[68px] px-3 py-1.5 bg-[#111827] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover/nav:opacity-100 translate-x-[-8px] group-hover/nav:translate-x-0 pointer-events-none transition-all duration-200 whitespace-nowrap z-[100] border border-white/[0.08] shadow-xl">
                      {item.label}
                      <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 rotate-45 bg-[#111827] border-l border-b border-white/[0.08]" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="flex flex-col items-center gap-2 w-full px-3">
        <div className="mx-2 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent w-full mb-1" />

        <div className="w-11 h-11 rounded-xl bg-slate-900/80 border border-white/[0.05] flex items-center justify-center relative cursor-pointer group/user">
          <span className="text-xs font-black text-blue-400 group-hover/user:text-blue-300 transition-colors">
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </span>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#080e1e] rounded-full" />
        </div>

        <button
          onClick={logout}
          className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-700 hover:text-red-400 hover:bg-red-500/8 transition-all duration-300 group/logout"
          title="Cerrar sesión"
        >
          <LogOut className="w-[18px] h-[18px] group-hover/logout:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </aside>
  );
}
