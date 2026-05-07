/**
 * Lead Flow - Lead Detail Page
 * ============================
 * Ficha del lead con timeline de interacciones, historial de cambios,
 * y formulario de edición (Formik + Yup).
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getLead,
  updateLead,
  getLeadHistory,
  getUsers,
  type Lead,
  type HistoryEntry,
  type User,
} from "@/lib/api";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  ArrowLeft,
  Clock,
  Edit3,
  History,
  Globe,
  Save,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "nuevo", label: "Nuevo" },
  { value: "contactado", label: "Contactado" },
  { value: "en_calificacion", label: "En Calificación" },
  { value: "propuesta_enviada", label: "Propuesta Enviada" },
  { value: "cierre_ganado", label: "Cierre Ganado" },
  { value: "cierre_perdido", label: "Cierre Perdido" },
];

const validationSchema = Yup.object({
  contact_email: Yup.string().email("Email inválido"),
  first_name: Yup.string().max(150),
  last_name: Yup.string().max(150),
  phone: Yup.string().matches(
    /^[\d\s\-\+\(\)]*$/,
    "Formato de teléfono inválido"
  ),
});

interface LeadFormValues {
  contact_email: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  company: string;
  status: string;
  assigned_to: string;
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const router = useRouter();

  const [lead, setLead] = useState<Lead | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "history">(
    "timeline"
  );

  const fetchData = useCallback(async () => {
    if (!token || !id) return;
    try {
      const [leadData, historyData, usersData] = await Promise.all([
        getLead(token, id),
        getLeadHistory(token, id),
        getUsers(token),
      ]);
      setLead(leadData);
      setHistory(historyData);
      setUsers(usersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (values: LeadFormValues) => {
    const payload: Partial<Lead> = {
      ...values,
      assigned_to: values.assigned_to ? Number(values.assigned_to) : null,
    };
    if (!token || !id) return;
    try {
      const updated = await updateLead(token, id, payload);
      setLead(updated);
      setEditing(false);
      // Refresh history
      const h = await getLeadHistory(token, id);
      setHistory(h);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back Button */}
      <button
        onClick={() => router.push("/dashboard/leads")}
        className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Leads
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {lead.first_name} {lead.last_name || lead.original_email}
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1 text-sm">
            ID: {lead.id} · Creado:{" "}
            {new Date(lead.created_at).toLocaleDateString("es")}
          </p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            editing
              ? "bg-[var(--color-danger)]/15 text-[var(--color-danger)]"
              : "bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
          )}
        >
          {editing ? (
            <>
              <X className="w-4 h-4" /> Cancelar
            </>
          ) : (
            <>
              <Edit3 className="w-4 h-4" /> Editar
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Info / Edit Form */}
        <div className="lg:col-span-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
          {editing ? (
            <Formik
              initialValues={{
                contact_email: lead.contact_email || "",
                first_name: lead.first_name || "",
                last_name: lead.last_name || "",
                phone: lead.phone || "",
                address: lead.address || "",
                company: lead.company || "",
                status: lead.status,
                assigned_to: lead.assigned_to?.toString() || "",
              }}
              validationSchema={validationSchema}
              onSubmit={handleSave}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  <h3 className="text-sm font-semibold text-white mb-3">
                    Editar Lead
                  </h3>

                  {/* original_email inmutable */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">
                      Email Original (inmutable)
                    </label>
                    <input
                      type="text"
                      value={lead.original_email}
                      disabled
                      className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-muted)] opacity-60 cursor-not-allowed"
                    />
                  </div>

                  <FormField name="contact_email" label="Email de Contacto" type="email" />
                  <FormField name="first_name" label="Nombre" />
                  <FormField name="last_name" label="Apellido" />
                  <FormField name="phone" label="Teléfono" />
                  <FormField name="address" label="Dirección" />
                  <FormField name="company" label="Empresa" />

                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">
                      Estado
                    </label>
                    <Field
                      as="select"
                      name="status"
                      className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Field>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">
                      Vendedor Asignado
                    </label>
                    {user?.isStaff ? (
                      <Field
                        as="select"
                        name="assigned_to"
                        className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                      >
                        <option value="">Sin asignar</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.first_name} {u.last_name} ({u.username})
                          </option>
                        ))}
                      </Field>
                    ) : (
                      <input
                        type="text"
                        value="Asignado a ti"
                        disabled
                        className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-muted)] opacity-60 cursor-not-allowed"
                      />
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </Form>
              )}
            </Formik>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">
                Información del Lead
              </h3>
              <InfoRow label="Email Original" value={lead.original_email} />
              <InfoRow
                label="Email de Contacto"
                value={lead.contact_email || "—"}
              />
              <InfoRow label="Nombre" value={lead.first_name || "—"} />
              <InfoRow label="Apellido" value={lead.last_name || "—"} />
              <InfoRow label="Teléfono" value={lead.phone || "—"} />
              <InfoRow label="Dirección" value={lead.address || "—"} />
              <InfoRow label="Empresa" value={lead.company || "—"} />
              <InfoRow
                label="Estado"
                value={
                  STATUS_OPTIONS.find((s) => s.value === lead.status)?.label ||
                  lead.status
                }
              />
              <InfoRow
                label="Vendedor"
                value={lead.assigned_to_name || "Sin asignar"}
              />
              <InfoRow
                label="Fuente"
                value={lead.first_source_name || "—"}
              />
              {lead.campaign_name && (
                <>
                  <div className="h-px bg-[var(--color-border)] my-4" />
                  <h4 className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wider mb-2">Tracking</h4>
                  <InfoRow label="Campaña" value={lead.campaign_name} />
                  {lead.utm_source && <InfoRow label="UTM Source" value={lead.utm_source} />}
                  {lead.utm_medium && <InfoRow label="UTM Medium" value={lead.utm_medium} />}
                </>
              )}
            </div>
          )}
        </div>

        {/* Timeline / History */}
        <div className="lg:col-span-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-[var(--color-bg)] p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab("timeline")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === "timeline"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text-muted)] hover:text-white"
              )}
            >
              <Globe className="w-4 h-4" />
              Timeline
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === "history"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text-muted)] hover:text-white"
              )}
            >
              <History className="w-4 h-4" />
              Historial de Cambios
            </button>
          </div>

          {activeTab === "timeline" ? (
            <div className="space-y-0">
              {lead.interactions && lead.interactions.length > 0 ? (
                lead.interactions.map((interaction, i) => (
                  <div key={interaction.id} className="flex gap-4 animate-slideIn" style={{ animationDelay: `${i * 80}ms` }}>
                    {/* Timeline Line */}
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-[var(--color-primary)] ring-4 ring-[var(--color-primary)]/20 mt-1" />
                      {i < (lead.interactions?.length || 0) - 1 && (
                        <div className="w-0.5 flex-1 bg-[var(--color-border)] my-1" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pb-6 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-white">
                          Interacción via {interaction.source_name}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(interaction.created_at).toLocaleString("es")}
                        </span>
                      </div>
                      {Object.keys(interaction.raw_payload).length > 0 && (
                        <pre className="mt-2 p-3 bg-[var(--color-bg)] rounded-lg text-xs text-[var(--color-text-muted)] overflow-x-auto border border-[var(--color-border)]">
                          {JSON.stringify(interaction.raw_payload, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[var(--color-text-muted)] text-sm">
                  No hay interacciones registradas aún.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {history.length > 0 ? (
                history.map((entry, i) => (
                  <div
                    key={entry.history_id}
                    className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-4 animate-slideIn"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <History className="w-4 h-4 text-[var(--color-accent)]" />
                      <span className="font-medium text-white">
                        {entry.history_type}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        por {entry.history_user || "Sistema"} ·{" "}
                        {new Date(entry.history_date).toLocaleString("es")}
                      </span>
                    </div>
                    {Object.keys(entry.changes).length > 0 ? (
                      <div className="space-y-1">
                        {Object.entries(entry.changes).map(([field, delta]) => (
                          <div key={field} className="text-xs">
                            <span className="text-[var(--color-text-muted)]">
                              {field}:
                            </span>{" "}
                            <span className="text-red-400 line-through">
                              {delta.old || "(vacío)"}
                            </span>{" "}
                            →{" "}
                            <span className="text-emerald-400">
                              {delta.new || "(vacío)"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Registro creado
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-[var(--color-text-muted)] text-sm">
                  No hay historial de cambios.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormField({
  name,
  label,
  type = "text",
}: {
  name: string;
  label: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">
        {label}
      </label>
      <Field
        type={type}
        name={name}
        className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
      />
      <ErrorMessage
        name={name}
        component="p"
        className="text-xs text-[var(--color-danger)] mt-1"
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="text-sm text-white mt-0.5">{value}</p>
    </div>
  );
}
