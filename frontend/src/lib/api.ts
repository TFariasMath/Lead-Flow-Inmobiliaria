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

// ─── Campaigns ────────────────────────────────────────────────────────────────

export interface Campaign {
  id: number;
  name: string;
  slug: string;
  budget: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
}

export function getCampaigns(token: string) {
  return apiFetch<PaginatedResponse<Campaign>>("/campaigns/", { token });
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
