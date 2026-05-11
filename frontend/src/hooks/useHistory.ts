"use client";

import { useState, useEffect, useCallback } from "react";
import { Lead } from "@/lib/api";

const HISTORY_KEY = "leadflow_history_v1";
const MAX_HISTORY = 4; // Mostramos 3 pero guardamos 4 por si acaso

export function useHistory() {
  const [history, setHistory] = useState<Partial<Lead>[]>([]);

  // Cargar historial al iniciar
  useEffect(() => {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Error loading history", e);
      }
    }
  }, []);

  const addVisit = useCallback((lead: Lead) => {
    setHistory((prev) => {
      // Evitar duplicados y mantener máximo MAX_HISTORY
      const filtered = prev.filter((l) => l.id !== lead.id);
      const newHistory = [
        { 
          id: lead.id, 
          first_name: lead.first_name, 
          last_name: lead.last_name, 
          score: lead.score,
          status: lead.status 
        }, 
        ...filtered
      ].slice(0, MAX_HISTORY);
      
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  return { history, addVisit, clearHistory };
}
