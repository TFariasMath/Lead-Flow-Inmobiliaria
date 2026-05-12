"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Globe, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface TrafficChartProps {
  data: any[];
}

export function TrafficChart({ data }: TrafficChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="glass-card rounded-3xl p-6 border border-white/5 bg-gradient-to-br from-cyan-600/[0.02] to-transparent">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-1">
            Engagement & Tráfico
          </p>
          <h2 className="text-xl font-black text-white">Rendimiento de Landings</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
            <span className="text-[10px] font-black text-slate-300 uppercase">Visitas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
            <span className="text-[10px] font-black text-slate-300 uppercase">Leads</span>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tickFormatter={(str) => format(parseISO(str), "dd MMM", { locale: es })}
              tick={{ fill: "#64748b", fontSize: 9, fontWeight: 900 }}
              minTickGap={30}
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl shadow-2xl ring-1 ring-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">
                        {format(parseISO(label), "EEEE, dd 'de' MMMM", { locale: es })}
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-8">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-cyan-400" />
                            <span className="text-[10px] font-black text-white uppercase">Visitas</span>
                          </div>
                          <span className="text-sm font-black text-cyan-400">{payload[0].value}</span>
                        </div>
                        <div className="flex items-center justify-between gap-8">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            <span className="text-[10px] font-black text-white uppercase">Leads</span>
                          </div>
                          <span className="text-sm font-black text-orange-400">{payload[1]?.value || 0}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="visits"
              stroke="#06b6d4"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorVisits)"
              animationDuration={2000}
            />
            <Area
              type="monotone"
              dataKey="leads"
              stroke="#f97316"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorLeads)"
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
