"use client";

import React from "react";
import { Users, Globe, Target, AlertTriangle, Zap, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface KPIGridProps {
  stats: any;
}

export function KPIGrid({ stats }: KPIGridProps) {
  const router = useRouter();

  const totalLeads = stats?.total_leads || 0;
  const wonLeads = stats?.leads_by_status?.["Cierre Ganado"] || 0;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0";
  const staleLeads = stats?.stale_leads_count || 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <KPICard
        icon={Users}
        label="Total Leads"
        value={totalLeads}
        color="#3b82f6"
        onClick={() => router.push("/dashboard/leads")}
        description={`${stats?.leads_via_api || 0} API • ${stats?.leads_manual || 0} Man.`}
      />
      <KPICard
        icon={Globe}
        label="Tráfico Web"
        value={stats?.total_landing_visits || 0}
        color="#8b5cf6"
        onClick={() => router.push("/dashboard/landings")}
        description="Vistas Landings"
      />
      <KPICard
        icon={Target}
        label="Conversión"
        value={`${conversionRate}%`}
        color="#10b981"
        accent
        onClick={() => router.push("/dashboard/leads?status=cierre_ganado")}
      />
      <KPICard
        icon={AlertTriangle}
        label="Estancados"
        value={staleLeads}
        color="#ef4444"
        onClick={() => router.push("/dashboard/leads?filter=stale")}
        alert={staleLeads > 5}
      />
      <KPICard
        icon={Zap}
        label="Salud API"
        value={`${stats?.webhook_success_rate || 0}%`}
        color="#f59e0b"
        onClick={() => router.push("/dashboard/webhooks")}
        description={stats?.failed_webhooks > 0 ? `${stats.failed_webhooks} fallos` : "Sistema Ok"}
        alert={stats?.failed_webhooks > 0}
      />
    </div>
  );
}

function KPICard({
  icon: Icon,
  label,
  value,
  color,
  onClick,
  accent,
  alert,
  description,
}: {
  icon: any;
  label: string;
  value: number | string;
  color: string;
  onClick?: () => void;
  accent?: boolean;
  alert?: boolean;
  description?: string;
}) {
  return (
    <div
      className={cn(
        "relative group overflow-hidden rounded-xl p-3.5 border transition-all",
        onClick
          ? "cursor-pointer hover:border-white/10 hover:-translate-y-0.5"
          : "cursor-default",
        accent
          ? "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 shadow-[0_0_15px_-5px_rgba(16,185,129,0.1)]"
          : alert
          ? "bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20 shadow-[0_0_15px_-5px_rgba(239,68,68,0.1)]"
          : "glass-card border-white/5"
      )}
      onClick={onClick}
    >
      <div
        className="absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-5 blur-2xl pointer-events-none transition-opacity group-hover:opacity-10"
        style={{ backgroundColor: color }}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
            {label}
          </p>
          <p className="text-xl font-black text-white">{value}</p>
          {description && (
            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{description}</p>
          )}
        </div>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundColor: `${color}15`,
            border: `1px solid ${color}30`,
          }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
    </div>
  );
}
