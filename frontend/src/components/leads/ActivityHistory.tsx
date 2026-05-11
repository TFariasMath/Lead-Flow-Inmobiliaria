import React from "react";
import { Clock, CheckCircle2, ArrowRight, History } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { HistoryEntry } from "@/lib/api";

interface ActivityHistoryProps {
  history: HistoryEntry[];
}

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({ history }) => {
  return (
    <section>
      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-5 flex items-center gap-2">
        <History className="w-3 h-3 text-blue-500" /> Historial de Actividad
      </h3>
      <div className="space-y-4 relative before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[1.5px] before:bg-white/[0.04]">
        {history.length > 0 ? (
          history.map((entry, idx) => (
            <div key={idx} className="relative pl-9">
              <div className="absolute left-0 top-2 w-[23px] h-[23px] rounded-full bg-[#0a1020] border border-white/[0.06] flex items-center justify-center z-10">
                {entry.history_type === "+" ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3 text-blue-500" />}
              </div>
              <div className="bg-white/[0.015] rounded-xl p-4 border border-white/[0.04]">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">
                  {format(new Date(entry.history_date), "dd MMM, HH:mm", { locale: es })}
                </p>
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
        ) : (
          <p className="text-sm text-slate-600 italic pl-9">No hay actividad registrada.</p>
        )}
      </div>
    </section>
  );
};
