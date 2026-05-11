/**
 * Lead Flow - Leads List Page (Premium v3 + Performance Elite)
 * ==========================================================
 * Refactored for better maintainability and performance.
 */

"use client";

import { useRef, Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Activity, 
  Target, 
  Zap,
  MousePointer2,
  AlertTriangle,
  Download,
  LayoutList,
  Columns3 as Kanban,
  CheckSquare,
  Square,
  ShieldCheck
} from "lucide-react";

import KanbanView from "@/components/leads/KanbanView";
import CustomSelect from "@/components/CustomSelect";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";

// New Components & Hooks
import { MetricCard } from "@/components/leads/MetricCard";
import { LeadRow } from "@/components/leads/LeadRow";
import { BulkActionsBar } from "@/components/leads/BulkActionsBar";
import { useLeadsLogic } from "@/hooks/useLeadsLogic";
import { 
  STATUS_OPTIONS, 
  STATUS_LABELS, 
  STATUS_BADGE_MAP 
} from "@/constants/leads";

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
  const logic = useLeadsLogic();
  const {
    token, router, page, setPage, search, setSearch,
    statusFilter, setStatusFilter, staleFilter, setStaleFilter,
    sourceFilter, setSourceFilter, userFilter, setUserFilter,
    todayFilter, setTodayFilter, editingCell, setEditingCell,
    view, setView, selectedIds, setSelectedIds, isMounted,
    leads, totalCount, loading, mutateLeads, usersData, sourcesData,
    handleStatusUpdate, handleInlineUpdate, handleSelectLead,
    handleBulkUpdate, toggleSelectAll, toggleSelect, handleExportCSV,
    leadsData, selectedLeadId, setSelectedLeadId
  } = logic;

  const [visibleColumns] = useState<Set<string>>(new Set(["name", "status", "phone", "email"]));

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-emerald-500', 'bg-amber-500', 'bg-cyan-500'
    ];
    const charCode = (name || "?").charCodeAt(0);
    return colors[charCode % colors.length];
  };

  // VIRTUALIZACIÓN
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: leads.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  });

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* ── Metric Strip ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard 
          icon={Activity} 
          label="Contactos Totales" 
          value={totalCount} 
          color="#3b82f6" 
          onClick={() => { setStatusFilter(""); setTodayFilter(false); setStaleFilter(false); setPage(1); }}
        />
        <MetricCard 
          icon={Zap} 
          label="Nuevos Hoy" 
          value={leadsData?.count && todayFilter ? leadsData.count : "..."} 
          color="#0ea5e9" 
          trend="+12%" 
          active={todayFilter}
          onClick={() => { setTodayFilter(!todayFilter); setStatusFilter(""); setStaleFilter(false); setPage(1); }}
        />
        <MetricCard 
          icon={Target} 
          label="Sin Atender" 
          value={statusFilter === "nuevo" ? totalCount : "..."} 
          color="#f59e0b" 
          active={statusFilter === "nuevo"}
          onClick={() => { setStatusFilter(statusFilter === "nuevo" ? "" : "nuevo"); setTodayFilter(false); setStaleFilter(false); setPage(1); }}
        />
        <MetricCard icon={MousePointer2} label="CTR Promedio" value="4.2%" color="#10b981" />
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
            <button
              onClick={handleExportCSV}
              className="btn-ghost flex items-center gap-2 group"
            >
              <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-xs">Exportar CSV</span>
            </button>
          </div>
          <button onClick={() => router.push("/dashboard/leads/new")} className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center hover:bg-orange-500 transition-all shadow-[0_0_20px_rgba(234,88,12,0.3)]">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="space-y-3">
        {/* Search Row */}
        <div className="input-icon-wrapper group">
          <Search className="w-4 h-4 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por email, nombre o teléfono..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-premium input-premium-icon h-12"
          />
        </div>

        {/* Action Selectors Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Status Filter */}
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
            icon={<Activity className="w-4 h-4" />}
          />

          {/* Source Filter */}
          <CustomSelect
            value={sourceFilter}
            onChange={(val) => { setSourceFilter(val); setPage(1); }}
            options={[
              { value: "", label: "Todas las Fuentes" },
              ...(sourcesData?.results || []).map(s => ({ value: s.id.toString(), label: s.name }))
            ]}
            icon={<Zap className="w-4 h-4 text-orange-500" />}
          />

          {/* User/Vendor Filter */}
          <CustomSelect
            value={userFilter}
            onChange={(val) => { setUserFilter(val); setPage(1); }}
            options={[
              { value: "", label: "Todos los Vendedores" },
              ...(usersData || []).map(u => ({ value: u.id.toString(), label: `${u.first_name || u.username}` }))
            ]}
            icon={<ShieldCheck className="w-4 h-4 text-emerald-500" />}
          />

          {/* Stale Filter Button */}
          <button
            onClick={() => { setStaleFilter(!staleFilter); setPage(1); }}
            className={cn(
              "h-12 px-4 rounded-xl border flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
              staleFilter 
                ? "bg-red-500/20 border-red-500/40 text-red-500 shadow-lg shadow-red-500/10" 
                : "bg-slate-900/50 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10"
            )}
          >
            <AlertTriangle className={cn("w-3.5 h-3.5", staleFilter ? "animate-pulse" : "opacity-40")} />
            Leads Estancados
          </button>
        </div>
      </div>

      {/* ── View Content ── */}
      {view === 'table' ? (
        <div className="glass-container rounded-[1.5rem] overflow-hidden flex flex-col h-[600px] mx-6">
          <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-x-auto custom-scrollbar">
            {/* ── Table Header ── */}
            <div className="flex items-center border-b border-white/5 py-4 bg-slate-900/50 sticky top-0 z-40 backdrop-blur-md min-w-full w-max">
              <div className="w-12 h-full flex items-center justify-center shrink-0 sticky left-0 z-50 bg-[#080e1e] border-r border-white/5 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.5)]">
                <button onClick={toggleSelectAll} className="text-slate-700 hover:text-slate-500 transition-colors">
                  {selectedIds.size === leads.length && leads.length > 0 ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <Square className="w-4 h-4" />}
                </button>
              </div>
              {visibleColumns.has("name") && <div className="w-[250px] shrink-0 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky left-12 z-50 bg-[#080e1e] border-r border-white/10 shadow-[8px_0_15px_-5px_rgba(0,0,0,0.6)]">Lead / Nombre</div>}
              {visibleColumns.has("status") && <div className="w-[160px] shrink-0 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Estado</div>}
              {visibleColumns.has("email") && <div className="w-[220px] shrink-0 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Correo Electrónico</div>}
              {visibleColumns.has("phone") && <div className="w-[180px] shrink-0 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Teléfono</div>}
              <div className="w-[100px] shrink-0 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Acciones</div>
            </div>

            <div ref={parentRef} className="flex-1 overflow-y-auto custom-scrollbar relative min-w-full w-max">
              <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
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
                      <LeadRow
                        key={lead.id}
                        lead={lead}
                        virtualRow={virtualRow}
                        isSelected={selectedIds.has(lead.id)}
                        onToggleSelect={toggleSelect}
                        editingCell={editingCell}
                        setEditingCell={setEditingCell}
                        onInlineUpdate={handleInlineUpdate}
                        onSelect={handleSelectLead}
                        onStatusUpdate={handleStatusUpdate}
                        onAction={(l) => router.push(`/dashboard/leads/${l.id}`)}
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

      <BulkActionsBar 
        selectedIds={selectedIds}
        onClear={() => setSelectedIds(new Set())}
        onBulkUpdate={handleBulkUpdate}
        usersData={usersData}
        onExport={handleExportCSV}
        isMounted={isMounted}
      />
    </div>
  );
}
