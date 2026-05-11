/**
 * Lead Flow - API Type Definitions
 * ================================
 * Este archivo es la ÚNICA fuente de verdad para los tipos de datos
 * que viajan entre el Backend (Django) y el Frontend (Next.js).
 */

// --- Tipos de Enumeración (Choices en Django) ---

export type LeadStatus = 
  | 'nuevo' 
  | 'contactado' 
  | 'en_calificacion' 
  | 'propuesta_enviada' 
  | 'cierre_ganado' 
  | 'cierre_perdido';

export type InteractionType = 
  | 'email_sent' 
  | 'email_received' 
  | 'webhook' 
  | 'note' 
  | 'status_change' 
  | 'system';

export type WebhookStatus = 'pending' | 'success' | 'failed';

export type AlertLevel = 'info' | 'warning' | 'critical';

// --- Interfaces de Modelos Core ---

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
}

export interface Source {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface MediaAsset {
  id: number;
  title: string;
  file: string; // URL de la imagen
  alt_text: string;
  created_at: string;
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
  min_investment: number;
  estimated_return: string;
  delivery_date: string;
  amenities: string[];
  main_image?: number | MediaAsset; // Puede ser el ID o el objeto expandido
  main_image_url?: string; // Campo calculado opcional
  is_active: boolean;
  created_at: string;
}

export interface Campaign {
  id: number;
  name: string;
  slug: string;
  budget: number;
  brochure_title: string;
  brochure_description: string;
  brochure_features: string[];
  properties: number[] | Property[];
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface Lead {
  id: string; // UUID
  original_email: string;
  contact_email: string;
  first_name: string;
  last_name: string;
  full_name?: string; // Campo calculado
  phone: string;
  address: string;
  company: string;
  investment_goal: string;
  investment_capacity: string;
  status: LeadStatus;
  assigned_to?: number | User;
  assigned_to_name?: string; // Campo calculado
  first_source?: number | Source;
  first_source_name?: string; // Campo calculado
  campaign?: number | Campaign;
  interested_properties: number[];
  score: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string; // UUID
  lead: string; // UUID del lead
  type: InteractionType;
  source?: number | Source;
  raw_payload: any;
  notes: string;
  created_at: string;
}

export interface WebhookLog {
  id: string; // UUID
  source_type: string;
  raw_body: any;
  status: WebhookStatus;
  error_message: string;
  lead?: string; // UUID del lead
  edited_body?: any;
  edited_by?: number | User;
  processed_at?: string;
  created_at: string;
}

export interface HistoryEntry {
  history_id: number;
  history_date: string;
  history_type: '+' | '~' | '-';
  history_user?: number | User;
  changes: Record<string, { old: any; new: any }>;
}

// --- Tipos de Landing Page ---

export interface Benefit {
  icon: string;
  title: string;
}

export interface LandingData {
  id: number;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  benefits: Benefit[];
  form_config: any;
  cta_text: string;
  success_message: string;
  primary_color: string;
  image_url: string;
  latitude?: number;
  longitude?: number;
  campaign?: number | Campaign;
  source?: number | Source;
  visits_count: number;
  conversion_rate?: number;
  is_active: boolean;
  properties_details?: Property[]; // Campo inyectado en el contexto de la landing
}

// --- Tipos de Dashboard & Analíticas ---

export interface DashboardStats {
  total_leads: number;
  leads_today: number;
  conversion_rate: number;
  active_campaigns: number;
  leads_by_status: Record<LeadStatus, number>;
  leads_by_source: Record<string, number>;
  timeline_data: { date: string; count: number }[];
}
