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
  Clock
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

export default function LeadDetailPanel({ leadId, token, onClose, onUpdate }: LeadDetailPanelProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (leadId && token) {
      setLoading(true);
      Promise.all([
        getLead(token, leadId),
        getLeadHistory(token, leadId)
      ])
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
      // Refresh history
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
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300",
          leadId ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div 
        className={cn(
          "fixed top-4 right-4 bottom-4 w-full max-w-xl bg-[#0b1120] border border-white/10 rounded-[2.5rem] shadow-2xl z-[101] transform transition-transform duration-500 ease-out flex flex-col overflow-hidden",
          leadId ? "translate-x-0" : "translate-x-[110%]"
        )}
      >
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando Lead...</p>
          </div>
        ) : lead ? (
          <>
            {/* Header */}
            <div className="p-8 border-b border-white/5 bg-white/[0.02] relative">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-blue-600/20">
                  {lead.first_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">{lead.first_name} {lead.last_name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">{lead.company || "Persona Natural"}</span>
                    <span className="text-slate-700">•</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Score {lead.score}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Estado Operativo</p>
                  <select 
                    value={lead.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updatingStatus}
                    className="w-full h-11 bg-slate-900 border border-white/10 rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 appearance-none cursor-pointer hover:border-white/20 transition-all"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{STATUS_LABELS[opt]}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                   <a 
                    href={`/dashboard/leads/${lead.id}`}
                    className="h-11 px-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                    title="Ver página completa"
                   >
                     <ExternalLink className="w-4 h-4" />
                   </a>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
              {/* Contact Info */}
              <section>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <User className="w-3 h-3" /> Información de Contacto
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <InfoItem icon={Mail} label="Email" value={lead.original_email} />
                  <InfoItem icon={Phone} label="Teléfono" value={lead.phone || "—"} />
                  <InfoItem icon={Building2} label="Fuente" value={lead.first_source_name} />
                  <InfoItem icon={Calendar} label="Captado el" value={format(new Date(lead.created_at), "PPP", { locale: es })} />
                </div>
              </section>

              {/* History Timeline */}
              <section>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <History className="w-3 h-3" /> Historial de Actividad
                </h3>
                <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
                  {history.length > 0 ? history.map((entry, idx) => (
                    <div key={idx} className="relative pl-10">
                      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center z-10">
                        {entry.history_type === "+" ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3 text-blue-500" />}
                      </div>
                      <div className="glass-card rounded-2xl p-4 border border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                          {format(new Date(entry.history_date), "dd MMM, HH:mm", { locale: es })}
                        </p>
                        <div className="space-y-2">
                          {Object.entries(entry.changes).map(([field, change], i) => (
                            <p key={i} className="text-sm text-slate-300">
                              <span className="font-bold text-white capitalize">{field.replace('_', ' ')}</span> de <span className="line-through opacity-50">{change.old || "nada"}</span> a <span className="text-blue-400 font-bold">{change.new}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500 italic pl-10">No hay actividad registrada recientemente.</p>
                  )}
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-white/5 bg-white/[0.01]">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all"
              >
                Cerrar Panel
              </button>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-blue-500 group-hover:bg-blue-600/10 transition-all">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}
