import React from "react";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { STATUS_OPTIONS, STATUS_LABELS, STATUS_COLORS, THEME_COLORS } from "./constants";
import { Lead, HistoryEntry } from "@/lib/api";

interface StatusPipelineProps {
  lead: Lead;
  history: HistoryEntry[];
  updatingStatus: boolean;
  onStatusChange: (status: string) => void;
}

export const StatusPipeline: React.FC<StatusPipelineProps> = ({ 
  lead, 
  history, 
  updatingStatus, 
  onStatusChange 
}) => {
  const lastStatusChange = history.find(h => h.changes.status && h.changes.status.new === lead.status);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4 px-1">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pipeline Comercial</p>
        {lastStatusChange && (
          <span className="flex items-center gap-1 text-[9px] font-black text-amber-500/80 uppercase tracking-widest bg-amber-500/5 px-2 py-0.5 rounded-full border border-amber-500/10">
            <Clock className="w-2.5 h-2.5" />
            {format(new Date(lastStatusChange.history_date), "dd MMM", { locale: es })}
          </span>
        )}
      </div>
      
      <div className="flex items-center w-full h-12 gap-0.5 overflow-hidden">
        {STATUS_OPTIONS.map((opt, idx) => {
          const isCompleted = STATUS_OPTIONS.indexOf(lead.status) > idx;
          const isActive = lead.status === opt;
          const themeColor = THEME_COLORS[opt];
          
          let clipPath = "polygon(0% 0%, 95% 0%, 100% 50%, 95% 100%, 0% 100%, 5% 50%)";
          if (idx === 0) clipPath = "polygon(0% 0%, 95% 0%, 100% 50%, 95% 100%, 0% 100%)";
          if (idx === STATUS_OPTIONS.length - 1) clipPath = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 5% 50%)";

          return (
            <button
              key={opt}
              onClick={() => onStatusChange(opt)}
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
                "text-[6px] md:text-[8px] font-black uppercase tracking-tighter text-center leading-tight px-1 transition-transform",
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
  );
};
