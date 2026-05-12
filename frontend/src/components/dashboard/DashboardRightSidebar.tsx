"use client";

import React from "react";
import { 
  Zap, 
  Globe, 
  Target, 
  Users,
  LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardView = "OVERVIEW" | "TRAFFIC" | "PIPELINE" | "TEAM";

interface DashboardRightSidebarProps {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
}

interface NavIconProps {
  view: DashboardView;
  activeView: DashboardView;
  icon: any;
  label: string;
  onClick: (view: DashboardView) => void;
}

import { DashboardDock } from "@/components/ui/DashboardDock";

export function DashboardRightSidebar({ activeView, onViewChange }: DashboardRightSidebarProps) {
  return (
    <DashboardDock position="right" className="py-7 flex flex-col items-center">
      {/* Navigation Icons - Compacted at top like the left one */}
      <nav className="flex flex-col gap-6 w-full items-center mt-14">
        <NavIcon 
          view="PIPELINE" 
          activeView={activeView} 
          icon={Target} 
          label="Pipeline" 
          onClick={(v) => { onViewChange(v); }} 
        />
        <NavIcon 
          view="OVERVIEW" 
          activeView={activeView} 
          icon={LayoutDashboard} 
          label="Insights" 
          onClick={(v) => { onViewChange(v); }} 
        />
        <NavIcon 
          view="TRAFFIC" 
          activeView={activeView} 
          icon={Globe} 
          label="Tráfico" 
          onClick={(v) => { onViewChange(v); }} 
        />
        <NavIcon 
          view="TEAM" 
          activeView={activeView} 
          icon={Users} 
          label="Equipo" 
          onClick={(v) => { onViewChange(v); }} 
        />
      </nav>

      {/* Footer Branding - Fixed at bottom */}
      <div className="mt-auto flex flex-col items-center gap-6 w-full px-2 pb-2">
         <div className="w-6 h-px bg-white/10" />
         <div className="w-10 h-10 rounded-[14px] bg-orange-500/5 border border-orange-500/10 flex items-center justify-center opacity-30">
            <Zap className="w-5 h-5 text-orange-500" />
         </div>
      </div>
    </DashboardDock>
  );
}

function NavIcon({ view, activeView, icon: Icon, label, onClick }: NavIconProps) {
  const isActive = activeView === view;
  
  return (
    <div className="relative flex flex-col items-center group">
      <button
        onClick={() => onClick(view)}
        className={cn(
          "w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-500 relative",
          isActive
            ? "bg-orange-500/10 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]"
            : "text-slate-600 hover:text-slate-300 hover:bg-white/[0.05]"
        )}
      >
        <Icon className={cn("w-5 h-5 transition-all duration-500", isActive && "scale-110")} />
        
        {/* Selection Indicator (Right Side for the Right Sidebar) */}
        {isActive && (
          <div className="absolute -right-3 w-1.5 h-6 bg-orange-500 rounded-l-full shadow-[0_0_15px_rgba(249,115,22,0.6)]" />
        )}

        {/* Label Tooltip */}
        <div className="absolute right-full mr-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 translate-x-2 transition-all duration-300 pointer-events-none">
          <div className="bg-[#0f172a] border border-white/10 rounded-lg px-3 py-1.5 shadow-2xl">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest whitespace-nowrap">
              {label}
            </span>
          </div>
        </div>
      </button>
      <span className={cn(
        "mt-1.5 text-[7px] font-black uppercase tracking-widest transition-colors",
        isActive ? "text-orange-500" : "text-slate-700"
      )}>
        {view === "OVERVIEW" ? "Insights" : view.toLowerCase()}
      </span>
    </div>
  );
}
