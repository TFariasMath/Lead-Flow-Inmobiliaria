/**
 * Lead Flow - Dashboard Page
 * ==========================
 * Panel operacional con gráficos y métricas clave.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getLeads, getDashboardStats, getPerformanceAnalytics, type DashboardStats, type VendorPerformance, type Lead } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Webhook,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  Nuevo: "#3b82f6", 
  Contactado: "#0ea5e9", 
  "En Calificación": "#f59e0b", 
  "Propuesta Enviada": "#8b5cf6", 
  "Cierre Ganado": "#10b981", 
  "Cierre Perdido": "#64748b", 
};

const NAME_TO_SLUG: Record<string, string> = {
  "Nuevo": "nuevo",
  "Contactado": "contactado",
  "En Calificación": "en_calificacion",
  "Propuesta Enviada": "propuesta_enviada",
  "Cierre Ganado": "cierre_ganado",
  "Cierre Perdido": "cierre_perdido",
};

export default function DashboardPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [performance, setPerformance] = useState<VendorPerformance[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [timeframe, setTimeframe] = useState("7");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      getDashboardStats(token, timeframe === "all" ? undefined : timeframe),
      getPerformanceAnalytics(token),
      getLeads(token, "ordering=-created_at&page_size=5")
    ])
      .then(([statsData, perfData, leadsData]) => {
        setStats(statsData);
        setPerformance(perfData);
        setRecentLeads(leadsData.results);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, timeframe]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const statusData = Object.entries(stats.leads_by_status).map(
    ([name, value]) => ({
      name,
      value,
      fill: STATUS_COLORS[name] || "#3b82f6",
    })
  );

  const handleBarClick = (data: any) => {
    const slug = NAME_TO_SLUG[data.name];
    if (slug) {
      router.push(`/dashboard/leads?status=${slug}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Header with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">Dashboard</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
            Resumen operacional de tu pipeline comercial
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setTimeframe("7")}
              className={cn(
                "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase",
                timeframe === "7" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-white"
              )}
            >7D</button>
            <button 
              onClick={() => setTimeframe("30")}
              className={cn(
                "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase",
                timeframe === "30" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-white"
              )}
            >30D</button>
            <button 
              onClick={() => setTimeframe("all")}
              className={cn(
                "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest",
                timeframe === "all" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-white"
              )}
            >ALL</button>
          </div>
          <button 
            onClick={() => router.push("/dashboard/leads/new")}
            className="h-9 px-4 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all"
          >
            Nuevo Lead
          </button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-5 items-start">
        
        {/* Main Highlight Card */}
        <div className="col-span-12 lg:col-span-8 glass-card rounded-3xl p-5 relative overflow-hidden group border border-white/5 cursor-default">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] -mr-16 -mt-16 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Crecimiento Total</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-3xl font-black text-white leading-none">{stats.total_leads}</h2>
                  <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">↑ 12%</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 800}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.02)'}}
                    contentStyle={{backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', padding: '8px'}}
                    itemStyle={{fontSize: '11px', fontWeight: 'black', textTransform: 'uppercase'}}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[8, 8, 0, 0]} 
                    onClick={(data) => handleBarClick(data)}
                    className="cursor-pointer"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 transition-opacity" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Performance Side Panel (4 columns) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-5">
          <div className="glass-card rounded-3xl p-5 flex-1 border border-white/5">
            <h3 className="text-sm font-black text-white mb-5 tracking-tight uppercase">Equipo de Ventas</h3>
            <div className="space-y-4">
              {performance.length > 0 ? performance.map((v, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-xs font-black text-white">
                      {v.vendor_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase">{v.vendor_name}</p>
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">{v.total_assigned} Asignados</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-400">{v.conversion_rate}%</p>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Conv.</p>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-500 italic text-center py-6 font-bold uppercase tracking-widest">Sin datos</p>
              )}
            </div>
            <button 
              onClick={() => router.push("/dashboard/analytics")}
              className="w-full mt-6 py-2.5 rounded-xl border border-white/5 text-[10px] font-black text-slate-500 hover:text-white hover:bg-white/5 transition-all uppercase tracking-[0.2em]"
            >
              Ver Equipo
            </button>
          </div>
        </div>

        {/* Secondary Metrics & Activity Feed */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={CheckCircle2} 
            label="Convertidos" 
            value={stats.leads_by_status["Cierre Ganado"] || 0} 
            color="#10b981" 
            onClick={() => router.push("/dashboard/leads?status=cierre_ganado")}
          />
          <StatCard 
            icon={Webhook} 
            label="Webhooks" 
            value={stats.total_webhooks} 
            color="#0ea5e9" 
            onClick={() => router.push("/dashboard/webhooks")}
          />
          <StatCard 
            icon={TrendingUp} 
            label="Éxito API" 
            value={`${stats.webhook_success_rate}%`} 
            color="#f59e0b" 
          />
          <StatCard 
            icon={AlertTriangle} 
            label="Fallidos" 
            value={stats.failed_webhooks} 
            color="#ef4444" 
            onClick={() => router.push("/dashboard/webhooks?status=failed")}
          />
        </div>

        {/* Recent Activity Feed */}
        <div className="col-span-12 lg:col-span-4">
          <div className="glass-card rounded-3xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-3 h-3" /> Actividad Reciente
              </h3>
              <button 
                onClick={() => router.push("/dashboard/leads")}
                className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline"
              >
                Ver Todo
              </button>
            </div>
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div 
                  key={lead.id} 
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-all cursor-pointer group"
                  onClick={() => router.push(`/dashboard/leads?selected=${lead.id}`)}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-[10px] font-bold text-white">
                    {lead.first_name.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-white truncate uppercase">{lead.first_name} {lead.last_name}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase truncate tracking-tighter">Ingresó desde {lead.first_source_name}</p>
                  </div>
                  <ArrowUpRight className="w-3 h-3 text-slate-700 group-hover:text-blue-500 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  onClick,
}: {
  icon: any;
  label: string;
  value: number | string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <div 
      className={cn(
        "glass-card rounded-3xl p-5 group relative overflow-hidden h-full border border-white/5 transition-all",
        onClick ? "cursor-pointer hover:border-white/10" : "cursor-default"
      )}
      onClick={onClick}
    >
      <div className="flex flex-col gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110"
          style={{ 
            backgroundColor: `${color}15`,
            border: `1px solid ${color}30`
          }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-black text-white mt-1">{value}</p>
        </div>
      </div>
      {onClick && (
        <ArrowUpRight className="absolute top-4 right-4 w-3 h-3 text-white/5 group-hover:text-white/40 transition-colors" />
      )}
    </div>
  );
}
