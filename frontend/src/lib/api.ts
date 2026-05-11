/**
 * Lead Flow - API Client
 * ======================
 * Cliente HTTP centralizado para comunicación con el backend Django.
 */

import { 
  Lead, 
  Interaction, 
  HistoryEntry, 
  WebhookLog, 
  Source, 
  MediaAsset, 
  Campaign, 
  Property, 
  User, 
  DashboardStats,
  SentEmail
} from "@/types/api";

export type { 
  Lead, 
  Interaction, 
  HistoryEntry, 
  WebhookLog, 
  Source, 
  MediaAsset, 
  Campaign, 
  Property, 
  User, 
  DashboardStats,
  SentEmail
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface FetchOptions extends RequestInit {
  token?: string | null;
}

async function apiFetch<T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((customHeaders as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers,
    cache: "no-store",
    ...rest,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.detail || errorData.error || `API Error: ${res.status}`
    );
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

// --- Auth ---

export interface TokenResponse {
  access: string;
  refresh: string;
}

export function login(username: string, password: string) {
  return apiFetch<TokenResponse>("/auth/token/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function refreshToken(refresh: string) {
  return apiFetch<{ access: string }>("/auth/token/refresh/", {
    method: "POST",
    body: JSON.stringify({ refresh }),
  });
}

// --- Utils ---

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// --- Leads ---

export function getLeads(token: string, params?: string) {
  const query = params ? `?${params}` : "";
  return apiFetch<PaginatedResponse<Lead>>(`/leads/${query}`, { token });
}

export function getLead(token: string, id: string) {
  return apiFetch<Lead>(`/leads/${id}/`, { token });
}

export function createLead(token: string, data: Partial<Lead>) {
  return apiFetch<Lead>("/leads/", {
    token,
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateLead(token: string, id: string, data: Partial<Lead>) {
  return apiFetch<Lead>(`/leads/${id}/`, {
    token,
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function bulkUpdateLeads(token: string, ids: string[], fields: Partial<Lead>) {
  return apiFetch<{ message: string; updated_count: number }>("/leads/bulk_update/", {
    token,
    method: "POST",
    body: JSON.stringify({ ids, fields }),
  });
}

export function getLeadHistory(token: string, id: string) {
  return apiFetch<HistoryEntry[]>(`/leads/${id}/history/`, { token });
}

// --- Webhook Logs ---

export function getWebhookLogs(token: string, params?: string) {
  const query = params ? `?${params}` : "";
  return apiFetch<PaginatedResponse<WebhookLog>>(`/webhook-logs/${query}`, {
    token,
  });
}

export function reprocessWebhook(
  token: string,
  id: string,
  editedBody: Record<string, unknown>
) {
  return apiFetch<WebhookLog>(`/webhook-logs/${id}/reprocess/`, {
    token,
    method: "POST",
    body: JSON.stringify({ edited_body: editedBody }),
  });
}

// --- Sources ---

export function getSources(token: string) {
  return apiFetch<PaginatedResponse<Source>>("/sources/", { token });
}

export function getMediaAssets(token: string) {
  return apiFetch<PaginatedResponse<MediaAsset>>("/media-assets/", { token });
}

export async function uploadMediaAsset(token: string, file: File, title: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);

  const res = await fetch(`${API_BASE}/media-assets/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Error uploading file");
  }

  return res.json() as Promise<MediaAsset>;
}

// --- Campaigns ---

export function getCampaigns(token: string) {
  return apiFetch<PaginatedResponse<Campaign>>("/campaigns/", { token });
}

export function getCampaign(token: string, id: string) {
  return apiFetch<Campaign>(`/campaigns/${id}/`, { token });
}

export function createCampaign(token: string, data: Partial<Campaign>) {
  return apiFetch<Campaign>("/campaigns/", {
    token,
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCampaign(token: string, id: string, data: Partial<Campaign>) {
  return apiFetch<Campaign>(`/campaigns/${id}/`, {
    token,
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function getProperties(token: string, params?: string) {
  const query = params ? `?${params}` : "";
  return apiFetch<PaginatedResponse<Property>>(`/properties/${query}`, {
    token,
  });
}

export function getProperty(token: string, id: string) {
  return apiFetch<Property>(`/properties/${id}/`, { token });
}

export function createProperty(token: string, data: Partial<Property>) {
  return apiFetch<Property>("/properties/", {
    token,
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProperty(token: string, id: string, data: Partial<Property>) {
  return apiFetch<Property>(`/properties/${id}/`, {
    token,
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteProperty(token: string, id: string) {
  return apiFetch(`/properties/${id}/`, {
    token,
    method: "DELETE",
  });
}

// --- Users ---

export function getUsers(token: string) {
  return apiFetch<User[]>("/users/", { token });
}

// --- Groups & Permissions ---

export interface Permission {
  id: number;
  name: string;
  codename: string;
  content_type: number;
}

export interface Group {
  id: number;
  name: string;
  permissions: number[];
  permissions_details?: Permission[];
  user_count: number;
}

export function getGroups(token: string) {
  return apiFetch<PaginatedResponse<Group>>("/groups/", { token });
}

export function getGroup(token: string, id: string) {
  return apiFetch<Group>(`/groups/${id}/`, { token });
}

export function createGroup(token: string, data: Partial<Group>) {
  return apiFetch<Group>("/groups/", {
    token,
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateGroup(token: string, id: string, data: Partial<Group>) {
  return apiFetch<Group>(`/groups/${id}/`, {
    token,
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteGroup(token: string, id: string) {
  return apiFetch(`/groups/${id}/`, {
    token,
    method: "DELETE",
  });
}

export function getPermissions(token: string) {
  return apiFetch<Permission[]>("/permissions/", { token });
}

// --- Dashboard ---

export function getDashboardStats(token: string, params?: string) {
  const query = params ? `?${params}` : "";
  return apiFetch<DashboardStats>(`/dashboard/stats/${query}`, { token });
}

export interface VendorPerformance {
  vendor_name: string;
  total_assigned: number;
  won: number;
  lost: number;
  conversion_rate: number;
  is_available: boolean;
}

export function getPerformanceAnalytics(token: string) {
  return apiFetch<VendorPerformance[]>("/analytics/performance/", { token });
}

// --- Emails ---

export function getSentEmails(token: string) {
  return apiFetch<PaginatedResponse<SentEmail>>("/sent-emails/", { token });
}
