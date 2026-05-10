/**
 * Lead Flow - Leads List Page (Premium v3 + Performance Elite)
 * ==========================================================
 * Tabla principal de gestión con Virtualización (TanStack), 
 * Memoización (React.memo) y Lazy Loading (Next dynamic).
 */

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useCallback, useRef, Suspense, memo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/hooks/useData";
import { updateLead, type Lead, type Source, type Campaign, type PaginatedResponse } from "@/lib/api";
import { useVirtualizer } from "@tanstack/react-virtual";
import dynamic from "next/dynamic";
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

// --- CONSTANTS ---
const STATUS_OPTIONS = ["nuevo", "contactado", "en_calificacion", "propuesta_enviada", "cierre_ganado", "cierre_perdido"];
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

// --- LAZY LOADING ---
const LeadDetailPanel = dynamic(() => import("@/components/LeadDetailPanel"), {
  ssr: false,
  loading: () => <div className="fixed inset-y-0 right-0 w-[400px] bg-slate-950/50 backdrop-blur-xl animate-pulse z-[60]" />
});

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
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [sourceFilter, setSourceFilter] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // SWR Query Keys
  const leadsQuery = new URLSearchParams();
  leadsQuery.set("page", page.toString());
  if (search) leadsQuery.set("search", search);
  if (statusFilter) leadsQuery.set("status", statusFilter);
  if (sourceFilter) leadsQuery.set("first_source", sourceFilter);
  if (campaignFilter) leadsQuery.set("campaign", campaignFilter);

  const { data: leadsData, isLoading: loading, mutate: mutateLeads } = useData<PaginatedResponse<Lead>>(`/leads?${leadsQuery.toString()}`);
  const { data: sourcesData } = useData<PaginatedResponse<Source>>("/sources");
  const { data: campaignsData } = useData<PaginatedResponse<Campaign>>("/campaigns");

  const leads = leadsData?.results || [];
  const totalCount = leadsData?.count || 0;
  const sources = sourcesData?.results || [];
  const campaigns = campaignsData?.results || [];

  const handleStatusUpdate = useCallback(async (leadId: string, newStatus: string) => {
    if (!token) return;
    try {
      await updateLead(token, leadId, { status: newStatus });
      mutateLeads();
    } catch (err) {
      console.error(err);
    }
  }, [token, mutateLeads]);

  // VIRTUALIZACIÓN
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: leads.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  });

  const handleExportCSV = async () => {
    if (!token) return;
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${API_BASE}/leads/export/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MemoizedMiniCard icon={Activity} label="Contactos Totales" value={totalCount} color="#3b82f6" />
        <MemoizedMiniCard icon={Zap} label="Nuevos Hoy" value={leads.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length} color="#0ea5e9" trend="+12%" />
        <MemoizedMiniCard icon={Target} label="Sin Atender" value={leads.filter(l => l.status === "nuevo").length} color="#f59e0b" alert={leads.filter(l => l.status === "nuevo").length > 10} />
        <MemoizedMiniCard icon={MousePointer2} label="CTR Promedio" value="4.2%" color="#10b981" />
      </div>

      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Listado de Leads</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Gestión de oportunidades comerciales</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="btn-ghost flex items-center gap-2 text-xs">
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
          <button onClick={() => router.push("/dashboard/leads/new")} className="btn-primary flex items-center gap-2 text-xs">
            <Plus className="w-4 h-4" /> Nuevo Lead
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="input-icon-wrapper group">
            <Search className="w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por email, nombre o teléfono..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-premium input-premium-icon h-11"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-premium flex-1 h-11 text-[10px] font-bold uppercase tracking-widest"
          >
            <option value="">Todos los Estados</option>
            {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{STATUS_LABELS[opt] || opt}</option>)}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
            className="input-premium flex-1 h-11 text-[10px] font-bold uppercase tracking-widest"
          >
            <option value="">Todas las Fuentes</option>
            {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* ── List Container (Virtualizada) ── */}
      <div className="glass-container rounded-[1.5rem] overflow-hidden flex flex-col h-[600px]">
        {/* Header Grid */}
        <div className="grid grid-cols-[3fr_1fr_2fr_1.5fr_1.5fr_1fr] items-center px-6 py-4 bg-[#080e1e]/90 backdrop-blur-md border-b border-white/[0.04] z-20">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lead / Contacto</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Score</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vendedor</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Acciones</div>
        </div>

        <div ref={parentRef} className="flex-1 overflow-auto custom-scrollbar relative">
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative', width: '100%' }}>
            {loading && leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sincronizando...</p>
              </div>
            ) : leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32">
                <p className="text-sm font-bold text-slate-500">No se encontraron leads</p>
              </div>
            ) : (
              rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const lead = leads[virtualRow.index];
                if (!lead) return null;
                return (
                  <MemoizedLeadRow
                    key={lead.id}
                    lead={lead}
                    virtualRow={virtualRow}
                    onSelect={() => setSelectedLeadId(lead.id)}
                    onStatusUpdate={handleStatusUpdate}
                    onAction={() => router.push(`/dashboard/leads/${lead.id}`)}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-4 border-t border-white/[0.04] bg-white/[0.01]">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Total: {totalCount} leads</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/5 disabled:opacity-20 transition-all hover:bg-white/5"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/5 disabled:opacity-20 transition-all hover:bg-white/5"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {selectedLeadId && (
        <LeadDetailPanel 
          leadId={selectedLeadId}
          token={token}
          onClose={() => setSelectedLeadId(null)}
          onUpdate={mutateLeads}
        />
      )}
    </div>
  );
}

