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
      
      <div className="relative w-full h-10 flex items-center gap-1 px-1 bg-slate-900/40 rounded-xl border border-white/5 overflow-hidden">
        {STATUS_OPTIONS.map((opt, idx) => {
          const isCompleted = STATUS_OPTIONS.indexOf(lead.status) > idx;
          const isActive = lead.status === opt;
          const themeColor = THEME_COLORS[opt];
          
          return (
            <button
              key={opt}
              onClick={() => onStatusChange(opt)}
              disabled={updatingStatus}
              className={cn(
                "relative flex-1 h-full flex items-center justify-center transition-all duration-500 group overflow-hidden",
                isCompleted ? "opacity-40" : isActive ? "z-20" : "opacity-20 hover:opacity-40"
              )}
            >
              {/* Active State Background & Glow */}
              {isActive && (
                <>
                  <div className={cn("absolute inset-0 opacity-20 blur-md", themeColor)} />
                  <div className={cn("absolute inset-0 border-t border-b border-white/20", themeColor)} />
                  <div className="absolute inset-y-0 left-0 w-[2px] bg-white/40 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                </>
              )}

              <span className={cn(
                "text-[7px] md:text-[9px] font-black uppercase tracking-widest text-center leading-tight px-1 transition-all duration-500 relative z-10",
                isActive ? "text-white scale-110" : "text-slate-400 group-hover:text-white"
              )}>
                {STATUS_LABELS[opt].split(' ')[0]}
              </span>

              {/* Connecting Dot/Line */}
              <div className={cn(
                "absolute bottom-1 w-1 h-1 rounded-full transition-all duration-700",
                isActive ? "bg-white shadow-[0_0_8px_white] scale-125" : 
                isCompleted ? "bg-white/20" : "bg-white/5"
              )} />
            </button>
          );
        })}
        
        {/* Animated Scanning Beam (Surgical Effect) */}
        <div className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent -translate-x-full animate-scan pointer-events-none" />
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
