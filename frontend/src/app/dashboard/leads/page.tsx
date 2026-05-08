/**
 * Lead Flow - Leads List Page
 * ===========================
 * Tabla principal de gestión comercial con filtros y Slide-over de detalle.
 */

"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getLeads, getSources, getCampaigns, updateLead, type Lead, type Source, type Campaign } from "@/lib/api";
import { Search, Filter, ChevronLeft, ChevronRight, Eye, MoreHorizontal } from "lucide-react";
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

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  Nuevo: { label: "Nuevo", color: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  nuevo: { label: "Nuevo", color: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  Contactado: { label: "Contactado", color: "bg-sky-500/10 text-sky-400 border border-sky-500/20" },
  contactado: { label: "Contactado", color: "bg-sky-500/10 text-sky-400 border border-sky-500/20" },
  "En Calificación": { label: "Calificación", color: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  en_calificacion: { label: "Calificación", color: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  "Propuesta Enviada": { label: "Propuesta", color: "bg-violet-500/10 text-violet-400 border border-violet-500/20" },
  propuesta_enviada: { label: "Propuesta", color: "bg-violet-500/10 text-violet-400 border border-violet-500/20" },
  "Cierre Ganado": { label: "Ganado", color: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  cierre_ganado: { label: "Ganado", color: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  "Cierre Perdido": { label: "Perdido", color: "bg-slate-500/10 text-slate-400 border border-slate-500/20" },
  cierre_perdido: { label: "Perdido", color: "bg-slate-500/10 text-slate-400 border border-slate-500/20" },
};

export default function LeadsListPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
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
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [isStaleFilter, setIsStaleFilter] = useState(false);
  
  // Slide-over state
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Sync with URL params on mount
  useEffect(() => {
    const status = searchParams.get("status");
    const filter = searchParams.get("filter");
    const selected = searchParams.get("selected");

    if (status) setStatusFilter(status);
    if (filter === "stale") setIsStaleFilter(true);
    if (selected) setSelectedLeadId(selected);
  }, [searchParams]);

  const fetchLeads = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (sourceFilter) params.set("first_source", sourceFilter);
      if (campaignFilter) params.set("campaign", campaignFilter);
      
      // Manejar filtro de leads estancados (opcional, si el backend lo soporta)
      if (isStaleFilter) {
         // Si el backend no tiene filtro explícito 'stale', podríamos
         // filtrar localmente o añadir el param si lo implementamos
         // params.set("stale", "true");
      }

      const data = await getLeads(token, params.toString());
      setLeads(data.results);
      setTotalCount(data.count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, page, search, statusFilter, sourceFilter, campaignFilter, isStaleFilter]);

  useEffect(() => {
    fetchLeads();
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
      a.download = "leads_export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
    }
  };

  const totalPages = Math.ceil(totalCount / 20);

  const newToday = leads.filter(l => {
    const d = new Date(l.created_at);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
  }).length;
  
  const unattended = leads.filter(l => l.status.toLowerCase() === "nuevo").length;

  return (
    <div className="space-y-6 animate-fadeIn relative">
      {/* Mini-Dashboard Ticker */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TickerCard label="Nuevos Hoy" value={newToday} color="#3b82f6" trend="+2" />
        <TickerCard label="Sin Atender" value={unattended} color="#f59e0b" trend={unattended > 5 ? "Alert" : "OK"} />
        <TickerCard label="Meta Mensual" value="85%" color="#10b981" trend="↑ 5%" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">Leads</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
            {totalCount} contactos en sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="h-10 px-4 rounded-xl bg-slate-900/50 border border-white/5 text-slate-300 text-xs font-bold uppercase tracking-widest hover:text-white transition-all"
          >
            Exportar
          </button>
          <button
            onClick={() => router.push("/dashboard/leads/new")}
            className="h-10 px-6 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all"
          >
            + Nuevo Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="lead-search"
            type="text"
            placeholder="Buscar por email, nombre o teléfono..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-white/5 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 mr-2" />
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 bg-slate-900/50 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50"
          >
            <option value="">Estado</option>
            {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>)}
          </select>
          <select
            id="filter-source"
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 bg-slate-900/50 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50"
          >
            <option value="">Fuente</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-container rounded-3xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contacto</th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Score</th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estado</th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vendedor</th>
                <th className="text-center px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-500 font-medium">No se encontraron leads</td>
                </tr>
              ) : (
                leads.map((lead, i) => (
                  <tr
                    key={lead.id}
                    className="group hover:bg-white/[0.03] transition-colors cursor-pointer"
                    onClick={() => setSelectedLeadId(lead.id)}
                  >
                    <td className="px-6 py-4 max-w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                          {(lead.first_name || lead.original_email).charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                          {lead.first_name} {lead.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lead.score >= 80 ? '#10b981' : lead.score >= 50 ? '#f59e0b' : '#ef4444' }} />
                         <span className="text-xs font-bold text-white">{lead.score}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-[180px]">
                      <span className="text-xs font-medium text-slate-400 truncate block">{lead.original_email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={lead.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusUpdate(lead.id, e.target.value)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-transparent border border-white/5 focus:outline-none focus:ring-1 focus:ring-blue-600/50 cursor-pointer",
                          STATUS_BADGES[lead.status]?.color || "text-slate-400"
                        )}
                      >
                        {STATUS_OPTIONS.map(opt => <option key={opt} value={opt} className="bg-slate-900 text-white">{opt.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-400">{lead.assigned_to_name || "Sin asignar"}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLeadId(lead.id);
                          }}
                          className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/leads/${lead.id}`);
                          }}
                          className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.01]">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-white/5 text-slate-500 hover:bg-white/5 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-white/5 text-slate-500 hover:bg-white/5 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Detail Panel */}
      <LeadDetailPanel 
        leadId={selectedLeadId}
        token={token}
        onClose={() => setSelectedLeadId(null)}
        onUpdate={fetchLeads}
      />
    </div>
  );
}

function TickerCard({ label, value, color, trend }: { label: string; value: string | number; color: string; trend: string }) {
  return (
    <div className="glass-card rounded-2xl p-4 flex items-center justify-between group overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: color }} />
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-white mt-0.5">{value}</p>
      </div>
      <div className="text-right">
        <span className={cn(
          "text-[10px] font-bold px-1.5 py-0.5 rounded",
          trend === "Alert" ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
        )}>
          {trend}
        </span>
      </div>
    </div>
  );
}
