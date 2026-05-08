/**
 * Lead Flow - Leads List Page (Premium v3)
 * ========================================
 * Tabla principal de gestión comercial con filtros avanzados,
 * micro-métricas y Slide-over de detalle.
 */

"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getLeads, getSources, getCampaigns, updateLead, type Lead, type Source, type Campaign } from "@/lib/api";
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  MoreHorizontal, 
  Download, 
  Plus, 
  Activity, 
  Target, 
  Zap,
  MousePointer2
} from "lucide-react";
import { cn } from "@/lib/utils";
import LeadDetailPanel from "@/components/LeadDetailPanel";

const STATUS_OPTIONS = [
  "nuevo",
  "contactado",
  "en_calificacion",
  "propuesta_enviada",
  "cierre_ganado",
  "cierre_perdido",
];

const STATUS_BADGE_MAP: Record<string, string> = {
  nuevo: "badge-blue",
  contactado: "badge-cyan",
  en_calificacion: "badge-amber",
  propuesta_enviada: "badge-violet",
  cierre_ganado: "badge-emerald",
  cierre_perdido: "badge-slate",
};

const STATUS_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  en_calificacion: "Calificación",
  propuesta_enviada: "Propuesta",
  cierre_ganado: "Ganado",
  cierre_perdido: "Perdido",
};

export default function LeadsListPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LeadsListContent />
    </Suspense>
  );
}

