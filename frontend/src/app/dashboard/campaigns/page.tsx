/**
 * Lead Flow - Campaigns Management (Premium v3)
 * ============================================
 * Dashboard de control de marketing. Gestión de campañas activas,
 * rendimiento de captación y vinculación de proyectos.
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
  ChevronRight,
  FileText,
  Search,
  Activity,
  Zap,
  TrendingUp,
  Globe,
  Layout
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useDashboardData } from "@/hooks/useDashboardData";

export default function CampaignsPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [search, setSearch] = useState("");

  const { stats, loading: loadingStats } = useDashboardData(token, user);

  const fetchCampaigns = useCallback(async () => {
    if (!token) return;
    setLoadingCampaigns(true);
    try {
      const data = await getCampaigns(token);
      setCampaigns(data.results || []);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    } finally {
      setLoadingCampaigns(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatBudget = (budget: number) => {
    if (budget >= 1000) return `$${(budget / 1000).toFixed(1)}k`;
    return `$${budget}`;
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      
      {/* ── Metric Strip ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger-children">
        <MiniCard icon={Target} label="Campañas" value={campaigns.length} color="#3b82f6" />
        <MiniCard icon={Activity} label="En Ejecución" value={campaigns.filter(c => c.is_active).length} color="#10b981" />
        <MiniCard 
          icon={TrendingUp} 
          label="Conversión Global" 
          value={stats ? `${stats.global_conversion}%` : "0%"} 
          color="#f59e0b" 
        />
        <MiniCard 
          icon={Zap} 
          label="Presupuesto Total" 
          value={stats ? formatBudget(stats.total_budget) : "$0"} 
          color="#6366f1" 
        />
      </div>

      {/* ── Header Section ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="section-title">Estrategias de Captación</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
            <Globe className="w-3 h-3 text-blue-500" />
            Control de orígenes y optimización de conversión
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="input-icon-wrapper group">
            <Search className="w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar campaña..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-premium input-premium-icon h-12 w-64 lg:w-80"
            />
          </div>
          <button
            onClick={() => router.push("/dashboard/campaigns/new")}
            className="btn-primary h-12 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear Campaña
          </button>
        </div>
      </div>

      {/* ── Campaigns Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger-children">
        {loadingCampaigns || loadingStats ? (
          <div className="col-span-full py-40 flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sincronizando Motores...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="col-span-full py-40 glass-container rounded-[2rem] flex flex-col items-center justify-center gap-4 text-slate-500 border-dashed border-2">
            <Layout className="w-12 h-12 opacity-20" />
            <p className="font-bold text-sm">No hay estrategias configuradas actualmente</p>
          </div>
        ) : (
          filteredCampaigns.map((campaign, idx) => (
            <div 
              key={campaign.id}
              onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
              className="glass-card rounded-[2rem] p-8 cursor-pointer group relative overflow-hidden"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Background gradient hint */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 group-hover:scale-110 shadow-xl">
                    <Target className="w-7 h-7" />
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                    campaign.is_active 
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
                      : "text-slate-500 bg-white/5 border-white/5"
                  )}>
                    {campaign.is_active ? (
                      <span className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Activa
                      </span>
                    ) : "Pausada"}
                  </div>
                </div>

                <h3 className="text-xl font-black text-white mb-2 group-hover:text-blue-400 transition-colors truncate">
                  {campaign.name}
                </h3>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Inicia: {campaign.start_date || 'Inmediato'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {campaign.properties?.length || 0} Proyectos Vinculados
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/[0.04]">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Prospectos</span>
                    <span className="text-lg font-black text-white">{campaign.leads_count || 0}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-600 group-hover:text-white group-hover:bg-blue-600 transition-all">
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MiniCard({ icon: Icon, label, value, color, trend }: { icon: any; label: string; value: string | number; color: string; trend?: string }) {
  return (
    <div className="glass-card rounded-2xl p-4 flex items-center justify-between group relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full opacity-40 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: color }} />
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform duration-500" style={{ color }}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-0.5">{label}</p>
          <p className="text-xl font-black text-white">{value}</p>
        </div>
      </div>
      {trend && (
        <div className="text-[9px] font-black px-1.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          {trend}
        </div>
      )}
    </div>
  );
}
