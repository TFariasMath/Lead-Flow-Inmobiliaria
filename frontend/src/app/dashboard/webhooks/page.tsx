/**
 * Lead Flow - Webhook Logs Page
 * =============================
 * Vista técnica para inspeccionar, editar y re-procesar webhooks fallidos.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getWebhookLogs,
  reprocessWebhook,
  type WebhookLog,
} from "@/lib/api";
import {
  Webhook,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_ICON: Record<string, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  failed: <XCircle className="w-4 h-4 text-red-400" />,
  pending: <Clock className="w-4 h-4 text-amber-400" />,
};

export default function WebhookLogsPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editJson, setEditJson] = useState("");
  const [reprocessing, setReprocessing] = useState<string | null>(null);
  const [reprocessError, setReprocessError] = useState("");

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = statusFilter ? `status=${statusFilter}` : "";
      const data = await getWebhookLogs(token, params);
      setLogs(data.results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExpand = (log: WebhookLog) => {
    if (expandedId === log.id) {
      setExpandedId(null);
    } else {
      setExpandedId(log.id);
      setEditJson(JSON.stringify(log.raw_body, null, 2));
      setReprocessError("");
    }
  };

  const handleReprocess = async (logId: string) => {
    if (!token) return;
    setReprocessing(logId);
    setReprocessError("");
    try {
      const parsed = JSON.parse(editJson);
      await reprocessWebhook(token, logId, parsed);
      fetchLogs();
      setExpandedId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al re-procesar";
      setReprocessError(msg);
    } finally {
      setReprocessing(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-white">Webhook Logs</h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          Inspecciona, edita y re-procesa webhooks fallidos
        </p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Webhook className="w-4 h-4 text-[var(--color-text-muted)]" />
        <select
          id="webhook-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
        >
          <option value="">Todos los estados</option>
          <option value="success">Exitosos</option>
          <option value="failed">Fallidos</option>
          <option value="pending">Pendientes</option>
        </select>
        <button
          onClick={fetchLogs}
          className="p-2.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Log List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-text-muted)]">
            No se encontraron logs de webhook
          </div>
        ) : (
          logs.map((log, i) => (
            <div
              key={log.id}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden animate-slideIn"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Header */}
              <button
                onClick={() => handleExpand(log)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[var(--color-surface-hover)] transition-colors text-left"
              >
                {STATUS_ICON[log.status]}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {log.source_type}
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        log.status === "success" &&
                          "bg-emerald-500/15 text-emerald-400",
                        log.status === "failed" &&
                          "bg-red-500/15 text-red-400",
                        log.status === "pending" &&
                          "bg-amber-500/15 text-amber-400"
                      )}
                    >
                      {log.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {new Date(log.created_at).toLocaleString("es")}
                    {log.lead_name && ` · Lead: ${log.lead_name}`}
                  </p>
                </div>
                {log.error_message && (
                  <span className="text-xs text-red-400 max-w-xs truncate">
                    {log.error_message}
                  </span>
                )}
                {expandedId === log.id ? (
                  <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
                )}
              </button>

              {/* Expanded Content */}
              {expandedId === log.id && (
                <div className="border-t border-[var(--color-border)] px-5 py-4 space-y-4">
                  {log.error_message && (
                    <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                      <strong>Error:</strong> {log.error_message}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                      Payload JSON{" "}
                      {log.status === "failed" && "(editable para re-procesamiento)"}
                    </label>
                    <textarea
                      value={editJson}
                      onChange={(e) => setEditJson(e.target.value)}
                      readOnly={log.status !== "failed"}
                      rows={10}
                      className={cn(
                        "w-full px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-sm font-mono text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 resize-y",
                        log.status !== "failed" && "opacity-60 cursor-not-allowed"
                      )}
                    />
                  </div>

                  {log.status === "failed" && (
                    <>
                      {reprocessError && (
                        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                          {reprocessError}
                        </div>
                      )}
                      <button
                        onClick={() => handleReprocess(log.id)}
                        disabled={reprocessing === log.id}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {reprocessing === log.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Re-procesando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Corregir y Re-procesar
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
