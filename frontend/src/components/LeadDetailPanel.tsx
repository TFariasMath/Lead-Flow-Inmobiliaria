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
  ChevronRight,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  MapPin,
  Copy,
  ExternalLink,
  Search,
} from "lucide-react";
import { Lead, HistoryEntry, getLead, getLeadHistory, updateLead, getProperties, Property } from "@/lib/api";
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
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showPropertySelect, setShowPropertySelect] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (leadId && token) {
      setLoading(true);
      Promise.all([
        getLead(token, leadId), 
        getLeadHistory(token, leadId),
        getProperties(token)
      ])
        .then(([leadData, historyData, propertiesData]) => {
          setLead(leadData);
          setHistory(historyData);
          // Handle paginated or direct array response
          const props = Array.isArray(propertiesData) ? propertiesData : (propertiesData as any).results || [];
          setAllProperties(props);
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

  const toggleProperty = async (propertyId: number) => {
    if (!token || !lead) return;
    const currentProps = lead.interested_properties || [];
    const newProps = currentProps.includes(propertyId)
      ? currentProps.filter(id => id !== propertyId)
      : [...currentProps, propertyId];
    
    try {
      await updateLead(token, lead.id, { interested_properties: newProps });
      setLead({ ...lead, interested_properties: newProps });
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  if (!leadId) return null;

  const interestedProps = allProperties.filter(p => lead?.interested_properties?.includes(p.id));

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-black/70 backdrop-blur-md z-[100] transition-opacity duration-300",
          leadId ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "fixed top-3 right-3 bottom-3 w-full max-w-xl bg-[#060c1a] border border-white/[0.06] rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.6)] z-[101] transform transition-transform duration-500 ease-out flex flex-col overflow-hidden",
          leadId ? "translate-x-0" : "translate-x-[110%]"
        )}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent z-10" />

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-slate-600 font-bold uppercase tracking-[0.2em] text-[10px]">Cargando Lead...</p>
          </div>
        ) : lead ? (
          <>
            <div className="p-8 border-b border-white/[0.04] relative">
              <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-xl hover:bg-white/5 text-slate-600 hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl font-black text-white shadow-xl shadow-blue-600/20">
                  {lead.first_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">{lead.first_name} {lead.last_name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{lead.company || "Persona Natural"}</span>
                    <span className="text-slate-800">•</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Score {lead.score}</span>
                    {(() => {
                      const lastStatusChange = history.find(h => h.changes.status && h.changes.status.new === lead.status);
                      if (lastStatusChange) {
                        return (
                          <>
                            <span className="text-slate-800">•</span>
                            <span className="flex items-center gap-1 text-[9px] font-black text-amber-500/80 uppercase tracking-widest bg-amber-500/5 px-2 py-0.5 rounded-full border border-amber-500/10">
                              <Clock className="w-2.5 h-2.5" />
                              {format(new Date(lastStatusChange.history_date), "dd MMM", { locale: es })}
                            </span>
                          </>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-4 px-1">
                   <p className="section-label text-slate-500">Pipeline Comercial</p>
                   {(() => {
                      const lastStatusChange = history.find(h => h.changes.status && h.changes.status.new === lead.status);
                      return lastStatusChange && (
                        <span className="flex items-center gap-1 text-[9px] font-black text-amber-500/80 uppercase tracking-widest bg-amber-500/5 px-2 py-0.5 rounded-full border border-amber-500/10">
                          <Clock className="w-2.5 h-2.5" />
                          {format(new Date(lastStatusChange.history_date), "dd MMM", { locale: es })}
                        </span>
                      );
                   })()}
                </div>
                
                <div className="flex items-center w-full h-12 gap-0.5 overflow-hidden">
                  {STATUS_OPTIONS.map((opt, idx) => {
                    const isCompleted = STATUS_OPTIONS.indexOf(lead.status) > idx;
                    const isActive = lead.status === opt;
                    
                    // Specific color mapping for the pipeline blocks
                    const themeColors: Record<string, string> = {
                      nuevo: "bg-blue-500",
                      contactado: "bg-cyan-500",
                      en_calificacion: "bg-amber-500",
                      propuesta_enviada: "bg-violet-500",
                      cierre_ganado: "bg-emerald-500",
                      cierre_perdido: "bg-red-500",
                    };

                    const themeColor = themeColors[opt];
                    
                    // Clip path logic for chevrons
                    let clipPath = "polygon(0% 0%, 95% 0%, 100% 50%, 95% 100%, 0% 100%, 5% 50%)";
                    if (idx === 0) clipPath = "polygon(0% 0%, 95% 0%, 100% 50%, 95% 100%, 0% 100%)";
                    if (idx === STATUS_OPTIONS.length - 1) clipPath = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 5% 50%)";

                    return (
                      <button
                        key={opt}
                        onClick={() => handleStatusChange(opt)}
                        disabled={updatingStatus}
                        style={{ clipPath }}
                        className={cn(
                          "flex-1 h-full flex items-center justify-center transition-all duration-500 relative group",
                          isCompleted ? `${themeColor} opacity-40 hover:opacity-100 text-white` :
                          isActive ? `${themeColor} text-white shadow-[0_0_30px_rgba(0,0,0,0.5)] z-20` :
                          "bg-white/[0.03] text-slate-500 hover:bg-white/[0.08]"
                        )}
                      >
                        <span className={cn(
                          "text-[6px] @[30rem]:text-[8px] font-black uppercase tracking-tighter text-center leading-tight px-1 transition-transform",
                          isActive && "scale-110"
                        )}>
                          {opt === "cierre_ganado" ? "GANADO" : 
                           opt === "cierre_perdido" ? "PERDIDO" : 
                           opt === "en_calificacion" ? "CALIFIC." :
                           opt === "propuesta_enviada" ? "PROPUESTA" :
                           STATUS_LABELS[opt].split(' ')[0]}
                        </span>
                        
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        )}
                        
                        {isActive && (
                           <div className="absolute bottom-1 w-1 h-1 rounded-full bg-white animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between mt-3 px-1">
                   <p className="text-[9px] font-bold text-slate-600 uppercase">Prospección</p>
                   <div className="flex flex-col items-center">
                     <p className={cn(
                       "text-[10px] font-black uppercase tracking-[0.1em]",
                       STATUS_COLORS[lead.status].split(' ')[0]
                     )}>
                       {STATUS_LABELS[lead.status]}
                     </p>
                   </div>
                   <p className="text-[9px] font-bold text-slate-600 uppercase">Resultado</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
              {/* Proyectos de Interés Section */}
              <section className="bg-blue-500/[0.02] border border-blue-500/10 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="section-label text-blue-400 flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> Proyectos de Interés
                  </h3>
                  <button 
                    onClick={() => setShowPropertySelect(!showPropertySelect)}
                    className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {showPropertySelect && (
                  <div className="mb-6 space-y-3">
                    <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                       <input 
                         type="text" 
                         placeholder="Buscar por nombre o ubicación..." 
                         className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
                         autoFocus
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                       />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-2">
                      {allProperties
                        .filter(p => 
                          p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.location.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map(prop => (
                        <button
                          key={prop.id}
                          onClick={() => toggleProperty(prop.id)}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl border text-left transition-all group",
                            lead.interested_properties?.includes(prop.id)
                              ? "bg-blue-600/20 border-blue-500/30 text-white"
                              : "bg-white/[0.02] border-white/[0.05] text-slate-400 hover:border-white/20"
                          )}
                        >
                          <div>
                            <p className="text-xs font-bold">{prop.name}</p>
                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">{prop.location}</p>
                          </div>
                          {lead.interested_properties?.includes(prop.id) && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
                        </button>
                      ))}
                      {allProperties.length > 0 && allProperties.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                        <p className="text-center py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">No se encontraron proyectos</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {interestedProps.length > 0 ? (
                    interestedProps.map(prop => (
                      <div key={prop.id} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl group hover:border-blue-500/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                             <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-white">{prop.name}</p>
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{prop.location}</p>
                          </div>
                        </div>
                        <button onClick={() => toggleProperty(prop.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-red-400 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center border-2 border-dashed border-white/[0.04] rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Sin proyectos asignados</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-6 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />
                
                <h3 className="section-label text-slate-500 mb-6 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-blue-400" /> 
                  Información de Contacto
                </h3>
                
                <div className="grid grid-cols-1 @[30rem]:grid-cols-2 gap-4">
                  <InfoCard icon={Mail} label="Email Principal" value={lead.original_email} action="mailto" />
                  <InfoCard icon={Phone} label="Teléfono" value={lead.phone || "—"} action="tel" />
                  <InfoCard icon={Building2} label="Fuente del Lead" value={lead.first_source_name} />
                  <InfoCard icon={Calendar} label="Fecha de Captura" value={format(new Date(lead.created_at), "dd MMM, yyyy", { locale: es })} />
                </div>
              </section>

              <section>
                <h3 className="section-label text-slate-600 mb-5 flex items-center gap-2"><History className="w-3 h-3" /> Historial de Actividad</h3>
                <div className="space-y-4 relative before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[1.5px] before:bg-white/[0.04]">
                  {history.length > 0 ? (
                    history.map((entry, idx) => (
                      <div key={idx} className="relative pl-9">
                        <div className="absolute left-0 top-2 w-[23px] h-[23px] rounded-full bg-[#0a1020] border border-white/[0.06] flex items-center justify-center z-10">
                          {entry.history_type === "+" ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3 text-blue-500" />}
                        </div>
                        <div className="bg-white/[0.015] rounded-xl p-4 border border-white/[0.04]">
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">{format(new Date(entry.history_date), "dd MMM, HH:mm", { locale: es })}</p>
                          <div className="space-y-1.5">
                            {Object.entries(entry.changes).map(([field, change], i) => (
                              <p key={i} className="text-sm text-slate-400">
                                <span className="font-bold text-white capitalize">{field.replace("_", " ")}</span> de <span className="line-through opacity-40">{change.old || "nada"}</span> <ArrowRight className="w-3 h-3 inline text-slate-600 mx-1" /> <span className="text-blue-400 font-bold">{change.new}</span>
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : <p className="text-sm text-slate-600 italic pl-9">No hay actividad registrada.</p>}
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-white/[0.04]">
              <button onClick={onClose} className="btn-ghost w-full py-3 flex items-center justify-center gap-2">Cerrar Panel <ChevronRight className="w-3 h-3" /></button>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}

function InfoCard({ icon: Icon, label, value, action }: { icon: any; label: string; value: string; action?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10 transition-all group relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Icon className="w-4 h-4" />
          </div>
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
        </div>
        
        {value && value !== "—" && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={handleCopy}
              className="p-1.5 rounded-md hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
              title="Copiar"
            >
              {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
            {action && (
              <a 
                href={`${action}:${value}`}
                className="p-1.5 rounded-md hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                title="Abrir"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>
      <p className="text-sm font-bold text-white truncate pr-8">{value}</p>
    </div>
  );
}
