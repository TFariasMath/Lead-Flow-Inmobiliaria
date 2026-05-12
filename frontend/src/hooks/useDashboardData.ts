"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getLeads,
  getDashboardStats,
  getPerformanceAnalytics,
  toggleVendorAvailability,
  type DashboardStats,
  type VendorPerformance,
  type Lead,
} from "@/lib/api";

export function useDashboardData(token: string | null, user: any) {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [performance, setPerformance] = useState<VendorPerformance[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [timeframe, setTimeframe] = useState("7");
  const [loading, setLoading] = useState(true);
  const [lastLeadId, setLastLeadId] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [selectedLandingId, setSelectedLandingId] = useState<string>("");

  // 1. Initial Load: Performance and Recent Leads
  useEffect(() => {
    if (!token) return;
    const promises = [
      user?.isStaff ? getPerformanceAnalytics(token) : Promise.resolve([]),
      getLeads(token, "ordering=-created_at&page_size=5"),
    ];

    Promise.all(promises)
      .then(([perfData, leadsData]) => {
        setPerformance(perfData as VendorPerformance[]);
        const leads = (leadsData as any).results;
        setRecentLeads(leads);
        if (leads.length > 0) setLastLeadId(leads[0].id);
      })
      .catch(console.error);
  }, [token, user?.isStaff]);

  // 2. Reactive Data: Stats based on filters
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const statsQuery = new URLSearchParams();
    if (timeframe !== "all") statsQuery.set("days", timeframe);
    if (selectedVendorId) statsQuery.set("vendor_id", selectedVendorId);
    if (selectedLandingId) statsQuery.set("landing_id", selectedLandingId);
    statsQuery.set("_t", Date.now().toString());

    getDashboardStats(token, statsQuery.toString())
      .then((statsData) => {
        setStats(statsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, timeframe, selectedVendorId, selectedLandingId]);

  // 3. Polling for real-time notifications
  useEffect(() => {
    if (!token || !lastLeadId) return;
    const interval = setInterval(() => {
      getLeads(token, "ordering=-created_at&page_size=1")
        .then((data) => {
          const latestLead = data.results[0];
          if (latestLead && latestLead.id !== lastLeadId) {
            setLastLeadId(latestLead.id);
            if (typeof window !== "undefined" && (window as any).notify) {
              (window as any).notify({
                title: "Nuevo Lead Capturado",
                message: `${latestLead.first_name} ${latestLead.last_name} ingresó desde ${latestLead.first_source_name}`,
                type: "success",
                onClick: () =>
                  router.push(`/dashboard/leads?selected=${latestLead.id}`),
              });
            }
          }
        })
        .catch(console.error);
    }, 30000);
    return () => clearInterval(interval);
  }, [token, lastLeadId, router]);

  const handleToggleAvailability = async (vendorId: number) => {
    if (!token) return;
    try {
      const result = await toggleVendorAvailability(token, vendorId);
      setPerformance((prev) =>
        prev.map((v) =>
          v.vendor_id === vendorId ? { ...v, is_available: result.is_available } : v
        )
      );
    } catch (err) {
      console.error("Error toggling availability:", err);
    }
  };

  return {
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
  };
}
