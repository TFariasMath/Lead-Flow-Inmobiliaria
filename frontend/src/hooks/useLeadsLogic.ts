import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/hooks/useData";
import { 
  updateLead, 
  bulkUpdateLeads, 
  type Lead, 
  type Source, 
  type Campaign, 
  type PaginatedResponse,
  type User
} from "@/lib/api";
import { useHistory } from "@/hooks/useHistory";

export function useLeadsLogic() {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [sourceFilter, setSourceFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [staleFilter, setStaleFilter] = useState(searchParams.get("filter") === "stale");
  const [todayFilter, setTodayFilter] = useState(searchParams.get("filter") === "today");
  const [editingCell, setEditingCell] = useState<{ id: string, field: string, value: string } | null>(null);
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { addVisit } = useHistory();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const leadsQuery = new URLSearchParams();
  leadsQuery.set("page", page.toString());
  if (search) leadsQuery.set("search", search);
  if (statusFilter) leadsQuery.set("status", statusFilter);
  if (sourceFilter) leadsQuery.set("first_source", sourceFilter);
  if (userFilter) leadsQuery.set("assigned_to", userFilter);
  if (campaignFilter) leadsQuery.set("campaign", campaignFilter);
  if (staleFilter) leadsQuery.set("filter", "stale");
  if (todayFilter) leadsQuery.set("filter", "today");

  const { data: leadsData, isLoading: loading, mutate: mutateLeads } = useData<PaginatedResponse<Lead>>(`/leads?${leadsQuery.toString()}`);
  const { data: sourcesData } = useData<PaginatedResponse<Source>>("/sources");
  const { data: campaignsData } = useData<PaginatedResponse<Campaign>>("/campaigns");
  const { data: usersData } = useData<User[]>("/users");

  useEffect(() => {
    const autoId = searchParams.get("id");
    if (autoId) {
      setSelectedLeadId(autoId);
    }
  }, [searchParams]);

  const leads = leadsData?.results || [];
  const totalCount = leadsData?.count || 0;

  const handleStatusUpdate = useCallback(async (leadId: string, newStatus: string) => {
    if (!token) return;
    try {
      await updateLead(token, leadId, { status: (newStatus as any) });
      mutateLeads();
      if (typeof window !== "undefined" && (window as any).notify) {
        (window as any).notify({
          title: "Estado Actualizado",
          message: `El lead ha sido movido a ${newStatus}`,
          type: "success"
        });
      }
    } catch (err: any) {
      console.error(err);
      if (typeof window !== "undefined" && (window as any).notify) {
        (window as any).notify({
          title: "Error al actualizar",
          message: err.message || "No se pudo cambiar el estado",
          type: "error"
        });
      }
    }
  }, [token, mutateLeads]);

  const handleInlineUpdate = useCallback(async (id: string, field: string, value: any) => {
    if (!token) return;
    try {
      await updateLead(token, id, { [field]: value });
      mutateLeads();
      setEditingCell(null);
    } catch (err) {
      console.error(err);
    }
  }, [token, mutateLeads]);

  const handleSelectLead = useCallback((lead: Lead) => {
    setSelectedLeadId(lead.id);
    addVisit(lead);
  }, [addVisit]);

  const handleBulkUpdate = async (fields: Partial<Lead>) => {
    if (!token || selectedIds.size === 0) return;
    setIsBulkUpdating(true);
    try {
      await bulkUpdateLeads(token, Array.from(selectedIds), fields);
      setSelectedIds(new Set());
      mutateLeads();
    } catch (err) {
      console.error(err);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map(l => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleExportCSV = async () => {
    if (!token) return;
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${API_BASE}/leads/export/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
    }
  };

  return {
    token,
    router,
    page, setPage,
    search, setSearch,
    statusFilter, setStatusFilter,
    sourceFilter, setSourceFilter,
    userFilter, setUserFilter,
    campaignFilter, setCampaignFilter,
    selectedLeadId, setSelectedLeadId,
    staleFilter, setStaleFilter,
    todayFilter, setTodayFilter,
    editingCell, setEditingCell,
    view, setView,
    selectedIds, setSelectedIds,
    isBulkUpdating,
    isMounted,
    leads,
    totalCount,
    loading,
    mutateLeads,
    sourcesData,
    campaignsData,
    usersData,
    handleStatusUpdate,
    handleInlineUpdate,
    handleSelectLead,
    handleBulkUpdate,
    toggleSelectAll,
    toggleSelect,
    handleExportCSV,
    leadsData
  };
}
