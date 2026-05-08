/**
 * Lead Flow - Campaign & Brochure Editor
 * ======================================
 * Interfaz avanzada para configurar la campaña y previsualizar el brochure PDF.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  getCampaign, 
  updateCampaign, 
  getProperties, 
  type Campaign, 
  type Property 
} from "@/lib/api";
import { 
  ChevronLeft, 
  Save, 
  Loader2, 
  FileText, 
  Building2, 
  CheckCircle2, 
  Layout, 
  Settings2,
  ExternalLink,
  Plus,
  Trash
} from "lucide-react";
import { cn } from "@/lib/utils";
import BrochurePreview from "@/components/BrochurePreview";

// Custom hook for debouncing
function useDebounce(value: any, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function CampaignEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const debouncedCampaign = useDebounce(campaign, 1500);

  // Carga inicial de datos
  useEffect(() => {
    if (!token || id === "new") {
      setLoading(false);
      return;
    }

    Promise.all([
      getCampaign(token, id),
      getProperties(token)
    ]).then(([campData, propData]) => {
      setCampaign(campData);
      setProperties(propData.results || []);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      setPreviewUrl(`${baseUrl}/campaigns/${id}/brochure-preview/?token=${token}`);
      setLoading(false);
      setLastSaved(new Date());
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id, token]);

  // Auto-save logic
  useEffect(() => {
    if (debouncedCampaign && token && id !== "new" && lastSaved) {
      // Solo guardar si hay cambios reales comparados con lo cargado inicialmente
      handleSave(true);
    }
  }, [debouncedCampaign]);

  const handleSave = async (isAuto = false) => {
    if (!token || !campaign || !id) return;
    if (!isAuto) setSaving(true);
    try {
      await updateCampaign(token, id, campaign);
      setLastSaved(new Date());
    } catch (err) {
      console.error(err);
      if (!isAuto) alert("Error al guardar la campaña");
    } finally {
      if (!isAuto) setSaving(false);
    }
  };

  const toggleProperty = (propId: number) => {
    if (!campaign) return;
    const current = campaign.properties || [];
    const updated = current.includes(propId)
      ? current.filter(id => id !== propId)
      : [...current, propId];
    setCampaign({ ...campaign, properties: updated });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f172a]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!campaign) return <div>No encontrada</div>;

  return (
    <div className="h-screen flex flex-col bg-[#0f172a] text-white overflow-hidden -m-8">
      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-6 bg-[#1a1d27] border-b border-white/5 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard/campaigns")} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <h1 className="font-black text-sm uppercase tracking-tight">{campaign.name}</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Configurador de Campaña & Brochure</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Cambios
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Editor */}
        <div className="w-[450px] border-r border-white/5 bg-[#141721] overflow-y-auto p-6 space-y-10 custom-scrollbar">
          
          {/* Section: Basic Settings */}
          <EditorSection title="Configuración General" icon={Settings2}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Presupuesto</label>
                  <input 
                    type="text" 
                    value={campaign.budget} 
                    onChange={e => setCampaign({...campaign, budget: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estado</label>
                  <button 
                    onClick={() => setCampaign({...campaign, is_active: !campaign.is_active})}
                    className={cn(
                      "w-full h-[42px] rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                      campaign.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}
                  >
                    {campaign.is_active ? "Activa" : "Inactiva"}
                  </button>
                </div>
              </div>
            </div>
          </EditorSection>

          {/* Section: Brochure Content */}
          <EditorSection title="Contenido del Brochure (PDF)" icon={FileText}>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Título Portada</label>
                <input 
                  type="text" 
                  value={campaign.brochure_title} 
                  onChange={e => setCampaign({...campaign, brochure_title: e.target.value})}
                  placeholder="Ej: Oportunidad de Inversión en Punta Cana"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Introducción / Ventas</label>
                <textarea 
                  value={campaign.brochure_description} 
                  onChange={e => setCampaign({...campaign, brochure_description: e.target.value})}
                  rows={4}
                  placeholder="Escribe el pitch de venta para el PDF..."
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none"
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Características Destacadas</label>
                <div className="space-y-2">
                  {(campaign.brochure_features || []).map((feature, i) => (
                    <div key={i} className="flex gap-2">
                      <input 
                        type="text" 
                        value={feature}
                        onChange={e => {
                          const updated = [...(campaign.brochure_features || [])];
                          updated[i] = e.target.value;
                          setCampaign({...campaign, brochure_features: updated});
                        }}
                        className="flex-1 bg-black/10 border border-white/5 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                      />
                      <button 
                        onClick={() => {
                          const updated = (campaign.brochure_features || []).filter((_, idx) => idx !== i);
                          setCampaign({...campaign, brochure_features: updated});
                        }}
                        className="p-1.5 text-slate-600 hover:text-red-400"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => setCampaign({...campaign, brochure_features: [...(campaign.brochure_features || []), ""]})}
                    className="w-full py-2 border border-dashed border-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-500 hover:border-blue-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3 h-3" /> Añadir Beneficio
                  </button>
                </div>
              </div>
            </div>
          </EditorSection>

          {/* Section: Property Selection */}
          <EditorSection title="Proyectos a Incluir" icon={Building2}>
            <p className="text-[10px] text-slate-500 font-medium mb-4 italic">Selecciona los proyectos del catálogo que aparecerán en las fichas técnicas del PDF.</p>
            <div className="space-y-2">
              {properties.map((prop) => (
                <div 
                  key={prop.id}
                  onClick={() => toggleProperty(prop.id)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group",
                    campaign.properties?.includes(prop.id) 
                      ? "bg-blue-600/10 border-blue-500/30" 
                      : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                      campaign.properties?.includes(prop.id) ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-500"
                    )}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{prop.name}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{prop.location}</p>
                    </div>
                  </div>
                  {campaign.properties?.includes(prop.id) && (
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  )}
                </div>
              ))}
              {properties.length === 0 && (
                <div className="p-4 rounded-2xl border border-dashed border-white/10 text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No hay propiedades disponibles</p>
                  <button onClick={() => router.push("/dashboard/properties")} className="text-blue-500 text-[10px] font-bold uppercase underline mt-2">Ir al catálogo</button>
                </div>
              )}
            </div>
          </EditorSection>

        </div>

        {/* Right Panel: Live Preview */}
        <div className="flex-1 bg-black/40 flex flex-col p-8 relative">
          <div className="flex-1 bg-white rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/5 relative group">
            <BrochurePreview 
              campaign={campaign} 
              selectedProperties={properties.filter(p => campaign.properties?.includes(p.id))} 
            />
            
            {/* Float Overlay for PDF Access */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <a 
                href={previewUrl} 
                target="_blank" 
                className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 backdrop-blur-md text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl border border-white/10 hover:bg-blue-600 transition-all"
              >
                Ver PDF Real
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-8 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">
            <span>Página 1: Portada</span>
            <div className="w-1 h-1 bg-slate-800 rounded-full" />
            <span>Página 2: Introducción</span>
            <div className="w-1 h-1 bg-slate-800 rounded-full" />
            <span>Páginas 3+: Fichas de Proyectos ({campaign.properties?.length || 0})</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditorSection({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
        <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="text-[11px] font-black uppercase tracking-[0.1em] text-white/90">{title}</h3>
      </div>
      <div className="px-2">
        {children}
      </div>
    </div>
  );
}
