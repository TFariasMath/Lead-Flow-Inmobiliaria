/**
 * Lead Flow - Sidebar Component
 * =============================
 * Barra lateral de navegación con diseño glassmorphism oscuro.
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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const BASE_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/leads", label: "Leads", icon: Users },
  { href: "/dashboard/leads/new", label: "Nuevo Lead", icon: UserPlus },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const navItems = [...BASE_NAV_ITEMS];
  
  if (user) {
    if (user.permissions.includes("leads.view_landingpage") || user.isStaff) {
      navItems.push({ href: "/dashboard/landings", label: "Landing Pages", icon: Globe });
    }
    
    if (user.isStaff || user.groups.includes("Administrador")) {
      navItems.push({ href: "/dashboard/analytics", label: "Rendimiento", icon: BarChart });
    }
    
    if (user.permissions.includes("leads.view_sentemail") || user.isStaff) {
      navItems.push({ href: "/dashboard/emails", label: "Email Sandbox", icon: Mail });
    }
    
    if (user.permissions.includes("leads.view_webhooklog") || user.isStaff) {
      navItems.push({ href: "/dashboard/webhooks", label: "Webhook Logs", icon: Webhook });
    }
    
    if (user.groups.includes("Administrador")) {
      navItems.push({ href: "/dashboard/settings/roles", label: "Roles", icon: Shield });
    }
  }

  return (
    <aside className="w-20 flex flex-col items-center py-8 gap-10 bg-[#0f172a]/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] z-50 animate-slideInLeft relative group/sidebar shadow-2xl">
      {/* Decorative Glow */}
      <div className="absolute inset-x-0 top-0 h-32 bg-blue-600/5 blur-[60px] rounded-full pointer-events-none" />

      {/* Logo Section */}
      <Link href="/dashboard" className="relative group">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-500 group-hover:-rotate-12">
          <Zap className="w-6 h-6 text-white fill-white/10" />
        </div>
        <div className="absolute -inset-2 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </Link>

      {/* Navigation Groups */}
      <nav className="flex-1 flex flex-col gap-6 w-full px-4">
        <div className="flex flex-col gap-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 relative group/nav",
                  isActive
                    ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                    : "text-slate-500 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-5 h-5 transition-transform duration-300", isActive ? "scale-110" : "group-hover/nav:scale-110")} />
                
                {isActive && (
                  <div className="absolute -left-1 w-1 h-6 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                )}

                {/* Modern Tooltip */}
                <div className="absolute left-16 px-3 py-1.5 bg-[#1e293b] text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover/nav:opacity-100 translate-x-[-10px] group-hover/nav:translate-x-0 pointer-events-none transition-all duration-300 whitespace-nowrap z-[100] border border-white/10 shadow-2xl">
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="flex flex-col items-center gap-4 pb-4 w-full px-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 p-1 relative group/user cursor-pointer">
          <div className="w-full h-full rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-xs font-black text-blue-500 shadow-inner group-hover/user:from-blue-600/10 group-hover/user:to-blue-600/20 transition-all duration-300">
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </div>
          {/* User Status Dot */}
          <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0f172a] rounded-full shadow-lg" />
        </div>

        <button
          onClick={logout}
          className="w-12 h-12 flex items-center justify-center rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all duration-300 group/logout"
          title="Cerrar sesión"
        >
          <LogOut className="w-5 h-5 group-hover/logout:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </aside>
  );
}
