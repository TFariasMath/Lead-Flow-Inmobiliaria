/**
 * Lead Flow - Leads List Page
 * ===========================
 * Tabla principal de gestión comercial con filtros por estado, fuente y búsqueda.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getLeads, getSources, type Lead, type Source } from "@/lib/api";
import { Search, Filter, ChevronLeft, ChevronRight, Eye, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
// ...
};

export default function LeadsListPage() {
// ...
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            {totalCount} contacto{totalCount !== 1 ? "s" : ""} en el sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-white text-sm font-medium hover:bg-[var(--color-surface-hover)] transition-all"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            onClick={() => router.push("/dashboard/leads/new")}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white text-sm font-medium hover:shadow-lg hover:shadow-[var(--color-primary)]/25 transition-all"
          >
            + Nuevo Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            id="lead-search"
            type="text"
            placeholder="Buscar por email, nombre o teléfono..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-white placeholder-[var(--color-text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--color-text-muted)]" />
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
          >
            <option value="">Todos los estados</option>
            <option value="nuevo">Nuevo</option>
            <option value="contactado">Contactado</option>
            <option value="en_calificacion">En Calificación</option>
            <option value="propuesta_enviada">Propuesta Enviada</option>
            <option value="cierre_ganado">Cierre Ganado</option>
            <option value="cierre_perdido">Cierre Perdido</option>
          </select>
          <select
            id="filter-source"
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
          >
            <option value="">Todas las fuentes</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Contacto
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Score
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Estado
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Fuente
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-[var(--color-text-muted)]"
                  >
                    No se encontraron leads
                  </td>
                </tr>
              ) : (
                leads.map((lead, i) => (
                  <tr
                    key={lead.id}
                    className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                    style={{ animationDelay: `${i * 30}ms` }}
                    onClick={() =>
                      router.push(`/dashboard/leads/${lead.id}`)
                    }
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)]/30 to-[var(--color-accent)]/30 flex items-center justify-center text-xs font-bold text-[var(--color-primary-hover)]">
                          {(lead.first_name || lead.original_email)
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-white">
                          {lead.first_name} {lead.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 rounded text-xs font-bold",
                          lead.score >= 80
                            ? "bg-emerald-500/15 text-emerald-400"
                            : lead.score >= 50
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-red-500/15 text-red-400"
                        )}
                      >
                        {lead.score}/100
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[var(--color-text-muted)]">
                      {lead.original_email}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[var(--color-text-muted)]">
                      {lead.phone || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "inline-flex px-2.5 py-1 rounded-full text-xs font-medium",
                          STATUS_BADGES[lead.status]?.color ||
                            "bg-gray-500/15 text-gray-400"
                        )}
                      >
                        {STATUS_BADGES[lead.status]?.label || lead.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[var(--color-text-muted)]">
                      {lead.first_source_name || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[var(--color-text-muted)]">
                      {lead.assigned_to_name || "Sin asignar"}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/leads/${lead.id}`);
                        }}
                        className="p-1.5 rounded-md hover:bg-[var(--color-primary)]/15 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-text-muted)]">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
