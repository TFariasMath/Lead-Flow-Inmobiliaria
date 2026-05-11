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
              className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onToggleAvailability(v.vendor_id)}
                  className={cn(
                    "w-8 h-8 rounded-lg border flex items-center justify-center transition-all",
                    v.is_available 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20" 
                      : "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                  )}
                  title={v.is_available ? "Disponible para Leads" : "No disponible"}
                >
                  <Zap className={cn("w-3.5 h-3.5", !v.is_available && "opacity-30")} />
                </button>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-[10px] font-black text-white">
                  {v.vendor_name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase">
                    {v.vendor_name}
                  </p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">
                    {v.total_assigned || 0} leads
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
