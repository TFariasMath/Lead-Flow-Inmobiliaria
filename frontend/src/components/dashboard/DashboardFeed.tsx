"use client";

import React from "react";
import { BarChart3, Clock, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Lead } from "@/lib/api";

interface DashboardFeedProps {
  stats: any;
  recentLeads: Lead[];
}

export function DashboardFeed({ stats, recentLeads }: DashboardFeedProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-12 gap-5">
      {/* Source Ranking */}
      <div className="col-span-12 lg:col-span-6 glass-card rounded-3xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-1">
              Adquisición
            </p>
            <h3 className="text-sm font-black text-white uppercase">Ranking de Fuentes</h3>
          </div>
          <BarChart3 className="w-4 h-4 text-slate-600" />
        </div>
        <div className="space-y-3">
          {stats.leads_by_source?.slice(0, 5).map((s: any, i: number) => {
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            return (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center text-xs">
                    {medal || <span className="text-[10px] font-black text-slate-600">#{i + 1}</span>}
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase">{s.name}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">{s.count} leads</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-blue-400">{s.acquisition_share}%</p>
                  <div className="w-20 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.min(s.acquisition_share, 100)}%`,
                        background: `linear-gradient(90deg, ${s.acquisition_share > 30 ? "#3b82f6" : "#6366f1"}, ${s.acquisition_share > 30 ? "#60a5fa" : "#818cf8"})`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="col-span-12 lg:col-span-6 glass-card rounded-3xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-1">
              Tiempo Real
            </p>
            <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Actividad Reciente
            </h3>
          </div>
          <button
            onClick={() => router.push("/dashboard/leads")}
            className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline"
          >
            Ver Todo
          </button>
        </div>
        <div className="relative">
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
            {recentLeads.map((lead, idx) => (
              <div
                key={lead.id}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.03] transition-all cursor-pointer group border border-transparent hover:border-white/5"
                onClick={() => router.push(`/dashboard/leads?selected=${lead.id}`)}
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-[10px] font-bold text-white group-hover:bg-blue-600 group-hover:border-blue-500/30 transition-all">
                  {lead.first_name.charAt(0)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-black text-white truncate uppercase">
                    {lead.first_name} {lead.last_name}
                  </p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase truncate">
                    {lead.first_source_name} •{" "}
                    {new Date(lead.created_at).toLocaleDateString("es", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                <ArrowUpRight className="w-3 h-3 text-slate-700 group-hover:text-blue-500 transition-colors" />
              </div>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#050a18] to-transparent pointer-events-none opacity-60" />
        </div>
      </div>
    </div>
  );
}
