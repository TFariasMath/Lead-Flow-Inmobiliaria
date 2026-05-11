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

export function DashboardRightSidebar({ activeView, onViewChange }: DashboardRightSidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/* ── RIGHT TRIGGER AREA (The "Handle") ── */}
      <div 
        className="fixed right-0 top-0 bottom-0 w-4 z-[60] cursor-pointer group/trigger"
        onMouseEnter={() => setIsOpen(true)}
      >
        <div className="absolute top-1/2 -translate-y-1/2 right-2 w-2.5 h-20 bg-orange-500/30 rounded-full border border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.4)] group-hover/trigger:h-32 group-hover/trigger:bg-orange-500/50 group-hover/trigger:shadow-[0_0_30px_rgba(249,115,22,0.6)] transition-all duration-500 animate-pulse" />
      </div>

      {/* ── THE RIGHT SIDEBAR DOCK ── */}
      <aside 
        className={cn(
          "fixed top-3 bottom-3 w-[72px] flex flex-col items-center py-7 bg-[rgba(2,6,23,0.98)] backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] z-[70] shadow-[-20px_0_50px_rgba(0,0,0,0.5)] transition-all duration-700 ease-out",
          isOpen ? "right-3 opacity-100 translate-x-0" : "-right-20 opacity-0 translate-x-full pointer-events-none"
        )}
        onMouseLeave={() => setIsOpen(false)}
      >
        {/* Decorative top glow - Matching the left one */}
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />

        {/* Navigation Icons - Compacted at top like the left one */}
        <nav className="flex flex-col gap-6 w-full items-center mt-14">
          <NavIcon 
            view="OVERVIEW" 
            activeView={activeView} 
            icon={LayoutDashboard} 
            label="Insights" 
            onClick={(v) => { onViewChange(v); setIsOpen(false); }} 
          />
          <NavIcon 
            view="TRAFFIC" 
            activeView={activeView} 
            icon={Globe} 
            label="Tráfico" 
            onClick={(v) => { onViewChange(v); setIsOpen(false); }} 
          />
          <NavIcon 
            view="PIPELINE" 
            activeView={activeView} 
            icon={Target} 
            label="Pipeline" 
            onClick={(v) => { onViewChange(v); setIsOpen(false); }} 
          />
          <NavIcon 
            view="TEAM" 
            activeView={activeView} 
            icon={Users} 
            label="Equipo" 
            onClick={(v) => { onViewChange(v); setIsOpen(false); }} 
          />
        </nav>

        {/* Footer Branding - Fixed at bottom */}
        <div className="mt-auto flex flex-col items-center gap-6 w-full px-2 pb-2">
           <div className="w-6 h-px bg-white/10" />
           <div className="w-10 h-10 rounded-[14px] bg-orange-500/5 border border-orange-500/10 flex items-center justify-center opacity-30">
              <Zap className="w-5 h-5 text-orange-500" />
           </div>
        </div>
      </aside>
    </>
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
