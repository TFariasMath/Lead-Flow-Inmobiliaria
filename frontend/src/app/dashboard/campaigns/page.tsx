/**
 * Lead Flow - Campaigns Management
 * ===============================
 * Listado de campañas de marketing y acceso a la configuración del brochure.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getCampaigns, type Campaign } from "@/lib/api";
import { 
  Target, 
  Plus, 
  Calendar, 
  TrendingUp, 
  ChevronRight,
  FileText,
  Search,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CampaignsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCampaigns = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getCampaigns(token);
      setCampaigns(data.results || []);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Gestión de Campañas</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
            <Target className="w-3 h-3 text-blue-500" />
            Control de captación y configuración de documentos
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/campaigns/new")}
          className="h-12 px-6 rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-500 shadow-xl shadow-blue-600/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Campaña
        </button>
      </div>

      {/* Stats Ticker */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Campañas Activas" value={campaigns.filter(c => c.is_active).length} color="#3b82f6" />
        <StatCard label="Leads este mes" value="1,240" color="#10b981" />
        <StatCard label="Conversión Promedio" value="12.5%" color="#f59e0b" />
        <StatCard label="Presupuesto Total" value="$45,000" color="#ef4444" />
      </div>

      {/* Main Content */}
      <div className="glass-container rounded-[2.5rem] p-6 border border-white/5 space-y-6">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Filtrar campañas por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredCampaigns.map((campaign) => (
              <div 
                key={campaign.id}
                onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                className="group flex items-center gap-6 p-6 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-3xl cursor-pointer transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                  <Target className="w-6 h-6" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-white truncate">{campaign.name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {campaign.start_date || 'Sin fecha'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <FileText className="w-3 h-3" />
                      Brochure: {campaign.properties?.length || 0} Proyectos
                    </span>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-12 px-6">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Leads</p>
                    <p className="text-sm font-black text-white">458</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estado</p>
                    {campaign.is_active ? (
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                        <Activity className="w-3 h-3 animate-pulse" /> Activa
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inactiva</span>
                    )}
                  </div>
                </div>

                <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-white group-hover:bg-white/10 transition-all">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="glass-card rounded-3xl p-6 border border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.03] -mr-8 -mt-8 rounded-full" style={{ color }} />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-2xl font-black text-white" style={{ color }}>{value}</p>
    </div>
  );
}
