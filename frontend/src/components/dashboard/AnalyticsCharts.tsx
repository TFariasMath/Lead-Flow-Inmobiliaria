"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import FunnelChart from "@/components/FunnelChart";

const STATUS_COLORS: Record<string, string> = {
  Nuevo: "#3b82f6",
  Contactado: "#0ea5e9",
  "En Calificación": "#f59e0b",
  "Propuesta Enviada": "#8b5cf6",
  "Cierre Ganado": "#10b981",
  "Cierre Perdido": "#64748b",
};

const NAME_TO_SLUG: Record<string, string> = {
  Nuevo: "nuevo",
  Contactado: "contactado",
  "En Calificación": "en_calificacion",
  "Propuesta Enviada": "propuesta_enviada",
  "Cierre Ganado": "cierre_ganado",
  "Cierre Perdido": "cierre_perdido",
};

const FUNNEL_COLORS = [
  "#3b82f6",
  "#0ea5e9",
  "#f59e0b",
  "#8b5cf6",
  "#10b981",
];

interface AnalyticsChartsProps {
  stats: any;
}

export function AnalyticsCharts({ stats }: AnalyticsChartsProps) {
  const router = useRouter();

  const statusData = Object.entries(stats.leads_by_status || {}).map(
    ([name, value]) => ({
      name,
      value,
      fill: STATUS_COLORS[name] || "#3b82f6",
    })
  );

  const funnelData = (stats.funnel_data || []).map(
    (step: any, i: number) => ({
      ...step,
      color: FUNNEL_COLORS[i] || "#3b82f6",
    })
  );

  const handleBarClick = (data: any) => {
    const slug = NAME_TO_SLUG[data.name];
    if (slug) router.push(`/dashboard/leads?status=${slug}`);
  };

  return (
    <div className="grid grid-cols-12 gap-5">
      {/* Volume Chart */}
      <div className="col-span-12 lg:col-span-7 glass-card rounded-3xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">
              Volumen Operativo
            </p>
            <h2 className="text-xl font-black text-white">Estatus del Pipeline</h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-black uppercase">Live</span>
          </div>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} barSize={20} margin={{ top: 30, right: 0, left: 0, bottom: 0 }}>
              <defs>
                {statusData.map((entry, i) => (
                  <linearGradient key={`grad-${i}`} id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={entry.fill} stopOpacity={1} />
                    <stop offset="60%" stopColor={entry.fill} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={entry.fill} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>
              
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 800 }}
                dy={15}
              />
              
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.03)", radius: 10 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 p-3 rounded-xl shadow-2xl ring-1 ring-white/5">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{data.name}</p>
                        <p className="text-base font-black text-white">{data.value} <span className="text-[9px] text-slate-500 font-bold ml-1">Leads</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              
              <Bar 
                dataKey="value" 
                radius={[10, 10, 10, 10]} 
                onClick={handleBarClick} 
                className="cursor-pointer"
              >
                {statusData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#barGrad-${index})`}
                    stroke={entry.fill}
                    strokeWidth={1}
                    strokeOpacity={0.3}
                    className="hover:brightness-125 transition-all duration-500" 
                  />
                ))}
                {/* Etiqueta de valor elegante sobre la barra */}
                <LabelList 
                  dataKey="value" 
                  position="top" 
                  content={({ x, y, width, value }: any) => (
                    <text 
                      x={x + width / 2} 
                      y={y - 12} 
                      fill="white" 
                      textAnchor="middle" 
                      fontSize="11" 
                      fontWeight="900"
                      className="tracking-tighter"
                    >
                      {value}
                    </text>
                  )}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conversion Flow Graph */}
      <div className="col-span-12 lg:col-span-5 glass-card rounded-3xl p-6 border border-white/5">
        <div className="mb-4">
          <p className="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em] mb-1">
            Análisis de Progresión
          </p>
          <h2 className="text-xl font-black text-white">Flujo de Conversión</h2>
        </div>
        <FunnelChart data={funnelData} />
      </div>
    </div>
  );
}