function LeadsListContent() {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [sourceFilter, setSourceFilter] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [isStaleFilter, setIsStaleFilter] = useState(searchParams.get("filter") === "stale");
  
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const fetchLock = useRef(false);

  const fetchLeads = useCallback(async () => {
    if (!token || fetchLock.current) return;
    fetchLock.current = true;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (sourceFilter) params.set("first_source", sourceFilter);
      if (campaignFilter) params.set("campaign", campaignFilter);
      
      const data = await getLeads(token, params.toString());
      setLeads(data.results || []);
      setTotalCount(data.count || 0);
    } catch (err) {
      console.error("Error fetching leads:", err);
    } finally {
      setLoading(false);
      fetchLock.current = false;
    }
  }, [token, page, search, statusFilter, sourceFilter, campaignFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads();
    }, 50);
    return () => clearTimeout(timer);
  }, [fetchLeads]);

  useEffect(() => {
    if (!token) return;
    getSources(token).then((d) => setSources(d.results)).catch(console.error);
    getCampaigns(token).then((d) => setCampaigns(d.results)).catch(console.error);
  }, [token]);

  const handleStatusUpdate = async (leadId: string, newStatus: string) => {
    if (!token) return;
    try {
      await updateLead(token, leadId, { status: newStatus });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = async () => {
    if (!token) return;
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${API_BASE}/leads/export/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Error exporting CSV");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
    }
  };

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* ── Metric Strip ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger-children">
        <MiniCard icon={Activity} label="Contactos Totales" value={totalCount} color="#3b82f6" />
        <MiniCard icon={Zap} label="Nuevos Hoy" value={leads.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length} color="#0ea5e9" trend="+12%" />
        <MiniCard icon={Target} label="Sin Atender" value={leads.filter(l => l.status === "nuevo").length} color="#f59e0b" alert={leads.filter(l => l.status === "nuevo").length > 10} />
        <MiniCard icon={MousePointer2} label="CTR Promedio" value="4.2%" color="#10b981" />
      </div>

      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="section-title mb-1">Listado de Leads</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Gestión centralizada de oportunidades comerciales
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="btn-ghost flex items-center gap-2">
            <Download className="w-3.5 h-3.5" />
            Exportar
          </button>
          <button onClick={() => router.push("/dashboard/leads/new")} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Lead
          </button>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-6">
          <div className="input-icon-wrapper group">
            <Search className="w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              id="lead-search"
              type="text"
              placeholder="Buscar por email, nombre o teléfono..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-premium input-premium-icon h-11"
            />
          </div>
        </div>
        <div className="col-span-12 lg:col-span-6 flex gap-3">
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-premium flex-1 h-11 cursor-pointer font-bold text-[10px] uppercase tracking-widest"
          >
            <option value="">Todos los Estados</option>
            {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{STATUS_LABELS[opt] || opt}</option>)}
          </select>
          <select
            id="filter-source"
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
            className="input-premium flex-1 h-11 cursor-pointer font-bold text-[10px] uppercase tracking-widest"
          >
            <option value="">Todas las Fuentes</option>
            {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="glass-container rounded-[1.5rem] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full table-premium">
            <thead>
              <tr>
                <th className="w-[30%]">Lead / Contacto</th>
                <th className="w-[10%] text-center">Score</th>
                <th className="w-[20%]">Email de Contacto</th>
                <th className="w-[15%]">Estado</th>
                <th className="w-[15%]">Vendedor</th>
                <th className="w-[10%] text-center">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sincronizando Leads...</p>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Filter className="w-8 h-8 text-slate-800" />
                      <p className="text-sm font-bold text-slate-500">No se encontraron leads con estos filtros</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead, idx) => (
                  <tr
                    key={lead.id}
                    className="group cursor-pointer"
                    onClick={() => setSelectedLeadId(lead.id)}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-xs font-black text-blue-400 group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white transition-all duration-300">
                          {(lead.first_name || lead.original_email).charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate uppercase">
                            {lead.first_name} {lead.last_name}
                          </p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest truncate">
                            {lead.first_source_name || "Fuente Directa"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center font-mono">
                      <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/5">
                        <div className={cn("w-1.5 h-1.5 rounded-full", lead.score >= 80 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : lead.score >= 50 ? "bg-amber-500" : "bg-red-500")} />
                        <span className="text-xs font-bold text-white">{lead.score}</span>
                      </div>
                    </td>
                    <td className="font-mono">
                      <span className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors truncate block">
                        {lead.original_email}
                      </span>
                    </td>
                    <td>
                      <select 
                        value={lead.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusUpdate(lead.id, e.target.value)}
                        className={cn(
                          "badge outline-none cursor-pointer hover:scale-105 transition-transform",
                          STATUS_BADGE_MAP[lead.status] || "badge-slate"
                        )}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt} value={opt} className="bg-slate-950 text-white uppercase text-[10px]">
                            {STATUS_LABELS[opt] || opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-slate-800 border border-white/5 flex items-center justify-center text-[8px] font-black text-slate-400">
                          {(lead.assigned_to_name || "S").charAt(0)}
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-300 transition-colors">
                          {lead.assigned_to_name || "Sin asignar"}
                        </span>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedLeadId(lead.id); }}
                          className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-blue-600/20 hover:border-blue-500/20 border border-transparent transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/leads/${lead.id}`); }}
                          className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-5 border-t border-white/[0.04] bg-white/[0.01]">
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">
              Mostrando <span className="text-white">{leads.length}</span> de <span className="text-white">{totalCount}</span> resultados
            </p>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-slate-500 uppercase">Página {page} / {totalPages}</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/5 text-slate-600 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:pointer-events-none transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/5 text-slate-600 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:pointer-events-none transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <LeadDetailPanel 
        leadId={selectedLeadId}
        token={token}
        onClose={() => setSelectedLeadId(null)}
        onUpdate={fetchLeads}
      />
    </div>
  );
}

function MiniCard({ icon: Icon, label, value, color, trend, alert }: { icon: any; label: string; value: string | number; color: string; trend?: string; alert?: boolean }) {
  return (
    <div className={cn(
      "glass-card rounded-2xl p-4 flex items-center justify-between group relative overflow-hidden",
      alert && "border-red-500/20 bg-red-500/[0.02]"
    )}>
      <div className="absolute top-0 left-0 w-1 h-full opacity-40 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: color }} />
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform duration-500" style={{ color: alert ? '#ef4444' : color }}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-0.5">{label}</p>
          <p className="text-xl font-black text-white">{value}</p>
        </div>
      </div>
      {trend && (
        <div className={cn(
          "text-[9px] font-black px-1.5 py-0.5 rounded-lg border",
          trend.includes('+') ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
        )}>
          {trend}
        </div>
      )}
    </div>
  );
}
