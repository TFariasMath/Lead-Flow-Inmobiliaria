"use client";

import React, { useState } from "react";
import { useHistory } from "@/hooks/useHistory";
import { Clock, ChevronDown, User, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function HistoryDock() {
  const { history } = useHistory();
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  if (history.length === 0) return null;

  return (
    <div 
      className="fixed bottom-6 right-6 z-[999] group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Trigger Area (Invisible corner trigger) */}
      <div className={cn(
        "absolute bottom-0 right-0 w-20 h-20 bg-orange-500/5 rounded-full blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-orange-500/10 cursor-pointer",
        isHovered && "opacity-0"
      )} />
      
      {/* Visual Indicator (Small floating pill) */}
      {!isHovered && (
        <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-orange-500/20 border border-orange-500/40 animate-pulse flex items-center justify-center">
          <Clock className="w-1.5 h-1.5 text-orange-400" />
        </div>
      )}

      {/* The Dock */}
      <div className={cn(
        "transition-all duration-700 ease-out transform origin-bottom-right",
        isHovered 
          ? "opacity-100 translate-y-0 translate-x-0 scale-100" 
          : "opacity-0 translate-y-10 translate-x-10 scale-50 pointer-events-none"
      )}>
        <div className="bg-slate-900/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-2 ring-1 ring-white/5">
          <div className="pl-4 pr-3 py-2 border-r border-white/5 flex flex-col items-start gap-0.5">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Recientes</span>
            </div>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Últimos Leads</p>
          </div>

          <div className="flex items-center gap-1.5 p-1">
            {history.slice(0, 3).map((lead) => (
              <button
                key={lead.id}
                onClick={() => router.push(`/dashboard/leads?id=${lead.id}`)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl hover:bg-white/5 transition-all group/item border border-transparent hover:border-white/5 bg-white/[0.02]"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-600/20 to-amber-600/20 border border-orange-500/20 flex items-center justify-center text-[11px] font-black text-orange-400 group-hover/item:scale-110 group-hover/item:shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all duration-500">
                  {(lead.first_name || "?").charAt(0)}
                </div>
                <div className="text-left">
                  <p className="text-[12px] font-bold text-white uppercase tracking-tight truncate max-w-[120px]">
                    {lead.first_name} {lead.last_name}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full shadow-[0_0_5px_rgba(var(--rgb),0.5)]",
                      lead.status === "nuevo" ? "bg-orange-400" : "bg-emerald-400"
                    )} />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      Score {lead.score}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button 
            className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-white transition-colors bg-white/5 rounded-xl ml-2"
            onClick={() => setIsHovered(false)}
          >
            <ChevronDown className="w-4 h-4 rotate-45" />
          </button>
        </div>
      </div>
    </div>
  );
}
