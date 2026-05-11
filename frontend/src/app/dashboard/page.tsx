/**
 * Lead Flow - Dashboard Page (Premium v3)
 * ========================================
 * Panel operacional con métricas clave, gráficos interactivos,
 * y flujo de conversión visual premium.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getLeads,
  getDashboardStats,
  getPerformanceAnalytics,
  type DashboardStats,
  type VendorPerformance,
  type Lead,
} from "@/lib/api";
import { toggleVendorAvailability } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Webhook,
  ArrowUpRight,
  Clock,
  Zap,
  Target,
  BarChart3,
  Activity,
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
  AreaChart,
  Area,
} from "recharts";

import FunnelChart from "@/components/FunnelChart";
import CustomSelect from "@/components/CustomSelect";

const STATUS_COLORS: Record<string, string> = {
  Nuevo: "#3b82f6",
  Contactado: "#0ea5e9",
  "En Calificación": "#f59e0b",
  "Propuesta Enviada": "#8b5cf6",
  "Cierre Ganado": "#10b981",
  "Cierre Perdido": "#64748b",
};

const NAME_TO_SLUG: Record<string, string> = {
  Nuevo: "nuevo",
  Contactado: "contactado",
  "En Calificación": "en_calificacion",
  "Propuesta Enviada": "propuesta_enviada",
  "Cierre Ganado": "cierre_ganado",
  "Cierre Perdido": "cierre_perdido",
};

const FUNNEL_COLORS = [
  "#3b82f6",
  "#0ea5e9",
  "#f59e0b",
  "#8b5cf6",
  "#10b981",
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
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");

  // 1. Carga inicial de datos estáticos (Vendedores y Leads Recientes)
  useEffect(() => {
    if (!token) return;
    const promises = [
      user?.isStaff ? getPerformanceAnalytics(token) : Promise.resolve([]),
      getLeads(token, "ordering=-created_at&page_size=5"),
    ];

    Promise.all(promises)
      .then(([perfData, leadsData]) => {
        setPerformance(perfData as VendorPerformance[]);
        const leads = (leadsData as any).results;
        setRecentLeads(leads);
        if (leads.length > 0) setLastLeadId(leads[0].id);
      })
      .catch(console.error);
  }, [token, user?.isStaff]);

  // 2. Carga reactiva de estadísticas (Depende de filtros)
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const statsQuery = new URLSearchParams();
    if (timeframe !== "all") statsQuery.set("days", timeframe);
    if (selectedVendorId) statsQuery.set("vendor_id", selectedVendorId);
    statsQuery.set("_t", Date.now().toString()); // Cache buster

    getDashboardStats(token, statsQuery.toString())
      .then((statsData) => {
        setStats(statsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, timeframe, selectedVendorId]);

  // Polling for new leads
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
                onClick: () =>
                  router.push(`/dashboard/leads?selected=${latestLead.id}`),
              });
            }
          }
        })
        .catch(console.error);
    }, 30000);
    return () => clearInterval(interval);
  }, [token, lastLeadId, router]);

  const handleToggleAvailability = async (vendorId: number) => {
    if (!token) return;
    try {
      const result = await toggleVendorAvailability(token, vendorId);
      setPerformance((prev) =>
        prev.map((v) =>
          v.vendor_id === vendorId ? { ...v, is_available: result.is_available } : v
        )
      );
    } catch (err) {
      console.error("Error toggling availability:", err);
    }
  };

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

  const funnelData = (stats.funnel_data || []).map(
    (step: any, i: number) => ({
      ...step,
      color: FUNNEL_COLORS[i] || "#3b82f6",
    })
  );

  const handleBarClick = (data: any) => {
    const slug = NAME_TO_SLUG[data.name];
    if (slug) router.push(`/dashboard/leads?status=${slug}`);
  };

  // Calculate key metrics
  const totalLeads = stats.total_leads || 0;
  const wonLeads = stats.leads_by_status?.["Cierre Ganado"] || 0;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0";
  const staleLeads = stats.stale_leads_count || 0;

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">
              Dashboard
            </h1>
            <div
              className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest",
                stats?.status === "error" || !stats
                  ? "bg-red-500/10 border-red-500/20 text-red-500"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              )}
            >
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full animate-pulse",
                  stats?.status === "error" || !stats
                    ? "bg-red-500"
                    : "bg-emerald-500"
                )}
              />
              {stats?.status === "error" || !stats
                ? "Offline"
                : "Sistema Online"}
            </div>
          </div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
            Resumen operacional de tu pipeline comercial
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user?.isStaff && (
            <CustomSelect
              value={selectedVendorId}
              onChange={setSelectedVendorId}
              options={[
                { value: "", label: "Vista Global (Todos)" },
                ...performance.map((v: any) => ({
                  value: (v.vendor_id || "").toString(),
                  label: v.vendor_name
                }))
              ]}
              className="min-w-[180px]"
            />
          )}
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
            {["7", "30", "all"].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase",
                  timeframe === t
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-500 hover:text-white"
                )}
              >
                {t === "all" ? "ALL" : `${t}D`}
              </button>
            ))}
          </div>
          <button
            onClick={() => router.push("/dashboard/leads/new")}
            className="h-9 px-4 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            Nuevo Lead
          </button>
        </div>
      </div>

      {/* ── Hero KPI Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={Users}
          label="Total Leads"
          value={totalLeads}
          color="#3b82f6"
          onClick={() => router.push("/dashboard/leads")}
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
          value={`${stats.webhook_success_rate || 0}%`}
          color="#f59e0b"
          onClick={() => router.push("/dashboard/webhooks")}
        />
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-12 gap-5 items-start">

        {/* Volume Chart */}
        <div className="col-span-12 lg:col-span-7 glass-card rounded-3xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">
                Volumen de Leads
              </p>
              <h2 className="text-xl font-black text-white">
                Distribución por Estado
              </h2>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-black uppercase">
                Live
              </span>
            </div>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} barSize={36}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.03)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#64748b",
                    fontSize: 9,
                    fontWeight: 800,
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#475569", fontSize: 10 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
                  }}
                  itemStyle={{
                    fontSize: "11px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                  }}
                />
                <Bar
                  dataKey="value"
                  radius={[8, 8, 0, 0]}
                  onClick={handleBarClick}
                  className="cursor-pointer"
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion Flow Graph */}
        <div className="col-span-12 lg:col-span-5 glass-card rounded-3xl p-6 border border-white/5">
          <div className="mb-4">
            <p className="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em] mb-1">
              Flujo de Conversión
            </p>
            <h2 className="text-xl font-black text-white">
              Pipeline en Vivo
            </h2>
          </div>
          <FunnelChart data={funnelData} />
        </div>

        {/* Source Ranking */}
        <div className="col-span-12 lg:col-span-4 glass-card rounded-3xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-1">
                Adquisición
              </p>
              <h3 className="text-sm font-black text-white uppercase">
                Ranking de Fuentes
              </h3>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-600" />
          </div>
          <div className="space-y-3">
            {stats.leads_by_source?.slice(0, 5).map((s: any, i: number) => {
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center text-xs">
                      {medal || <span className="text-[10px] font-black text-slate-600">#{i + 1}</span>}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase">
                        {s.name}
                      </p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">
                        {s.count} leads
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-blue-400">
                      {s.acquisition_share}%
                    </p>
                    <div className="w-20 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.min(s.acquisition_share, 100)}%`,
                          background: `linear-gradient(90deg, ${s.acquisition_share > 30 ? "#3b82f6" : "#6366f1"}, ${s.acquisition_share > 30 ? "#60a5fa" : "#818cf8"})`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-12 lg:col-span-4 glass-card rounded-3xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-1">
                Tiempo Real
              </p>
              <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Actividad Reciente
              </h3>
            </div>
            <button
              onClick={() => router.push("/dashboard/leads")}
              className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline"
            >
              Ver Todo
            </button>
          </div>
          <div className="relative">
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
              {recentLeads.map((lead, idx) => (
                <div
                  key={lead.id}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.03] transition-all cursor-pointer group border border-transparent hover:border-white/5"
                  onClick={() =>
                    router.push(`/dashboard/leads?selected=${lead.id}`)
                  }
                  style={{
                    animationDelay: `${idx * 80}ms`,
                  }}
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-[10px] font-bold text-white group-hover:bg-blue-600 group-hover:border-blue-500/30 transition-all">
                    {lead.first_name.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-black text-white truncate uppercase">
                      {lead.first_name} {lead.last_name}
                    </p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase truncate">
                      {lead.first_source_name} •{" "}
                      {new Date(lead.created_at).toLocaleDateString("es", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <ArrowUpRight className="w-3 h-3 text-slate-700 group-hover:text-blue-500 transition-colors" />
                </div>
              ))}
            </div>
            {/* Bottom fade effect */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--color-bg)] to-transparent pointer-events-none opacity-60" />
          </div>
        </div>

        {/* Team Performance (Staff Only) */}
        {user?.isStaff && (
          <div className="col-span-12 lg:col-span-4 glass-card rounded-3xl p-6 border border-white/5">
            <div className="mb-6">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">
                Equipo
              </p>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">
                Rendimiento del Equipo
              </h3>
            </div>
            <div className="relative">
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                {performance.map((v, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleAvailability(v.vendor_id)}
                        className={cn(
                          "w-8 h-8 rounded-lg border flex items-center justify-center transition-all",
                          v.is_available 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20" 
                            : "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                        )}
                        title={v.is_available ? "Disponible para Leads" : "No disponible"}
                      >
                        <Zap className={cn("w-3.5 h-3.5", !v.is_available && "opacity-30")} />
                      </button>
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-[10px] font-black text-white">
                        {v.vendor_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-black text-white uppercase">
                          {v.vendor_name}
                        </p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase">
                          {v.total_assigned || 0} leads
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          "text-sm font-black",
                          (v.conversion_rate || 0) > 30
                            ? "text-emerald-400"
                            : (v.conversion_rate || 0) > 15
                            ? "text-amber-400"
                            : "text-red-400"
                        )}
                      >
                        {v.conversion_rate}%
                      </p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                        Conversión
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Bottom fade effect */}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--color-bg)] to-transparent pointer-events-none opacity-60" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── KPI Card Component ── */
function KPICard({
  icon: Icon,
  label,
  value,
  color,
  onClick,
  accent,
  alert,
}: {
  icon: any;
  label: string;
  value: number | string;
  color: string;
  onClick?: () => void;
  accent?: boolean;
  alert?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative group overflow-hidden rounded-2xl p-5 border transition-all",
        onClick
          ? "cursor-pointer hover:border-white/10 hover:-translate-y-0.5"
          : "cursor-default",
        accent
          ? "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20"
          : alert
          ? "bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20"
          : "glass-card border-white/5"
      )}
      onClick={onClick}
    >
      {/* Background glow */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10 blur-2xl pointer-events-none transition-opacity group-hover:opacity-20"
        style={{ backgroundColor: color }}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
            {label}
          </p>
          <p className="text-2xl font-black text-white">{value}</p>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundColor: `${color}15`,
            border: `1px solid ${color}30`,
          }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>

      {onClick && (
        <ArrowUpRight className="absolute bottom-3 right-3 w-3 h-3 text-white/5 group-hover:text-white/30 transition-colors" />
      )}
    </div>
  );
}
