"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  History,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Clock,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Lead, HistoryEntry, getLead, getLeadHistory, updateLead } from "@/lib/api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface LeadDetailPanelProps {
  leadId: string | null;
  token: string | null;
  onClose: () => void;
  onUpdate: () => void;
}

const STATUS_OPTIONS = [
  "nuevo",
  "contactado",
  "en_calificacion",
  "propuesta_enviada",
  "cierre_ganado",
  "cierre_perdido",
];

const STATUS_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  en_calificacion: "En Calificación",
  propuesta_enviada: "Propuesta Enviada",
  cierre_ganado: "Cierre Ganado",
  cierre_perdido: "Cierre Perdido",
};

const STATUS_COLORS: Record<string, string> = {
  nuevo: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  contactado: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  en_calificacion: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  propuesta_enviada: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  cierre_ganado: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  cierre_perdido: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

export default function LeadDetailPanel({ leadId, token, onClose, onUpdate }: LeadDetailPanelProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (leadId && token) {
      setLoading(true);
      Promise.all([getLead(token, leadId), getLeadHistory(token, leadId)])
        .then(([leadData, historyData]) => {
          setLead(leadData);
          setHistory(historyData);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLead(null);
      setHistory([]);
    }
  }, [leadId, token]);

  const handleStatusChange = async (newStatus: string) => {
    if (!token || !lead) return;
    setUpdatingStatus(true);
    try {
      await updateLead(token, lead.id, { status: newStatus });
      setLead({ ...lead, status: newStatus });
      onUpdate();
      const newHistory = await getLeadHistory(token, lead.id);
      setHistory(newHistory);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!leadId) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/70 backdrop-blur-md z-[100] transition-opacity duration-300",
          leadId ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed top-3 right-3 bottom-3 w-full max-w-xl bg-[#060c1a] border border-white/[0.06] rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.6)] z-[101] transform transition-transform duration-500 ease-out flex flex-col overflow-hidden",
          leadId ? "translate-x-0" : "translate-x-[110%]"
        )}
      >
        {/* Top accent */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent z-10" />

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-slate-600 font-bold uppercase tracking-[0.2em] text-[10px]">
              Cargando Lead...
            </p>
          </div>
        ) : lead ? (
          <>
            {/* Header */}
            <div className="p-8 border-b border-white/[0.04] relative">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-xl hover:bg-white/5 text-slate-600 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl font-black text-white shadow-xl shadow-blue-600/20">
                  {lead.first_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">
                    {lead.first_name} {lead.last_name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                      {lead.company || "Persona Natural"}
                    </span>
                    <span className="text-slate-800">•</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Score {lead.score}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Pipeline */}
              <div>
                <p className="section-label text-slate-600 mb-3 ml-1">
                  Pipeline
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleStatusChange(opt)}
                      disabled={updatingStatus}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                        lead.status === opt
                          ? STATUS_COLORS[opt]
                          : "text-slate-700 bg-transparent border-white/[0.04] hover:border-white/10 hover:text-slate-400"
                      )}
                    >
                      {STATUS_LABELS[opt]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
              {/* Contact Info */}
              <section>
                <h3 className="section-label text-slate-600 mb-5 flex items-center gap-2">
                  <User className="w-3 h-3" /> Información de Contacto
                </h3>
                <div className="grid grid-cols-1 gap-3 stagger-children">
                  <InfoItem icon={Mail} label="Email" value={lead.original_email} />
                  <InfoItem icon={Phone} label="Teléfono" value={lead.phone || "—"} />
                  <InfoItem icon={Building2} label="Fuente" value={lead.first_source_name} />
                  <InfoItem
                    icon={Calendar}
                    label="Captado el"
                    value={format(new Date(lead.created_at), "PPP", { locale: es })}
                  />
                </div>
              </section>

              {/* History Timeline */}
              <section>
                <h3 className="section-label text-slate-600 mb-5 flex items-center gap-2">
                  <History className="w-3 h-3" /> Historial de Actividad
                </h3>
                <div className="space-y-4 relative before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[1.5px] before:bg-white/[0.04]">
                  {history.length > 0 ? (
                    history.map((entry, idx) => (
                      <div key={idx} className="relative pl-9">
                        <div className="absolute left-0 top-2 w-[23px] h-[23px] rounded-full bg-[#0a1020] border border-white/[0.06] flex items-center justify-center z-10">
                          {entry.history_type === "+" ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Clock className="w-3 h-3 text-blue-500" />
                          )}
                        </div>
                        <div className="bg-white/[0.015] rounded-xl p-4 border border-white/[0.04] hover:bg-white/[0.025] transition-all">
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">
                            {format(new Date(entry.history_date), "dd MMM, HH:mm", {
                              locale: es,
                            })}
                          </p>
                          <div className="space-y-1.5">
                            {Object.entries(entry.changes).map(([field, change], i) => (
                              <p key={i} className="text-sm text-slate-400">
                                <span className="font-bold text-white capitalize">
                                  {field.replace("_", " ")}
                                </span>{" "}
                                de{" "}
                                <span className="line-through opacity-40">
                                  {change.old || "nada"}
                                </span>{" "}
                                <ArrowRight className="w-3 h-3 inline text-slate-600 mx-1" />
                                <span className="text-blue-400 font-bold">{change.new}</span>
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-600 italic pl-9">
                      No hay actividad registrada.
                    </p>
                  )}
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/[0.04]">
              <button
                onClick={onClose}
                className="btn-ghost w-full py-3 flex items-center justify-center gap-2"
              >
                Cerrar Panel
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 group p-3 rounded-xl hover:bg-white/[0.02] transition-all -mx-3">
      <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.04] flex items-center justify-center text-slate-600 group-hover:text-blue-400 group-hover:bg-blue-500/8 group-hover:border-blue-500/15 transition-all">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}
