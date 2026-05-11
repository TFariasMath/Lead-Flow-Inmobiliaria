/**
 * Lead Flow - Leads List Page (Premium v3 + Performance Elite)
 * ==========================================================
 * Tabla principal de gestión con Virtualización (TanStack), 
 * Memoización (React.memo) y Lazy Loading (Next dynamic).
 */

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useCallback, useRef, Suspense, memo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/hooks/useData";
import { 
  updateLead, 
  bulkUpdateLeads, 
  getUsers,
  type Lead, 
  type Source, 
  type Campaign, 
  type PaginatedResponse,
  type User
} from "@/lib/api";
import { useVirtualizer } from "@tanstack/react-virtual";
import dynamic from "next/dynamic";
import CustomSelect from "@/components/CustomSelect";
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
  MousePointer2,
  AlertTriangle,
  ArrowUpRight,
  LayoutList,
  Columns3 as Kanban,
  CheckSquare,
  Square,
  UserPlus,
  Trash2,
  X
} from "lucide-react";
import KanbanView from "@/components/leads/KanbanView";
import { cn } from "@/lib/utils";
import { useHistory } from "@/hooks/useHistory";

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
  const [staleFilter, setStaleFilter] = useState(searchParams.get("filter") === "stale");
  const [todayFilter, setTodayFilter] = useState(searchParams.get("filter") === "today");
  
  // EDO: Estado de edición en línea
  const [editingCell, setEditingCell] = useState<{ id: string, field: string, value: string } | null>(null);
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const { addVisit } = useHistory();

  // SWR Query Keys
  const leadsQuery = new URLSearchParams();
  leadsQuery.set("page", page.toString());
  if (search) leadsQuery.set("search", search);
  if (statusFilter) leadsQuery.set("status", statusFilter);
  if (sourceFilter) leadsQuery.set("first_source", sourceFilter);
  if (campaignFilter) leadsQuery.set("campaign", campaignFilter);
  if (staleFilter) leadsQuery.set("filter", "stale");
  if (todayFilter) leadsQuery.set("filter", "today");

  const { data: leadsData, isLoading: loading, mutate: mutateLeads } = useData<PaginatedResponse<Lead>>(`/leads?${leadsQuery.toString()}`);
  const { data: sourcesData } = useData<PaginatedResponse<Source>>("/sources");
  const { data: campaignsData } = useData<PaginatedResponse<Campaign>>("/campaigns");
  const { data: usersData } = useData<User[]>("/users");

  // Efecto para abrir automáticamente un lead si viene por URL (desde Webhooks)
  useEffect(() => {
    const autoId = searchParams.get("id");
    if (autoId) {
      setSelectedLeadId(autoId);
    }
  }, [searchParams]);

  const leads = leadsData?.results || [];
  const totalCount = leadsData?.count || 0;
  const sources = sourcesData?.results || [];
  const campaigns = campaignsData?.results || [];

  const handleStatusUpdate = useCallback(async (leadId: string, newStatus: string) => {
    if (!token) return;
    try {
      await updateLead(token, leadId, { status: (newStatus as any) });
      mutateLeads();
    } catch (err) {
      console.error(err);
    }
  }, [token, mutateLeads]);

  const handleInlineUpdate = useCallback(async (leadId: string, field: string, value: string) => {
    if (!token) return;
    try {
      await updateLead(token, leadId, { [field]: value });
      mutateLeads();
      setEditingCell(null);
    } catch (err) {
      console.error(err);
    }
  }, [token, mutateLeads]);

  const handleSelectLead = useCallback((lead: Lead) => {
    setSelectedLeadId(lead.id);
    addVisit(lead);
  }, [addVisit]);

  const handleBulkUpdate = async (fields: Partial<Lead>) => {
    if (!token || selectedIds.size === 0) return;
    setIsBulkUpdating(true);
    try {
      await bulkUpdateLeads(token, Array.from(selectedIds), fields);
      setSelectedIds(new Set());
      mutateLeads();
    } catch (err) {
      console.error(err);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map(l => l.id)));
    }
  };

  const toggleSelectLead = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

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
        <MemoizedMiniCard 
          icon={Activity} 
          label="Contactos Totales" 
          value={totalCount} 
          color="#3b82f6" 
          onClick={() => { setStatusFilter(""); setTodayFilter(false); setStaleFilter(false); setPage(1); }}
        />
        <MemoizedMiniCard 
          icon={Zap} 
          label="Nuevos Hoy" 
          value={leadsData?.count && todayFilter ? leadsData.count : "..."} 
          color="#0ea5e9" 
          trend="+12%" 
          active={todayFilter}
          onClick={() => { setTodayFilter(!todayFilter); setStatusFilter(""); setStaleFilter(false); setPage(1); }}
        />
        <MemoizedMiniCard 
          icon={Target} 
          label="Sin Atender" 
          value={statusFilter === "nuevo" ? totalCount : "..."} 
          color="#f59e0b" 
          active={statusFilter === "nuevo"}
          onClick={() => { setStatusFilter(statusFilter === "nuevo" ? "" : "nuevo"); setTodayFilter(false); setStaleFilter(false); setPage(1); }}
        />
        <MemoizedMiniCard icon={MousePointer2} label="CTR Promedio" value="4.2%" color="#10b981" />
      </div>

      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Listado de Leads</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Gestión de oportunidades comerciales</p>
        </div>
        <div className="flex items-center gap-3">
          {staleFilter && (
            <button 
              onClick={() => { setStaleFilter(false); setPage(1); }}
              className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase flex items-center gap-2 hover:bg-red-500/20 transition-all"
            >
              <AlertTriangle className="w-3 h-3" /> Leads Estancados Activo
              <span className="opacity-60">✕</span>
            </button>
          )}
          <div className="flex items-center bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-white/10 mr-2 shadow-inner">
            <button 
              onClick={() => setView('table')}
              className={cn(
                "p-2 rounded-lg transition-all duration-300 flex items-center gap-2", 
                view === 'table' 
                  ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] ring-1 ring-white/20" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}
              title="Vista de Tabla"
            >
              <LayoutList className="w-4 h-4" />
              {view === 'table' && <span className="text-[10px] font-black uppercase tracking-tighter pr-1">Tabla</span>}
            </button>
            <button 
              onClick={() => setView('kanban')}
              className={cn(
                "p-2 rounded-lg transition-all duration-300 flex items-center gap-2", 
                view === 'kanban' 
                  ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] ring-1 ring-white/20" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}
              title="Vista Kanban"
            >
              <Kanban className="w-4 h-4" />
              {view === 'kanban' && <span className="text-[10px] font-black uppercase tracking-tighter pr-1">Pipeline</span>}
            </button>
          </div>
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
          <button
            onClick={() => { setStaleFilter(!staleFilter); setPage(1); }}
            className={cn(
              "h-11 px-4 rounded-xl border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
              staleFilter 
                ? "bg-red-500/20 border-red-500/40 text-red-500 shadow-lg shadow-red-500/10" 
                : "bg-slate-900/50 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10"
            )}
            title="Filtrar por leads estancados (>24h)"
          >
            <AlertTriangle className={cn("w-3.5 h-3.5", staleFilter ? "animate-pulse" : "opacity-40")} />
            <span className="hidden sm:inline">Estancados</span>
          </button>
          
          <CustomSelect
            value={statusFilter}
            onChange={(val) => { setStatusFilter(val); setPage(1); }}
            options={[
              { value: "", label: "Todos los Estados" },
              ...STATUS_OPTIONS.map(opt => ({ 
                value: opt, 
                label: STATUS_LABELS[opt] || opt,
                badgeClass: STATUS_BADGE_MAP[opt]
              }))
            ]}
            className="flex-1"
          />

          <CustomSelect
            value={sourceFilter}
            onChange={(val) => { setSourceFilter(val); setPage(1); }}
            options={[
              { value: "", label: "Todas las Fuentes" },
              ...sources.map(s => ({ value: s.id.toString(), label: s.name }))
            ]}
            className="flex-1"
          />
        </div>
      </div>

      {/* ── View Content ── */}
      {view === 'table' ? (
        <div className="glass-container rounded-[1.5rem] overflow-hidden flex flex-col h-[600px]">
          {/* Header Grid */}
          <div className="grid grid-cols-[40px_2fr_1fr_1fr_0.8fr_1.5fr_1.2fr_1.2fr_0.8fr] items-center px-6 py-4 bg-[#080e1e]/90 backdrop-blur-md border-b border-white/[0.04] z-20">
            <div className="flex items-center justify-center">
              <button onClick={toggleSelectAll} className="text-slate-500 hover:text-blue-400 transition-colors">
                {selectedIds.size === leads.length && leads.length > 0 ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <Square className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lead / Nombre</div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Teléfono</div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Empresa</div>
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
                      isSelected={selectedIds.has(lead.id)}
                      editingCell={editingCell}
                      setEditingCell={setEditingCell}
                      onInlineUpdate={handleInlineUpdate}
                      onToggleSelect={() => toggleSelectLead(lead.id)}
                      onSelect={() => handleSelectLead(lead)}
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
      ) : (
        <KanbanView 
          leads={leads} 
          onStatusUpdate={handleStatusUpdate} 
          onSelectLead={(id) => {
            const lead = leads.find(l => l.id === id);
            if (lead) handleSelectLead(lead);
          }} 
        />
      )}

      {selectedLeadId && (
        <LeadDetailPanel 
          leadId={selectedLeadId}
          token={token}
          onClose={() => setSelectedLeadId(null)}
          onUpdate={mutateLeads}
        />
      )}

      {/* ── Bulk Actions Floating Bar ── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-slideUp">
          <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-6 ring-1 ring-white/5">
            <div className="flex items-center gap-3 pr-6 border-r border-white/10">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-black text-white">
                {selectedIds.size}
              </div>
              <p className="text-[10px] font-black text-white uppercase tracking-widest">Leads Seleccionados</p>
              <button onClick={() => setSelectedIds(new Set())} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cambiar Estado:</p>
                <CustomSelect
                  value=""
                  onChange={(val) => handleBulkUpdate({ status: val as any })}
                  options={[
                    { value: "", label: "Seleccionar..." },
                    ...STATUS_OPTIONS.map(opt => ({ 
                      value: opt, 
                      label: STATUS_LABELS[opt] || opt,
                      badgeClass: STATUS_BADGE_MAP[opt]
                    }))
                  ]}
                  className="min-w-[120px]"
                />
              </div>

              <div className="flex items-center gap-2">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Asignar a:</p>
                <CustomSelect
                  value=""
                  onChange={(val) => handleBulkUpdate({ assigned_to: parseInt(val) })}
                  options={[
                    { value: "", label: "Vendedor..." },
                    ...(usersData || []).map((u: any) => ({ value: u.id.toString(), label: u.username }))
                  ]}
                  className="min-w-[120px]"
                />
              </div>

              <button 
                onClick={handleExportCSV} // Podríamos optimizar para exportar solo seleccionados después
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-white uppercase hover:bg-white/10 transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Exportar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- MEMOIZED COMPONENTS ---

const MemoizedMiniCard = memo(({ icon: Icon, label, value, color, trend, alert, active, onClick }: any) => (
  <div 
    onClick={onClick}
    className={cn(
      "glass-card rounded-2xl p-4 flex items-center justify-between group relative overflow-hidden transition-all duration-500", 
      alert && "border-red-500/20",
      active && "border-white/20 bg-white/5 ring-2 ring-white/10 scale-[1.02] shadow-2xl",
      onClick && "cursor-pointer hover:bg-white/[0.04] hover:scale-[1.02]"
    )}
  >
    {/* Dynamic Background Glow */}
    <div 
      className="absolute -right-4 -top-4 w-24 h-24 blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity duration-700" 
      style={{ backgroundColor: color }} 
    />
    
    <div className={cn("absolute top-0 left-0 w-1 h-full opacity-40 group-hover:opacity-100 transition-opacity", active && "opacity-100")} style={{ backgroundColor: color }} />
    
    <div className="flex items-center gap-4 relative z-10">
      <div 
        className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center text-slate-500 group-hover:rotate-[10deg] transition-all duration-500 border border-white/[0.05]" 
        style={{ color: alert || active ? (alert ? '#ef4444' : color) : color, boxShadow: active ? `0 0 20px ${color}33` : 'none' }}
      >
        <Icon className={cn("w-6 h-6", active && "animate-pulse")} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">{label}</p>
        <div className="flex items-end gap-2">
          <p className="text-2xl font-black text-white tracking-tight">{value}</p>
          {trend && <span className="text-[9px] font-black text-emerald-400 mb-1">{trend}</span>}
        </div>
      </div>
    </div>
    {onClick && <ArrowUpRight className="w-4 h-4 text-white/5 group-hover:text-white/40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
  </div>
));
MemoizedMiniCard.displayName = "MemoizedMiniCard";

const MemoizedLeadRow = memo(({ lead, virtualRow, isSelected, onToggleSelect, editingCell, setEditingCell, onInlineUpdate, onSelect, onStatusUpdate, onAction }: any) => {
  const isEditing = (field: string) => editingCell?.id === lead.id && editingCell?.field === field;

  const handleDoubleClick = (field: string, value: string) => {
    setEditingCell({ id: lead.id, field, value });
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === "Enter") {
      onInlineUpdate(lead.id, field, (e.target as HTMLInputElement).value);
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  const renderEditable = (field: string, value: string, placeholder: string = "...") => {
    if (isEditing(field)) {
      return (
        <input
          autoFocus
          className="bg-blue-500/10 border border-blue-500/50 text-white text-xs px-2 py-1 rounded w-full outline-none focus:ring-1 focus:ring-blue-500"
          defaultValue={value}
          onBlur={(e) => onInlineUpdate(lead.id, field, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, field)}
        />
      );
    }
    return (
      <p 
        onDoubleClick={() => handleDoubleClick(field, value)}
        className="text-[11px] font-bold text-slate-400 hover:text-blue-400 cursor-text transition-colors truncate"
      >
        {value || placeholder}
      </p>
    );
  };

  return (
    <div
      className={cn(
        "grid grid-cols-[40px_2fr_1fr_1fr_0.8fr_1.5fr_1.2fr_1.2fr_0.8fr] items-center px-6 absolute top-0 left-0 w-full hover:bg-white/[0.02] transition-colors border-b border-white/[0.02] group",
        isSelected && "bg-blue-500/10 border-blue-500/20"
      )}
      style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
    >
      <div className="flex items-center justify-center">
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleSelect(); }} 
          className={cn("transition-colors", isSelected ? "text-blue-500" : "text-slate-700 group-hover:text-slate-500")}
        >
          {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
        </button>
      </div>

      {/* Lead / Nombre */}
      <div className="flex items-center gap-3 pr-4 overflow-hidden" onClick={onSelect}>
        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-xs font-black text-blue-400 shrink-0">{(lead.first_name || lead.original_email).charAt(0).toUpperCase()}</div>
        <div className="truncate flex-1">
          {isEditing("name") ? (
            <input
              autoFocus
              className="bg-blue-500/10 border border-blue-500/50 text-white text-sm font-bold px-2 py-1 rounded w-full outline-none"
              defaultValue={`${lead.first_name} ${lead.last_name}`}
              onBlur={(e) => {
                const parts = e.target.value.split(" ");
                onInlineUpdate(lead.id, "first_name", parts[0] || "");
                onInlineUpdate(lead.id, "last_name", parts.slice(1).join(" "));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const parts = (e.target as HTMLInputElement).value.split(" ");
                  onInlineUpdate(lead.id, "first_name", parts[0] || "");
                  onInlineUpdate(lead.id, "last_name", parts.slice(1).join(" "));
                } else if (e.key === "Escape") setEditingCell(null);
              }}
            />
          ) : (
            <p 
              onDoubleClick={() => handleDoubleClick("name", `${lead.first_name} ${lead.last_name}`)}
              className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors uppercase truncate cursor-text"
            >
              {lead.first_name} {lead.last_name}
            </p>
          )}
        </div>
      </div>

      {/* Teléfono */}
      <div className="pr-4">{renderEditable("phone", lead.phone, "Sin teléfono")}</div>

      {/* Empresa */}
      <div className="pr-4">{renderEditable("company", lead.company, "Sin empresa")}</div>

      {/* Score */}
      <div className="text-center">
        <span className="text-[10px] font-black text-white px-2 py-1 bg-white/5 rounded-lg border border-white/5">{lead.score}</span>
      </div>

      {/* Email */}
      <div className="text-[11px] text-slate-400 font-mono truncate pr-4">{lead.original_email}</div>

      {/* Estado */}
      <div className="pr-4">
        <CustomSelect
          variant="badge"
          value={lead.status}
          onChange={(newVal) => onStatusUpdate(lead.id, newVal)}
          options={STATUS_OPTIONS.map(opt => ({
            value: opt,
            label: STATUS_LABELS[opt] || opt,
            badgeClass: STATUS_BADGE_MAP[opt]
          }))}
          className="w-full"
        />
      </div>

      {/* Vendedor */}
      <div className="text-[11px] font-bold text-slate-500 truncate pr-4">{lead.assigned_to_name || "Sin asignar"}</div>

      {/* Acciones */}
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
