/**
 * Lead Flow - Leads List Page (Premium v3 + Performance Elite)
 * ==========================================================
 * Tabla principal de gestión con Virtualización (TanStack), 
 * Memoización (React.memo) y Lazy Loading (Next dynamic).
 */

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useCallback, useRef, Suspense, memo, useEffect } from "react";
import { createPortal } from "react-dom";
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
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  MoreHorizontal, 
  Plus, 
  Activity, 
  Target, 
  Zap,
  MousePointer2,
  AlertTriangle,
  ArrowUpRight,
  Download,
  Trash2,
  Table as TableIcon,
  LayoutGrid,
  LayoutList,
  Columns3 as Kanban,
  Filter,
  CheckCircle,
  CheckSquare,
  Square,
  Clock,
  ExternalLink,
  MessageCircle,
  Settings,
  StickyNote,
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
  const [isMounted, setIsMounted] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    "name", "status", "phone", "company", "source", "notes", "created_at"
  ]));
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const { addVisit } = useHistory();

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const toggleColumn = (col: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-emerald-500', 'bg-amber-500', 'bg-cyan-500'
    ];
    const charCode = (name || "?").charCodeAt(0);
    return colors[charCode % colors.length];
  };

  const handleStatusUpdate = useCallback(async (leadId: string, newStatus: string) => {
    if (!token) return;
    try {
      await updateLead(token, leadId, { status: (newStatus as any) });
      mutateLeads();
    } catch (err) {
      console.error(err);
    }
  }, [token, mutateLeads]);

  const [scrollProgress, setScrollProgress] = useState(0);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);

  const handleScrollSync = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setScrollProgress(val);
    if (tableContainerRef.current) {
      const maxScroll = tableContainerRef.current.scrollWidth - tableContainerRef.current.clientWidth;
      tableContainerRef.current.style.scrollBehavior = 'auto';
      tableContainerRef.current.scrollLeft = (val / 100) * maxScroll;
    }
  };

  const onTableScroll = () => {
    if (tableContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tableContainerRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        setScrollProgress((scrollLeft / maxScroll) * 100);
      }
      if (topScrollRef.current) {
        topScrollRef.current.scrollLeft = scrollLeft;
      }
    }
  };

  const onTopScroll = () => {
    if (topScrollRef.current && tableContainerRef.current) {
      tableContainerRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleInlineUpdate = useCallback(async (id: string, field: string, value: any) => {
    if (!token) return;
    try {
      await updateLead(token, id, { [field]: value });
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
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowColumnSettings(!showColumnSettings)}
                className="btn-ghost flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                <span className="text-xs">Columnas</span>
              </button>
              
              {showColumnSettings && (
                <div className="absolute top-full right-0 mt-2 z-50 glass-container p-4 min-w-[200px] shadow-2xl animate-fadeIn">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 pb-2 border-b border-white/5">Visualización</p>
                  <div className="space-y-2">
                    {[
                      { id: "name", label: "Nombre" },
                      { id: "status", label: "Estado" },
                      { id: "phone", label: "Teléfono" },
                      { id: "company", label: "Empresa" },
                      { id: "source", label: "Fuente" },
                      { id: "notes", label: "Notas" },
                      { id: "created_at", label: "Fecha" },
                    ].map(col => (
                      <label key={col.id} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={visibleColumns.has(col.id)}
                          onChange={() => toggleColumn(col.id)}
                          className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-0 focus:ring-offset-0"
                        />
                        <span className="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors">{col.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleExportCSV}
              className="btn-ghost flex items-center gap-2 group"
            >
              <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-xs">Exportar CSV</span>
            </button>
          </div>
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

      {/* ── Scroll Slider (User Request) ── */}
      {view === 'table' && (
        <div className="px-8 mb-4 flex items-center gap-6 bg-slate-900/40 backdrop-blur-xl rounded-3xl py-3 border border-white/5 mx-6 shadow-2xl">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/20">
              <LayoutList className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-white uppercase tracking-widest">Vista de Columnas</span>
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Navegación Lateral</span>
            </div>
          </div>
          <div className="flex-1 px-4">
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="0.01"
              value={scrollProgress}
              onChange={handleScrollSync}
              className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
              style={{
                background: `linear-gradient(to right, #3b82f6 ${scrollProgress}%, rgba(255,255,255,0.05) ${scrollProgress}%)`
              }}
            />
          </div>
          <div className="flex items-center gap-3 shrink-0 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-lg border border-white/5">
            <span>{Math.round(scrollProgress)}%</span>
          </div>
        </div>
      )}

      {/* ── View Content ── */}
      {view === 'table' ? (
        <div className="flex flex-col mx-6 gap-2">
          {/* Top Sync Scrollbar */}
          <div 
            ref={topScrollRef}
            onScroll={onTopScroll}
            className="overflow-x-auto overflow-y-hidden h-2 custom-scrollbar opacity-40 hover:opacity-100 transition-opacity"
          >
            <div style={{ width: '1300px', height: '1px' }} />
          </div>

          <div className="glass-container rounded-[1.5rem] overflow-hidden flex flex-col h-[600px]">
            <div 
              ref={tableContainerRef}
              onScroll={onTableScroll}
              className="flex-1 flex flex-col min-h-0 min-w-0 overflow-x-auto custom-scrollbar"
            >
            {/* ── Table Header ── */}
            <div className="flex items-center border-b border-white/5 py-4 bg-slate-900/50 sticky top-0 z-40 backdrop-blur-md min-w-full w-max">
              <div className="w-12 h-full flex items-center justify-center shrink-0 sticky left-0 z-50 bg-[#080e1e] border-r border-white/5 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.5)]">
                <button 
                  onClick={() => {
                    if (selectedIds.size === leads.length) setSelectedIds(new Set());
                    else setSelectedIds(new Set(leads.map(l => l.id)));
                  }}
                  className="text-slate-700 hover:text-slate-500 transition-colors"
                >
                  {selectedIds.size === leads.length && leads.length > 0 ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <Square className="w-4 h-4" />}
                </button>
              </div>
              {visibleColumns.has("name") && <div className="w-[250px] shrink-0 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky left-12 z-50 bg-[#080e1e] border-r border-white/10 shadow-[8px_0_15px_-5px_rgba(0,0,0,0.6)]">Lead / Nombre</div>}
              {visibleColumns.has("status") && <div className="w-[160px] shrink-0 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Estado</div>}
              {visibleColumns.has("phone") && <div className="w-[180px] shrink-0 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Teléfono</div>}
              {visibleColumns.has("company") && <div className="w-[180px] shrink-0 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Empresa</div>}
              {visibleColumns.has("source") && <div className="w-[150px] shrink-0 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fuente</div>}
              {visibleColumns.has("notes") && <div className="w-[300px] shrink-0 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Notas Internas</div>}
              {visibleColumns.has("created_at") && <div className="w-[120px] shrink-0 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ingreso</div>}
              <div className="w-[80px] shrink-0 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Acciones</div>
            </div>

            <div ref={parentRef} className="flex-1 overflow-y-auto custom-scrollbar relative min-w-full w-max">
              <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                {leads.length === 0 ? (
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
                        onToggleSelect={() => toggleSelect(lead.id)}
                        editingCell={editingCell}
                        setEditingCell={setEditingCell}
                        onInlineUpdate={handleInlineUpdate}
                        onSelect={() => handleSelectLead(lead)}
                        onStatusUpdate={handleStatusUpdate}
                        onAction={() => router.push(`/dashboard/leads/${lead.id}`)}
                        visibleColumns={visibleColumns}
                        getAvatarColor={getAvatarColor}
                      />
                    );
                  })
                )}
              </div>
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
      {isMounted && selectedIds.size > 0 && createPortal(
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[999] animate-slideUp">
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
                onClick={handleExportCSV} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-white uppercase hover:bg-white/10 transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Exportar
              </button>
            </div>
          </div>
        </div>,
        document.body
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

const MemoizedLeadRow = memo(({ 
  lead, 
  virtualRow, 
  isSelected, 
  onToggleSelect, 
  editingCell, 
  setEditingCell, 
  onInlineUpdate, 
  onSelect, 
  onStatusUpdate, 
  onAction,
  visibleColumns,
  getAvatarColor
}: any) => {
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
          onClick={(e) => e.stopPropagation()}
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
      onClick={() => onSelect(lead)}
      className={cn(
        "absolute top-0 left-0 w-full flex items-center border-b border-white/[0.02] hover:bg-white/[0.02] transition-all group cursor-pointer",
        isSelected && "bg-blue-500/5 border-blue-500/10"
      )}
      style={{
        height: `${virtualRow.size}px`,
        top: `${virtualRow.start}px`,
        position: 'absolute',
      }}
    >
      <div className="w-12 h-full flex items-center justify-center shrink-0 sticky left-0 z-10 bg-[#0a0f1e] border-r border-white/5 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.5)] group-hover:bg-[#161e31] transition-colors" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={() => onToggleSelect(lead.id)}
          className={cn("w-4 h-4 rounded border border-white/10 flex items-center justify-center transition-all", isSelected ? "bg-blue-600 border-blue-500" : "bg-white/5 group-hover:border-white/20")}
        >
          {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
        </button>
      </div>

      {visibleColumns.has("name") && (
        <div className="w-[250px] shrink-0 flex items-center gap-3 px-4 sticky left-12 z-20 bg-[#0a0f1e] border-r border-white/10 shadow-[8px_0_15px_-5px_rgba(0,0,0,0.6)] group-hover:bg-[#161e31] transition-colors">
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0", getAvatarColor(lead.first_name))}>
            {(lead.first_name || "?").charAt(0)}
          </div>
          <div 
            className="flex-1 cursor-pointer" 
            onDoubleClick={() => handleDoubleClick("name", `${lead.first_name} ${lead.last_name}`)}
          >
            {isEditing("name") ? (
              <input
                autoFocus
                onClick={(e) => e.stopPropagation()}
                className="bg-blue-500/10 border border-blue-500/50 text-white text-xs px-2 py-1 rounded w-full outline-none"
                defaultValue={`${lead.first_name} ${lead.last_name}`}
                onBlur={(e) => {
                  const [first, ...last] = e.target.value.split(" ");
                  onInlineUpdate(lead.id, "first_name", first || "");
                  onInlineUpdate(lead.id, "last_name", last.join(" ") || "");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const [first, ...last] = (e.target as HTMLInputElement).value.split(" ");
                    onInlineUpdate(lead.id, "first_name", first || "");
                    onInlineUpdate(lead.id, "last_name", last.join(" ") || "");
                    setEditingCell(null);
                  } else if (e.key === "Escape") setEditingCell(null);
                }}
              />
            ) : (
              <p className="text-xs font-bold text-white truncate hover:text-blue-400 transition-colors uppercase tracking-tight">
                {lead.first_name} {lead.last_name}
              </p>
            )}
          </div>
        </div>
      )}

      {visibleColumns.has("status") && (
        <div className="w-[160px] shrink-0 px-4" onClick={(e) => e.stopPropagation()}>
          <CustomSelect
            value={lead.status}
            onChange={(val) => onStatusUpdate(lead.id, val)}
            options={STATUS_OPTIONS.map((opt) => ({
              value: opt,
              label: STATUS_LABELS[opt] || opt,
              badgeClass: STATUS_BADGE_MAP[opt],
            }))}
            variant="badge"
            className="w-full"
          />
        </div>
      )}

      {visibleColumns.has("phone") && (
        <div className="w-[180px] shrink-0 px-4 group/phone flex items-center justify-between gap-2">
          <div className="flex-1 overflow-hidden" onDoubleClick={() => handleDoubleClick("phone", lead.phone)}>
            {renderEditable("phone", lead.phone, "Sin teléfono")}
          </div>
          {lead.phone && (
            <a 
              href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} 
              target="_blank" 
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 opacity-0 group-hover/phone:opacity-100 hover:bg-emerald-500/20 transition-all"
              title="WhatsApp Directo"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {visibleColumns.has("company") && (
        <div className="w-[180px] shrink-0 px-4" onDoubleClick={() => handleDoubleClick("company", lead.company)}>
          {renderEditable("company", lead.company, "Sin empresa")}
        </div>
      )}

      {visibleColumns.has("source") && (
        <div className="w-[150px] shrink-0 px-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">
              {lead.first_source_name || "Directo"}
            </p>
          </div>
        </div>
      )}

      {visibleColumns.has("notes") && (
        <div className="w-[300px] shrink-0 px-4 group/notes flex items-center justify-between gap-2">
          <div className="flex-1 overflow-hidden italic" onDoubleClick={() => handleDoubleClick("internal_notes", lead.internal_notes)}>
            {renderEditable("internal_notes", lead.internal_notes, "Añadir nota...")}
          </div>
          <StickyNote className={cn("w-3.5 h-3.5 text-slate-700 transition-colors", lead.internal_notes && "text-blue-500/40")} />
        </div>
      )}

      {visibleColumns.has("created_at") && (
        <div className="w-[120px] shrink-0 px-4 text-right">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
            {new Date(lead.created_at).toLocaleDateString()}
          </p>
        </div>
      )}

      <div className="w-[80px] shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onAction(lead)}
          className="p-2 rounded-xl bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-slate-500 transition-all"
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});
MemoizedLeadRow.displayName = "MemoizedLeadRow";
