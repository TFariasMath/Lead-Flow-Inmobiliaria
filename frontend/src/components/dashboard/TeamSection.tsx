"use client";

import React from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { VendorPerformance } from "@/lib/api";

interface TeamSectionProps {
  performance: VendorPerformance[];
  onToggleAvailability: (vendorId: number) => Promise<void>;
}

export function TeamSection({ performance, onToggleAvailability }: TeamSectionProps) {
  return (
    <div className="glass-card rounded-3xl p-6 border border-white/5">
      <div className="mb-6">
        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">
          Equipo
        </p>
        <h3 className="text-sm font-black text-white uppercase tracking-tight">
          Rendimiento del Equipo
        </h3>
      </div>
      <div className="relative">
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
          {performance.map((v: any, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center justify-between p-3 rounded-2xl transition-all border",
                v.is_next_in_line 
                  ? "bg-orange-500/[0.03] border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.05)]" 
                  : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
              )}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onToggleAvailability(v.vendor_id)}
                  className={cn(
                    "w-8 h-8 rounded-lg border flex items-center justify-center transition-all group/zap",
                    v.is_available 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20" 
                      : "bg-slate-800 border-white/10 text-slate-600 hover:bg-red-500/10 hover:text-red-500"
                  )}
                  title={v.is_available ? "Disponible para Leads" : "Fuera de rotación"}
                >
                  <Zap className={cn("w-3.5 h-3.5", !v.is_available && "opacity-40")} />
                </button>
                
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-[10px] font-black text-white">
                    {v.vendor_name.charAt(0)}
                  </div>
                  {v.is_available && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#050a18] rounded-full" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-black text-white uppercase truncate max-w-[120px]">
                      {v.vendor_name}
                    </p>
                    {v.is_next_in_line && (
                      <span className="text-[7px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-full animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]">
                        SIGUIENTE
                      </span>
                    )}
                    {!v.is_available && (
                      <span className="text-[7px] font-black bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full border border-white/5">
                        OUT
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">
                    {v.total_assigned || 0} leads • <span className={v.is_available ? "text-emerald-500/70" : "text-red-500/70"}>{v.is_available ? "Activo" : "Pausado"}</span>
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p
                  className={cn(
                    "text-sm font-black",
                    (v.conversion_rate || 0) > 30
                      ? "text-emerald-400"
                      : (v.conversion_rate || 0) > 15
                      ? "text-amber-400"
                      : "text-red-400"
                  )}
                >
                  {v.conversion_rate}%
                </p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                  Conversión
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#050a18] to-transparent pointer-events-none opacity-60" />
      </div>
    </div>
  );
}
