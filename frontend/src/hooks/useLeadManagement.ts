import { useState, useEffect, useCallback } from "react";
import { Lead, HistoryEntry, Property, getLead, getLeadHistory, getProperties, updateLead } from "@/lib/api";

export const useLeadManagement = (leadId: string | null, token: string | null, onUpdate: () => void) => {
  const [lead, setLead] = useState<Lead | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchData = useCallback(async () => {
    if (!leadId || !token) {
      setLead(null);
      setHistory([]);
      return;
    }

    setLoading(true);
    try {
      const [leadData, historyData, propertiesData] = await Promise.all([
        getLead(token, leadId),
        getLeadHistory(token, leadId),
        getProperties(token)
      ]);
      setLead(leadData);
      setHistory(historyData);
      const props = Array.isArray(propertiesData) ? propertiesData : (propertiesData as any).results || [];
      setAllProperties(props);
    } catch (err) {
      console.error("Error fetching lead data:", err);
    } finally {
      setLoading(false);
    }
  }, [leadId, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (newStatus: string) => {
    if (!token || !lead) return;
    setUpdatingStatus(true);
    try {
      await updateLead(token, lead.id, { status: newStatus });
      setLead({ ...lead, status: newStatus });
      onUpdate();
      const newHistory = await getLeadHistory(token, lead.id);
      setHistory(newHistory);
    } catch (err) {
      console.error("Error updating lead status:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const toggleProperty = async (propertyId: number) => {
    if (!token || !lead) return;
    const currentProps = lead.interested_properties || [];
    const newProps = currentProps.includes(propertyId)
      ? currentProps.filter(id => id !== propertyId)
      : [...currentProps, propertyId];
    
    try {
      await updateLead(token, lead.id, { interested_properties: newProps });
      setLead({ ...lead, interested_properties: newProps });
      onUpdate();
    } catch (err) {
      console.error("Error toggling property:", err);
    }
  };

  return {
    lead,
    history,
    allProperties,
    loading,
    updatingStatus,
    handleStatusChange,
    toggleProperty,
    refreshHistory: async () => {
        if (token && leadId) {
            const h = await getLeadHistory(token, leadId);
            setHistory(h);
        }
    }
  };
};
