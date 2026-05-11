"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { useDashboardData } from "@/hooks/useDashboardData";

// Components
import CustomSelect from "@/components/CustomSelect";
import { useState } from "react";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { TrafficChart } from "@/components/dashboard/TrafficChart";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";
import { DashboardFeed } from "@/components/dashboard/DashboardFeed";
import { TeamSection } from "@/components/dashboard/TeamSection";
import { DashboardRightSidebar, type DashboardView } from "@/components/dashboard/DashboardRightSidebar";

export default function DashboardPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [activeView, setActiveView] = useState<DashboardView>("OVERVIEW");
  
  const {
    stats,
    performance,
    recentLeads,
    timeframe,
    setTimeframe,
    loading,
    selectedVendorId,
    setSelectedVendorId,
    handleToggleAvailability,
  } = useDashboardData(token, user);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const renderActiveView = () => {
    switch (activeView) {
      case "OVERVIEW":
        return <DashboardFeed stats={stats} recentLeads={recentLeads} />;
      case "TRAFFIC":
        return <TrafficChart data={stats.visits_over_time || []} />;
      case "PIPELINE":
        return <AnalyticsCharts stats={stats} />;
      case "TEAM":
        return (
          <div className="max-w-3xl">
            <TeamSection 
              performance={performance} 
              onToggleAvailability={handleToggleAvailability} 
            />
          </div>
        );
      default:
        return <DashboardFeed stats={stats} recentLeads={recentLeads} />;
    }
  };

  return (
    <>
      {typeof document !== "undefined" && 
        require("react-dom").createPortal(
          <DashboardRightSidebar 
            activeView={activeView} 
            onViewChange={setActiveView} 
          />,
          document.body
        )
      }
      
      <div className="space-y-6 animate-fadeIn pb-10">
        {/* ... (Header & Filters) ... */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* (Header contents) */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-white tracking-tight uppercase">Dashboard</h1>
              <div className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest",
                stats?.status === "error" ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              )}>
                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", stats?.status === "error" ? "bg-red-500" : "bg-emerald-500")} />
                {stats?.status === "error" ? "Offline" : "Sistema Online"}
              </div>
            </div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Resumen operacional de tu pipeline comercial</p>
          </div>

          <div className="flex items-center gap-3">
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
                className="min-w-[180px]"
              />
            )}
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
              {["7", "30", "all"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase",
                    timeframe === t ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-white"
                  )}
                >
                  {t === "all" ? "ALL" : `${t}D`}
                </button>
              ))}
            </div>
            <button
              onClick={() => router.push("/dashboard/leads/new")}
              className="h-9 px-4 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all hover:shadow-blue-600/40 hover:-translate-y-0.5"
            >
              Nuevo Lead
            </button>
          </div>
        </div>

        {/* ── KPI Grid (Visible in all views) ── */}
        <KPIGrid stats={stats} />

        {/* ── Dynamic Area ── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 w-full min-w-0 animate-fadeIn" key={activeView}>
             {renderActiveView()}
          </div>
        </div>
      </div>
    </>
  );
}
