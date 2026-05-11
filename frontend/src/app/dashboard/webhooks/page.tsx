"use client";

import React, { useState, useMemo } from "react";
import { 
  Activity, 
  Terminal, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCcw, 
  Eye, 
  Settings2, 
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  ArrowUpRight,
  Code2,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { useData } from "@/hooks/useData";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// --- Tipos ---
interface WebhookLog {
  id: string;
  source_type: string;
  raw_body: any;
  edited_body: any;
  status: "success" | "failed" | "pending";
  error_message: string;
  lead: string | null;
  lead_name: string;
  processed_at: string;
  created_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function WebhooksPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [surgeryLog, setSurgeryLog] = useState<WebhookLog | null>(null);
  const [editedJson, setEditedJson] = useState("");
  const api = useApi();

  // Query Params
  const query = new URLSearchParams();
  query.set("page", page.toString());
  if (statusFilter) query.set("status", statusFilter);
  if (search) query.set("search", search);

  const { data, isLoading, mutate } = useData<PaginatedResponse<WebhookLog>>(`/webhook-logs?${query.toString()}`);

  const logs = data?.results || [];

  // --- Handlers ---
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedIds.length === logs.length) setSelectedIds([]);
    else setSelectedIds(logs.map(l => l.id));
  };

  const handleBulkReprocess = async () => {
    if (selectedIds.length === 0) return;
    try {
      await api.post("/webhook-logs/bulk_reprocess/", { log_ids: selectedIds });
      setSelectedIds([]);
      mutate();
    } catch (err) {
      console.error("Error masivo:", err);
    }
  };

  const openSurgery = (log: WebhookLog) => {
    setSurgeryLog(log);
    setEditedJson(JSON.stringify(log.edited_body || log.raw_body, null, 2));
  };

  const executeSurgery = async () => {
    if (!surgeryLog) return;
    try {
      const body = JSON.parse(editedJson);
      await api.post(`/webhook-logs/${surgeryLog.id}/reprocess/`, { edited_body: body });
      setSurgeryLog(null);
      mutate();
    } catch (err) {
      alert("JSON inválido o error en servidor");
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Terminal className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Consola Técnica</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Webhook <span className="text-slate-500">Logs</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Auditoría y rescate de entrada de datos</p>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkReprocess}
              className="px-4 h-11 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 animate-in zoom-in duration-300"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> Re-procesar ({selectedIds.length})
            </button>
          )}
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => { setStatusFilter(""); setPage(1); }}
              className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", !statusFilter ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300")}
            >Todos ({data?.count || 0})</button>
            <button 
              onClick={() => { setStatusFilter("failed"); setPage(1); }}
              className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", statusFilter === "failed" ? "bg-red-500/20 text-red-500" : "text-slate-500 hover:text-slate-300")}
            >Fallidos</button>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="glass-card rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
        {/* Table Toolbar */}
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between bg-white/[0.01]">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar en logs (body, errores...)" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            <Activity className="w-3.5 h-3.5 text-amber-500" />
            Total: {data?.count || 0} registros
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-6 w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === logs.length && logs.length > 0}
                    onChange={selectAll}
                    className="w-4 h-4 rounded border-white/10 bg-slate-900 checked:bg-amber-500 transition-all cursor-pointer"
                  />
                </th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Origen / Fecha</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Datos Crudos</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="p-8 h-16 bg-white/[0.01]" />
                  </tr>
                ))
              ) : logs.map((log) => (
                <tr key={log.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="p-6">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(log.id)}
                      onChange={() => toggleSelect(log.id)}
                      className="w-4 h-4 rounded border-white/10 bg-slate-900 checked:bg-amber-500 transition-all cursor-pointer"
                    />
                  </td>
                  <td className="p-6">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                      log.status === "success" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                      log.status === "failed" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                      "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    )}>
                      {log.status === "success" ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {log.status}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-white uppercase tracking-wider">{log.source_type}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        {format(new Date(log.created_at), "dd MMM, HH:mm:ss", { locale: es })}
                      </p>
                    </div>
                  </td>
                  <td className="p-6 max-w-md">
                    <div className="relative group/json">
                      <pre className="text-[10px] font-mono text-slate-400 truncate bg-slate-950/50 p-3 rounded-xl border border-white/5 max-h-16 overflow-hidden">
                        {JSON.stringify(log.raw_body)}
                      </pre>
                      {log.error_message && (
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-red-400 font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="truncate">{log.error_message}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center justify-end gap-2">
                      {log.status === "failed" && (
                        <button 
                          onClick={() => openSurgery(log)}
                          className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black transition-all border border-amber-500/20"
                          title="Abrir Quirófano (Editar JSON)"
                        >
                          <Settings2 className="w-4 h-4" />
                        </button>
                      )}
                      {log.lead && (
                        <a 
                          href={`/dashboard/leads?id=${log.lead}`}
                          className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all border border-white/5"
                          title="Ver Lead Generado"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
            Página {page} de {Math.ceil((data?.count || 0) / 10)}
          </p>
          <div className="flex gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-xl bg-white/5 text-slate-400 disabled:opacity-20 hover:bg-white/10 transition-all border border-white/5"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              disabled={!data?.next}
              onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-xl bg-white/5 text-slate-400 disabled:opacity-20 hover:bg-white/10 transition-all border border-white/5"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL QUIRÓFANO --- */}
      {surgeryLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-4xl rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Code2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Modo Quirófano</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Editando Log #{surgeryLog.id.slice(0, 8)}</p>
                </div>
              </div>
              <button 
                onClick={() => setSurgeryLog(null)}
                className="p-3 rounded-2xl bg-white/5 text-slate-500 hover:bg-white/10 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto space-y-6">
              {surgeryLog.error_message && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-4">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Error Detectado</p>
                    <p className="text-sm text-red-200/80 leading-relaxed font-mono">{surgeryLog.error_message}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Payload JSON (Editable)</label>
                <textarea 
                  value={editedJson}
                  onChange={(e) => setEditedJson(e.target.value)}
                  className="w-full h-80 bg-slate-950 border border-white/10 rounded-2xl p-6 font-mono text-sm text-amber-500/80 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all leading-relaxed"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
              <button 
                onClick={() => setSurgeryLog(null)}
                className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all"
              >
                Cancelar Cirugía
              </button>
              <button 
                onClick={executeSurgery}
                className="px-8 h-14 rounded-2xl bg-amber-500 text-black text-[12px] font-black uppercase tracking-[0.1em] flex items-center gap-3 hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber-500/20"
              >
                <RefreshCcw className="w-4 h-4" /> Ejecutar Cirugía
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
