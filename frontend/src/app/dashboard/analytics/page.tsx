/**
 * Lead Flow - Commercial Performance (Premium v3)
 * =============================================
 * Panel de control de rendimiento de vendedores. Analíticas de conversión,
 * métricas de cierre y estado del algoritmo de distribución.
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPerformanceAnalytics, type VendorPerformance } from "@/lib/api";
import { 
  Users, 
  Target, 
  Trophy, 
  XCircle, 
  TrendingUp, 
  BarChart3, 
  ShieldCheck, 
  Zap,
  Activity,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const { token, user } = useAuth();
  const [data, setData] = useState<VendorPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getPerformanceAnalytics(token)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Calculando Rendimiento...</p>
      </div>
    );
  }

  if (!user?.isStaff) {
    return (
      <div className="p-12 glass-container rounded-[2.5rem] text-center border-red-500/20 bg-red-500/5">
        <ShieldCheck className="w-12 h-12 text-red-500/40 mx-auto mb-4" />
        <h2 className="text-xl font-black text-white tracking-tight">Acceso Restringido</h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          Solo los administradores de nivel Staff pueden auditar el rendimiento del equipo.
        </p>
      </div>
    );
  }

  // Find top performer
  const topPerformer = [...data].sort((a, b) => b.conversion_rate - a.conversion_rate)[0];

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      
      {/* ── Metric Strip ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger-children">
        <MiniCard icon={Users} label="Vendedores Activos" value={data.length} color="#3b82f6" />
        <MiniCard icon={Target} label="Conversión Promedio" value={`${(data.reduce((acc, v) => acc + v.conversion_rate, 0) / (data.length || 1)).toFixed(1)}%`} color="#10b981" />
        <MiniCard icon={TrendingUp} label="Mejor Rendimiento" value={topPerformer ? `${topPerformer.conversion_rate}%` : '0%'} color="#f59e0b" />
        <MiniCard icon={Activity} label="Status Round Robin" value="Optimizado" color="#06b6d4" />
      </div>

      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="section-title">Auditoría Comercial</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
            <BarChart3 className="w-3 h-3 text-blue-500" />
            Análisis de conversión y eficiencia de cierre por vendedor
          </p>
        </div>
        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/5">
          Actualizado hace: <span className="text-blue-400">En tiempo real</span>
        </div>
      </div>

      {/* ── Vendors Performance Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger-children">
        {data.map((vendor, i) => (
          <div
            key={i}
            className="glass-card rounded-[2rem] p-8 group relative overflow-hidden flex flex-col"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Top Right Availability Badge */}
            <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                vendor.is_available ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-red-500"
              )} />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                {vendor.is_available ? "Live" : "Offline"}
              </span>
            </div>

            {/* Vendor Profile */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-xl font-black text-blue-400 shadow-inner group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white transition-all duration-500">
                {vendor.vendor_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors">
                  {vendor.vendor_name}
                </h3>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-0.5">
                  ID: {vendor.vendor_name.split(' ')[0].toLowerCase()}
                </p>
              </div>
            </div>

            {/* Performance Bar */}
            <div className="space-y-3 mb-8">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tasa de Conversión</span>
                <span className="text-base font-black text-emerald-400">{vendor.conversion_rate}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-[1.5s] ease-out shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  style={{ width: `${vendor.conversion_rate}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 pt-6 border-t border-white/[0.04] mt-auto">
              <StatItem label="Asignados" value={vendor.total_assigned} icon={Users} color="text-slate-400" />
              <StatItem label="Ganados" value={vendor.won} icon={Trophy} color="text-emerald-400" />
              <StatItem label="Perdidos" value={vendor.lost} icon={XCircle} color="text-red-400" />
            </div>

            {/* Hover Decorator */}
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-blue-600/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        ))}
      </div>

      {/* ── Footer Insight ── */}
      <div className="glass-container rounded-[2rem] p-8 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
           <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500">
              <Zap className="w-6 h-6" />
           </div>
           <div>
              <p className="text-sm font-black text-white">Algoritmo de Distribución Inteligente</p>
              <p className="text-xs text-slate-500 font-medium">Balanceo de carga optimizado basado en el rendimiento actual del equipo.</p>
           </div>
        </div>
        <button className="btn-ghost flex items-center gap-2 group">
           Configurar Reglas
           <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}

function StatItem({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="text-center group/stat">
      <div className={cn("flex justify-center mb-1.5 opacity-40 group-hover/stat:opacity-100 transition-opacity", color)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <p className="text-base font-black text-white">{value}</p>
      <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.15em]">{label}</p>
    </div>
  );
}

function MiniCard({ icon: Icon, label, value, color, trend }: { icon: any; label: string; value: string | number; color: string; trend?: string }) {
  return (
    <div className="glass-card rounded-2xl p-4 flex items-center justify-between group relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full opacity-40 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: color }} />
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform duration-500" style={{ color }}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-0.5">{label}</p>
          <p className="text-xl font-black text-white">{value}</p>
        </div>
      </div>
      {trend && (
        <div className="text-[9px] font-black px-1.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          {trend}
        </div>
      )}
    </div>
  );
}