// --- MEMOIZED COMPONENTS ---

const MemoizedMiniCard = memo(({ icon: Icon, label, value, color, trend, alert }: any) => (
  <div className={cn("glass-card rounded-2xl p-4 flex items-center justify-between group relative overflow-hidden", alert && "border-red-500/20")}>
    <div className="absolute top-0 left-0 w-1 h-full opacity-40 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: color }} />
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform duration-500" style={{ color: alert ? '#ef4444' : color }}><Icon className="w-5 h-5" /></div>
      <div>
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-xl font-black text-white">{value}</p>
      </div>
    </div>
  </div>
));
MemoizedMiniCard.displayName = "MemoizedMiniCard";

const MemoizedLeadRow = memo(({ lead, virtualRow, onSelect, onStatusUpdate, onAction }: any) => {
  return (
    <div
      className="grid grid-cols-[3fr_1fr_2fr_1.5fr_1.5fr_1fr] items-center px-6 absolute top-0 left-0 w-full hover:bg-white/[0.02] transition-colors border-b border-white/[0.02] group"
      onClick={onSelect}
      style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
    >
      <div className="flex items-center gap-3 pr-4 overflow-hidden">
        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-xs font-black text-blue-400 shrink-0">{(lead.first_name || lead.original_email).charAt(0).toUpperCase()}</div>
        <div className="truncate">
          <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors uppercase truncate">{lead.first_name} {lead.last_name}</p>
        </div>
      </div>
      <div className="text-center">
        <span className="text-[10px] font-black text-white px-2 py-1 bg-white/5 rounded-lg border border-white/5">{lead.score}</span>
      </div>
      <div className="text-[11px] text-slate-400 font-mono truncate pr-4">{lead.original_email}</div>
      <div className="pr-4">
        <select 
          value={lead.status} 
          onClick={e => e.stopPropagation()} 
          onChange={e => onStatusUpdate(lead.id, e.target.value)} 
          className={cn("badge outline-none cursor-pointer hover:scale-105 transition-transform", STATUS_BADGE_MAP[lead.status] || "badge-slate")}
        >
          {STATUS_OPTIONS.map(opt => <option key={opt} value={opt} className="bg-slate-950">{STATUS_LABELS[opt] || opt}</option>)}
        </select>
      </div>
      <div className="text-[11px] font-bold text-slate-500 truncate pr-4">{lead.assigned_to_name || "Sin asignar"}</div>
      <div className="flex items-center justify-center gap-2">
        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
          <button onClick={e => { e.stopPropagation(); onSelect(); }} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all hover:bg-blue-500/20"><Eye className="w-3.5 h-3.5" /></button>
          <button onClick={e => { e.stopPropagation(); onAction(); }} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all hover:bg-blue-500/20"><MoreHorizontal className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </div>
  );
});
MemoizedLeadRow.displayName = "MemoizedLeadRow";
