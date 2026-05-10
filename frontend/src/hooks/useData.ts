/**
 * useData Hook - SWR Powered
 * =========================
 * Hook centralizado para fetching de datos con caché inteligente
 * y revalidación automática.
 */

import useSWR, { preload } from "swr";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";

// Fetcher universal que inyecta el token automáticamente
const createFetcher = (token: string | null) => async (url: string) => {
  if (!token) return null;
  
  // Mapeo simple de URLs a funciones de la API
  if (url.startsWith("/leads")) {
    const params = url.split("?")[1] || "";
    return api.getLeads(token, params);
  }
  if (url.startsWith("/campaigns")) {
    return api.getCampaigns(token);
  }
  if (url.startsWith("/dashboard/stats")) {
    const days = new URLSearchParams(url.split("?")[1]).get("days") || undefined;
    return api.getDashboardStats(token, days);
  }
  if (url.startsWith("/properties")) {
    return api.getProperties(token);
  }
  if (url.startsWith("/analytics/performance")) {
    return api.getPerformanceAnalytics(token);
  }
  if (url.startsWith("/webhook-logs")) {
    const params = url.split("?")[1] || "";
    return api.getWebhookLogs(token, params);
  }

  throw new Error(`No fetcher defined for URL: ${url}`);
};

export function useData<T>(key: string | null) {
  const { token } = useAuth();
  const fetcher = createFetcher(token);

  const { data, error, mutate, isLoading } = useSWR<T>(
    token && key ? key : null,
    fetcher,
    {
      revalidateOnFocus: false, // Evita recargas innecesarias al cambiar de pestaña
      dedupingInterval: 5000,   // Evita peticiones duplicadas en 5 segundos
    }
  );

  return {
    data,
    isLoading,
    isError: error,
    mutate
  };
}

// Función para pre-cargar datos manualmente (Prefetching)
export const prefetchData = (key: string, token: string | null) => {
  if (!token) return;
  const fetcher = createFetcher(token);
  preload(key, fetcher);
};
