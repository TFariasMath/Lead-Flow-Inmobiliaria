/**
 * Lead Flow - API Client
 * ======================
 * Cliente HTTP centralizado para comunicación con el backend Django.
 */

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

// ─── Auth ─────────────────────────────────────────────────────────────────────

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

// ─── Leads ────────────────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  original_email: string;
  contact_email: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  company: string;
  status: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  first_source: number | null;
  first_source_name: string;
  campaign: number | null;
  campaign_name: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  interested_properties: number[];
  interaction_count?: number;
  score: number;
  interactions?: Interaction[];
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  lead: string;
  type: string;
  source: number | null;
  source_name: string;
  raw_payload: Record<string, unknown>;
  notes: string;
  created_at: string;
}

export interface SentEmail {
  id: string;
  lead: string | null;
  to_email: string;
  from_email: string;
  subject: string;
  body_text: string;
  body_html: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

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

export function getLeadHistory(token: string, id: string) {
  return apiFetch<HistoryEntry[]>(`/leads/${id}/history/`, { token });
}

export interface HistoryEntry {
  history_id: number;
  history_date: string;
  history_type: string;
  history_user: string | null;
  changes: Record<string, { old: string; new: string }>;
}

// ─── Webhook Logs ─────────────────────────────────────────────────────────────

export interface WebhookLog {
  id: string;
  source_type: string;
  raw_body: Record<string, unknown>;
  status: string;
  error_message: string;
  lead: string | null;
  lead_name: string;
  edited_body: Record<string, unknown> | null;
  edited_by: number | null;
  edited_by_name: string | null;
  processed_at: string | null;
  created_at: string;
}

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

// ─── Sources ──────────────────────────────────────────────────────────────────

export interface Source {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
}
export function getSources(token: string) {
  return apiFetch<PaginatedResponse<Source>>("/sources/", { token });
}

export interface MediaAsset {
  id: number;
  title: string;
  file: string;
  alt_text: string;
  created_at: string;
}

export function getMediaAssets(token: string) {
  return apiFetch<PaginatedResponse<MediaAsset>>("/media-assets/", { token });
}

export async function uploadMediaAsset(token: string, file: File, title: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/media-assets/`, {
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

// ─── Campaigns ────────────────────────────────────────────────────────────────

export interface Campaign {
  id: number;
  name: string;
  slug: string;
  budget: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  brochure_title: string;
  brochure_description: string;
  brochure_features: string[];
  properties: number[];
  properties_details?: Property[];
}

export interface Property {
  id: number;
  name: string;
  slug: string;
  description: string;
  location: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  min_investment: string;
  estimated_return: string;
  delivery_date: string;
  amenities: string[];
  main_image: number | null;
  main_image_url?: string | null;
  campaign_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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

// ─── Users ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_staff: boolean;
}

export function getUsers(token: string) {
  return apiFetch<User[]>("/users/", { token });
}

// ─── Groups & Permissions ─────────────────────────────────────────────────────

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

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_leads: number;
  leads_by_status: Record<string, number>;
  total_webhooks: number;
  successful_webhooks: number;
  failed_webhooks: number;
  webhook_success_rate: number;
  leads_by_source: Array<{ first_source__name: string; count: number }>;
}

export function getDashboardStats(token: string, days?: string) {
  const query = days ? `?days=${days}` : "";
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

// --- Emails -------------------------------------------------------------------

export function getSentEmails(token: string) {
  return apiFetch<PaginatedResponse<SentEmail>>("/sent-emails/", { token });
}
