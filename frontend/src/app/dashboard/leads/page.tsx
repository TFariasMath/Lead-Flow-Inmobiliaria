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
    leadsData, selectedLeadId, setSelectedLeadId,
    dashboardStats, mutateStats
  } = logic;

  // --- DERIVED METRICS ---
  const stats = dashboardStats || {};
  const leadsByStatus = stats.leads_by_status || {};
  const totalLeadsGlobal = stats.total_leads || 0;
  const wonCount = leadsByStatus["Cierre Ganado"] || 0;
  const staleCountGlobal = stats.stale_leads_count || 0;

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
    <div className="space-y-6 animate-fadeIn pb-10 px-2">
      
      {/* ── Metric Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          icon={Activity} 
          label="Total Leads" 
          value={dashboardStats ? totalLeadsGlobal : "..."} 
          color="#6366f1" 
          onClick={() => { setStatusFilter(""); setTodayFilter(false); setStaleFilter(false); setPage(1); }}
        />
        <MetricCard 
          icon={Zap} 
          label="Nuevos Hoy" 
          value={leadsData?.count && todayFilter ? leadsData.count : "..."} 
          color="#06b6d4" 
          trend="+12.5%" 
          active={todayFilter}
          onClick={() => { setTodayFilter(!todayFilter); setStatusFilter(""); setStaleFilter(false); setPage(1); }}
        />
        <MetricCard 
          icon={AlertTriangle} 
          label="Estancados" 
          value={dashboardStats ? staleCountGlobal : "..."} 
          color="#ef4444" 
          active={staleFilter}
          onClick={() => { setStaleFilter(!staleFilter); setStatusFilter(""); setTodayFilter(false); setPage(1); }}
        />
        <MetricCard 
          icon={ShieldCheck} 
          label="Cierres Ganados" 
          value={dashboardStats ? wonCount : "..."} 
          color="#10b981" 
          trend="Pro"
          active={statusFilter === "ganado"}
          onClick={() => { setStatusFilter(statusFilter === "ganado" ? "" : "ganado"); setTodayFilter(false); setStaleFilter(false); setPage(1); }}
        />
      </div>

      {/* ── Header Area ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-0">
          <h1 className="text-2xl font-black text-white tracking-tighter">
            Lead <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Forge</span>
          </h1>
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.4em] flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
            Control Operativo
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
           <div className="flex items-center bg-slate-900/60 backdrop-blur-xl p-1 rounded-xl border border-white/5 shadow-2xl">
            <button 
              onClick={() => setView('table')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all duration-500 flex items-center gap-2", 
                view === 'table' 
                  ? "bg-blue-600 text-white shadow-lg" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">Lista</span>
            </button>
            <button 
              onClick={() => setView('kanban')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all duration-500 flex items-center gap-2", 
                view === 'kanban' 
                  ? "bg-blue-600 text-white shadow-lg" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">Pipeline</span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="h-9 px-3.5 rounded-xl bg-white/5 border border-white/5 text-white hover:bg-white/10 transition-all flex items-center gap-2 group"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold">Exportar</span>
          </button>

          <button 
            onClick={() => router.push("/dashboard/leads/new")} 
            className="h-9 px-4 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-orange-500/10"
          >
            <Plus className="w-4 h-4" />
            <span className="text-[10px] font-bold">Nuevo Lead</span>
          </button>
        </div>
      </div>

      {/* ── Advanced Filter Console ── */}
      <div className="p-4 bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-3xl space-y-4 shadow-2xl">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative group">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-3.5 h-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                placeholder="Buscar prospecto..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full h-10 pl-10 pr-4 bg-slate-950/40 border border-white/5 rounded-xl text-[11px] text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
             <CustomSelect
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val); setPage(1); }}
              options={[
                { value: "", label: "Cualquier Estado" },
                ...STATUS_OPTIONS.map(opt => ({ 
                  value: opt, 
                  label: STATUS_LABELS[opt] || opt,
                  badgeClass: STATUS_BADGE_MAP[opt]
                }))
              ]}
              className="min-w-[160px]"
              icon={<Activity className="w-3.5 h-3.5 text-blue-400" />}
            />

            <CustomSelect
              value={sourceFilter}
              onChange={(val) => { setSourceFilter(val); setPage(1); }}
              options={[
                { value: "", label: "Todas las Fuentes" },
                ...(sourcesData?.results || []).map(s => ({ value: s.id.toString(), label: s.name }))
              ]}
              className="min-w-[160px]"
              icon={<Zap className="w-3.5 h-3.5 text-orange-400" />}
            />

            <CustomSelect
              value={userFilter}
              onChange={(val) => { setUserFilter(val); setPage(1); }}
              options={[
                { value: "", label: "Vendedores" },
                ...(usersData || []).map(u => ({ value: u.id.toString(), label: `${u.first_name || u.username}` }))
              ]}
              className="min-w-[160px]"
              icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
            />

            <button
              onClick={() => { setStaleFilter(!staleFilter); setPage(1); }}
              className={cn(
                "h-10 px-4 rounded-xl border flex items-center justify-center gap-2.5 transition-all duration-500",
                staleFilter 
                  ? "bg-red-500/10 border-red-500/40 text-red-500 shadow-lg shadow-red-500/20" 
                  : "bg-slate-950/40 border-white/5 text-slate-500 hover:border-white/10"
              )}
            >
              <AlertTriangle className={cn("w-3.5 h-3.5", staleFilter ? "animate-pulse" : "opacity-40")} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Estancados</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── View Content ── */}
      {/* ── View Content ── */}
      {view === 'table' ? (
        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col h-[650px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]">
          <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-x-auto custom-scrollbar">
            {/* ── Table Header ── */}
            <div className="flex items-center border-b border-white/[0.04] py-5 bg-[#080e1e]/80 sticky top-0 z-40 backdrop-blur-xl min-w-full w-max">
              <div className="w-12 h-full flex items-center justify-center shrink-0 sticky left-0 z-50 bg-[#080e1e] border-r border-white/5">
                <button onClick={toggleSelectAll} className="text-slate-600 hover:text-blue-400 transition-colors">
                  {selectedIds.size === leads.length && leads.length > 0 ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <Square className="w-4 h-4" />}
                </button>
              </div>
              {visibleColumns.has("name") && <div className="w-[280px] shrink-0 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] sticky left-12 z-50 bg-[#080e1e] border-r border-white/10">Prospecto / Calidad</div>}
              {visibleColumns.has("status") && <div className="w-[160px] shrink-0 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Estado Pipeline</div>}
              {visibleColumns.has("email") && <div className="w-[220px] shrink-0 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Identidad Digital</div>}
              {visibleColumns.has("phone") && <div className="w-[180px] shrink-0 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Contacto</div>}
              <div className="w-[100px] shrink-0 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Acciones</div>
            </div>

            <div ref={parentRef} className="flex-1 overflow-y-auto custom-scrollbar relative min-w-full w-max">
              <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                {loading && leads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-40 gap-6">
                    <div className="relative">
                      <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                      <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">Sincronizando Leads...</p>
                  </div>
                ) : leads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-40">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <Activity className="w-8 h-8 text-slate-700" />
                    </div>
                    <p className="text-sm font-bold text-slate-500">No se encontraron leads con estos criterios</p>
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
            <div className="flex items-center justify-between px-10 py-5 border-t border-white/[0.04] bg-[#080e1e]/60 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em]">Mostrando {leads.length} de {totalCount} Oportunidades</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1} 
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 disabled:opacity-20 transition-all hover:bg-white/10 hover:border-white/10 text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center px-4 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-[11px] font-black text-white">{page} <span className="text-slate-600 mx-1">/</span> {totalPages}</span>
                </div>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                  disabled={page === totalPages} 
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 disabled:opacity-20 transition-all hover:bg-white/10 hover:border-white/10 text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
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
