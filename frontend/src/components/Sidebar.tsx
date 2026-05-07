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
  if (user?.isStaff) {
    navItems.push({ href: "/dashboard/analytics", label: "Rendimiento", icon: BarChart });
    navItems.push({ href: "/dashboard/webhooks", label: "Webhook Logs", icon: Webhook });
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-xl z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--color-border)]">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">
            Lead Flow
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            CRM Inmobiliario
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[var(--color-primary)]/15 text-[var(--color-primary-hover)] shadow-sm"
                  : "text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface-hover)]"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5",
                  isActive ? "text-[var(--color-primary)]" : ""
                )}
              />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse-glow" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="px-3 py-4 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-purple-600 flex items-center justify-center text-xs font-bold text-white">
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.username || "Usuario"}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {user?.isStaff ? "Admin" : "Vendedor"}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-md hover:bg-[var(--color-danger)]/15 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
