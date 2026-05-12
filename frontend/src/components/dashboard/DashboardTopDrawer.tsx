"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { KPIGrid } from "./KPIGrid";
import { ChevronDown } from "lucide-react";

interface DashboardTopDrawerProps {
  stats: any;
}

import { DashboardDock } from "@/components/ui/DashboardDock";

export function DashboardTopDrawer({ stats }: DashboardTopDrawerProps) {
  return (
    <DashboardDock position="top">
      <div className="p-6 pt-10">
         <div className="max-w-[1400px] mx-auto relative">
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] mb-6 text-center opacity-80 animate-pulse">Telemetría Operacional KPI</p>
            
            <KPIGrid stats={stats} />
         </div>
      </div>
    </DashboardDock>
  );
}
