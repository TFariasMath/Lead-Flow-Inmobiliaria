/**
 * Lead Flow - Funnel Chart
 * =======================
 * Visualización tipo embudo para el pipeline de ventas.
 */

"use client";

import React from "react";

interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

interface FunnelChartProps {
  data: FunnelStep[];
}

export default function FunnelChart({ data }: FunnelChartProps) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex flex-col gap-2 w-full">
      {data.map((step, i) => {
        const nextStep = data[i + 1];
        const width = (step.value / maxVal) * 100;
        const nextWidth = nextStep ? (nextStep.value / maxVal) * 100 : width;
        
        // Calcular tasa de caída respecto al paso anterior
        const dropRate = i > 0 && data[i-1].value > 0 
          ? ((data[i-1].value - step.value) / data[i-1].value * 100).toFixed(0)
          : null;

        return (
          <div key={step.label} className="relative group">
            {/* Etiqueta de caída (Drop-off) */}
            {dropRate && parseInt(dropRate) > 0 && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="bg-red-500/10 text-red-500 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-red-500/20 uppercase tracking-tighter">
                  -{dropRate}% fuga
                </span>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div 
                  className="h-10 relative overflow-hidden transition-all duration-500"
                  style={{ 
                    width: `${width}%`,
                    backgroundColor: `${step.color}20`,
                    borderLeft: `4px solid ${step.color}`,
                    clipPath: `polygon(0% 0%, 100% 10%, 100% 90%, 0% 100%)`
                  }}
                >
                  <div className="absolute inset-0 flex items-center px-4 justify-between">
                    <span className="text-[10px] font-black text-white uppercase truncate pr-2">{step.label}</span>
                    <span className="text-xs font-black text-white">{step.value}</span>
                  </div>
                </div>
              </div>
              
              {/* Tasa de conversión de este paso */}
              <div className="w-12 text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase">
                  {i === 0 ? '100%' : `${((step.value / data[0].value) * 100).toFixed(0)}%`}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
