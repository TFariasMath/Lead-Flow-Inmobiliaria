import React from "react";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Lead, HistoryEntry } from "@/lib/api";

interface LeadHeaderProps {
  lead: Lead;
  history: HistoryEntry[];
}

export const LeadHeader: React.FC<LeadHeaderProps> = ({ lead, history }) => {
  const lastStatusChange = history.find(h => h.changes.status && h.changes.status.new === lead.status);

  return (
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
          {lastStatusChange && (
            <>
              <span className="text-slate-800">•</span>
              <span className="flex items-center gap-1 text-[9px] font-black text-amber-500/80 uppercase tracking-widest bg-amber-500/5 px-2 py-0.5 rounded-full border border-amber-500/10">
                <Clock className="w-2.5 h-2.5" />
                {format(new Date(lastStatusChange.history_date), "dd MMM", { locale: es })}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
