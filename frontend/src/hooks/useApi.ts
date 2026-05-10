"use client";

import { useAuth } from "@/context/AuthContext";

/**
 * useApi Hook
 * ===========
 * Proporciona métodos para interactuar con la API (POST, PUT, DELETE, etc.)
 * inyectando automáticamente el token de autenticación.
 */
export function useApi() {
  const { token } = useAuth();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  const request = async (method: string, endpoint: string, body?: any) => {
    if (!token) throw new Error("No hay sesión activa.");

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || "Error en la petición.");
    }

    if (response.status === 204) return null;
    return response.json();
  };

  return {
    get: (endpoint: string) => request("GET", endpoint),
    post: (endpoint: string, body: any) => request("POST", endpoint, body),
    put: (endpoint: string, body: any) => request("PUT", endpoint, body),
    patch: (endpoint: string, body: any) => request("PATCH", endpoint, body),
    delete: (endpoint: string) => request("DELETE", endpoint),
  };
}
