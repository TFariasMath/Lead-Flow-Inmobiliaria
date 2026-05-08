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

import FunnelChart from "@/components/FunnelChart";

const FUNNEL_COLORS = [
  "#3b82f6", // Nuevo (Blue)
  "#0ea5e9", // Contactado (Sky)
  "#f59e0b", // En Calificación (Amber)
  "#8b5cf6", // Propuesta (Violet)
  "#10b981", // Cierre Ganado (Emerald)
];

export default function DashboardPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [performance, setPerformance] = useState<VendorPerformance[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [timeframe, setTimeframe] = useState("7");
  const [loading, setLoading] = useState(true);
  const [lastLeadId, setLastLeadId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    
    const promises = [
      getDashboardStats(token, timeframe === "all" ? undefined : timeframe),
      user?.isStaff ? getPerformanceAnalytics(token) : Promise.resolve([]),
      getLeads(token, "ordering=-created_at&page_size=5")
    ];

    Promise.all(promises)
      .then(([statsData, perfData, leadsData]) => {
        setStats(statsData);
        setPerformance(perfData as VendorPerformance[]);
        const leads = (leadsData as any).results;
        setRecentLeads(leads);
        if (leads.length > 0) {
          setLastLeadId(leads[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, timeframe, user?.isStaff]);

  // Polling for notifications (kept from previous implementation)
  useEffect(() => {
    if (!token || !lastLeadId) return;
    const interval = setInterval(() => {
      getLeads(token, "ordering=-created_at&page_size=1")
        .then((data) => {
          const latestLead = data.results[0];
          if (latestLead && latestLead.id !== lastLeadId) {
            setLastLeadId(latestLead.id);
            if (typeof window !== "undefined" && (window as any).notify) {
              (window as any).notify({
                title: "Nuevo Lead Capturado",
                message: `${latestLead.first_name} ${latestLead.last_name} ingresó desde ${latestLead.first_source_name}`,
                type: "success",
                onClick: () => router.push(`/dashboard/leads?selected=${latestLead.id}`)
              });
            }
          }
        })
        .catch(console.error);
    }, 30000);
    return () => clearInterval(interval);
  }, [token, lastLeadId, router]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const statusData = Object.entries(stats.leads_by_status || {}).map(
    ([name, value]) => ({
      name,
      value,
      fill: STATUS_COLORS[name] || "#3b82f6",
    })
  );

  const funnelData = (stats.funnel_data || []).map((step: any, i: number) => ({
    ...step,
    color: FUNNEL_COLORS[i] || "#3b82f6"
  }));

  const handleBarClick = (data: any) => {
    const slug = NAME_TO_SLUG[data.name];
    if (slug) router.push(`/dashboard/leads?status=${slug}`);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">Dashboard</h1>
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest animate-pulse",
              stats?.status === "error" || !stats ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full", stats?.status === "error" || !stats ? "bg-red-500" : "bg-emerald-500")} />
              {stats?.status === "error" || !stats ? "Offline" : "Sistema Online"}
            </div>
          </div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
            Resumen operacional de tu pipeline comercial
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
            {["7", "30", "all"].map((t) => (
              <button 
                key={t}
                onClick={() => setTimeframe(t)}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase",
                  timeframe === t ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-white"
                )}
              >{t === "all" ? "ALL" : `${t}D`}</button>
            ))}
          </div>
          <button 
            onClick={() => router.push("/dashboard/leads/new")}
            className="h-9 px-4 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all"
          >
            Nuevo Lead
          </button>
        </div>
      </div>

      {/* Bento Grid 2.0 */}
      <div className="grid grid-cols-12 gap-5 items-stretch">
        
        {/* Main Chart (Trend) */}
        <div className="col-span-12 lg:col-span-8 glass-card rounded-3xl p-6 border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">Volumen de Leads</p>
              <h2 className="text-2xl font-black text-white">Crecimiento Mensual</h2>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] text-emerald-400 font-black uppercase">↑ 12.5%</span>
            </div>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 800}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.02)'}}
                  contentStyle={{backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)'}}
                  itemStyle={{fontSize: '11px', fontWeight: 'black', textTransform: 'uppercase'}}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} onClick={handleBarClick} className="cursor-pointer">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 transition-opacity" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel Chart (Drop-off) */}
        <div className="col-span-12 lg:col-span-4 glass-card rounded-3xl p-6 border border-white/5 flex flex-col">
          <div className="mb-6">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">Pipeline Comercial</p>
            <h2 className="text-2xl font-black text-white">Embudo de Cierre</h2>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <FunnelChart data={funnelData} />
          </div>
        </div>

        {/* KPIs Row */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard icon={CheckCircle2} label="Convertidos" value={stats.leads_by_status["Cierre Ganado"] || 0} color="#10b981" onClick={() => router.push("/dashboard/leads?status=cierre_ganado")} />
          <StatCard icon={AlertTriangle} label="Leads Estancados" value={stats.stale_leads_count} color="#ef4444" onClick={() => router.push("/dashboard/leads?filter=stale")} />
          <StatCard icon={Webhook} label="Webhooks Total" value={stats.total_webhooks} color="#0ea5e9" onClick={() => router.push("/dashboard/webhooks")} />
          <StatCard icon={TrendingUp} label="Salud API" value={`${stats.webhook_success_rate}%`} color="#f59e0b" />
        </div>

        {/* Source Ranking (Efficiency) */}
        <div className="col-span-12 lg:col-span-4 glass-card rounded-3xl p-6 border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-white uppercase">Ranking de Fuentes</h3>
            <span className="text-[10px] font-black text-slate-500 uppercase">Conv. %</span>
          </div>
          <div className="space-y-4 flex-1">
            {stats.leads_by_source?.slice(0, 5).map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-700 w-4">#{i+1}</span>
                  <div>
                    <p className="text-xs font-black text-white uppercase">{s.name}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">{s.count} Leads</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-blue-500">{s.conversion_rate}%</p>
                  <div className="w-16 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${s.conversion_rate}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-12 lg:col-span-4 glass-card rounded-3xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Actividad Viva
            </h3>
            <button onClick={() => router.push("/dashboard/leads")} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">Ver Todo</button>
          </div>
          <div className="space-y-4">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.03] transition-all cursor-pointer group border border-transparent hover:border-white/5" onClick={() => router.push(`/dashboard/leads?selected=${lead.id}`)}>
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-[10px] font-bold text-white group-hover:bg-blue-600 transition-colors">
                  {lead.first_name.charAt(0)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-black text-white truncate uppercase">{lead.first_name} {lead.last_name}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase truncate">Desde {lead.first_source_name}</p>
                </div>
                <ArrowUpRight className="w-3 h-3 text-slate-700 group-hover:text-blue-500 transition-colors" />
              </div>
            ))}
          </div>
        </div>

        {/* Team Performance (Staff Only) */}
        {user?.isStaff && (
          <div className="col-span-12 lg:col-span-4 glass-card rounded-3xl p-6 border border-white/5">
            <h3 className="text-sm font-black text-white uppercase mb-6 tracking-tight">Vendedores Top</h3>
            <div className="space-y-4">
              {performance.slice(0, 3).map((v, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center text-[10px] font-black text-white">{v.vendor_name.charAt(0)}</div>
                    <p className="text-xs font-black text-white uppercase">{v.vendor_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-400">{v.conversion_rate}%</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Ratio Cierre</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
