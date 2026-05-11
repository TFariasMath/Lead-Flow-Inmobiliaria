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
              Volumen de Leads
            </p>
            <h2 className="text-xl font-black text-white">Distribución por Estado</h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-black uppercase">Live</span>
          </div>
        </div>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 9, fontWeight: 800 }}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 10 }} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.02)" }}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
                }}
                itemStyle={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase" }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} onClick={handleBarClick} className="cursor-pointer">
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 transition-opacity" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conversion Flow Graph */}
      <div className="col-span-12 lg:col-span-5 glass-card rounded-3xl p-6 border border-white/5">
        <div className="mb-4">
          <p className="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em] mb-1">
            Flujo de Conversión
          </p>
          <h2 className="text-xl font-black text-white">Pipeline en Vivo</h2>
        </div>
        <FunnelChart data={funnelData} />
      </div>
    </div>
  );
}
