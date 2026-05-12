"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useData } from "@/hooks/useData";

// Components
import CustomSelect from "@/components/CustomSelect";
import { useState } from "react";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { TrafficChart } from "@/components/dashboard/TrafficChart";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";
import { DashboardFeed } from "@/components/dashboard/DashboardFeed";
import { TeamSection } from "@/components/dashboard/TeamSection";
import { DashboardTopDrawer } from "@/components/dashboard/DashboardTopDrawer";
import { DashboardRightSidebar, type DashboardView } from "@/components/dashboard/DashboardRightSidebar";
import HistoryDock from "@/components/HistoryDock";

export default function DashboardPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [activeView, setActiveView] = useState<DashboardView>("PIPELINE");
  
  const {
    stats,
    performance,
    recentLeads,
    timeframe,
    setTimeframe,
    loading,
    selectedVendorId,
    setSelectedVendorId,
    selectedLandingId,
    setSelectedLandingId,
    handleToggleAvailability,
  } = useDashboardData(token, user);

  // Fetch campaigns for the landing filter
  const { data: campaignsData } = useData<any>("/campaigns");
  const campaigns = campaignsData?.results || [];

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const renderActiveView = () => {
    switch (activeView) {
      case "OVERVIEW":
        return (
          <div className="h-full overflow-y-auto custom-scrollbar pr-2">
            <DashboardFeed stats={stats} recentLeads={recentLeads} />
          </div>
        );
      case "TRAFFIC":
        return <TrafficChart data={stats.visits_over_time || []} />;
      case "PIPELINE":
        return (
          <div className="h-full overflow-y-auto custom-scrollbar pr-2">
            <AnalyticsCharts stats={stats} />
          </div>
        );
      case "TEAM":
        return (
          <div className="max-w-3xl h-full overflow-y-auto custom-scrollbar pr-2">
            <TeamSection 
              performance={performance} 
              onToggleAvailability={handleToggleAvailability} 
            />
          </div>
        );
      default:
        return (
          <div className="h-full overflow-y-auto custom-scrollbar pr-2">
            <DashboardFeed stats={stats} recentLeads={recentLeads} />
          </div>
        );
    }
  };

  return (
    <>
      {typeof document !== "undefined" && 
        require("react-dom").createPortal(
          <>
            <DashboardRightSidebar 
              activeView={activeView} 
              onViewChange={setActiveView} 
            />
            <DashboardTopDrawer stats={stats} />
            <HistoryDock />
          </>,
          document.body
        )
      }

      <div className="h-[calc(100vh-7rem)] flex flex-col overflow-hidden">
      {/* ── Header & Filters (Compact) ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black text-white tracking-tight uppercase">Dashboard</h1>
          <div className="hidden lg:block w-px h-4 bg-white/10" />
          <p className="hidden md:block text-[10px] text-slate-500 font-bold uppercase tracking-widest">Resumen operacional</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Landing Filter - Only shown in Traffic view */}
          {activeView === "TRAFFIC" && (
            <CustomSelect
              value={selectedLandingId}
              onChange={setSelectedLandingId}
              options={[
                { value: "", label: "Todas las Landings" },
                ...campaigns.map((c: any) => ({
                  value: c.id.toString(),
                  label: c.name
                }))
              ]}
              className="min-w-[160px] h-8 text-[10px]"
            />
          )}

          {user?.isStaff && (
            <CustomSelect
              value={selectedVendorId}
              onChange={setSelectedVendorId}
              options={[
                { value: "", label: "Vista Global (Todos)" },
                ...performance.map((v: any) => ({
                  value: (v.vendor_id || "").toString(),
                  label: v.vendor_name
                }))
              ]}
              className="min-w-[160px] h-8 text-[10px]"
            />
          )}

          <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/5">
            {["7", "30", "all"].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={cn(
                  "px-2.5 py-1 text-[9px] font-black rounded-md transition-all uppercase",
                  timeframe === t ? "bg-orange-600 text-white shadow-lg" : "text-slate-500 hover:text-white"
                )}
              >
                {t === "all" ? "ALL" : `${t}D`}
              </button>
            ))}
          </div>
          <button
            onClick={() => router.push("/dashboard/leads/new")}
            className="h-8 px-4 rounded-lg bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-orange-500 shadow-lg shadow-orange-600/20 transition-all hover:shadow-orange-600/40 hover:-translate-y-0.5"
          >
            Nuevo Lead
          </button>
        </div>
      </div>

      {/* ── Dynamic Area (Zero Scroll) ── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full w-full animate-fadeIn" key={activeView}>
           {renderActiveView()}
        </div>
      </div>
    </div>
    </>
  );
}
