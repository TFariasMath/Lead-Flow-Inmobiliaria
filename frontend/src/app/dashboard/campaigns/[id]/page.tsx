/**
 * Lead Flow - Campaign & Brochure Editor (Visual v4)
 * =================================================
 * Interfaz avanzada para configurar la campaña y previsualizar el brochure PDF.
 * Incluye un buscador de propiedades visual e intuitivo.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  getCampaign, 
  updateCampaign,
  createCampaign, 
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
  Settings2,
  ExternalLink,
  Plus,
  Trash,
  Search,
  MapPin,
  TrendingUp,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import BrochurePreview from "@/components/BrochurePreview";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

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
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [propertySearch, setPropertySearch] = useState("");

  const debouncedCampaign = useDebounce(campaign, 1500);

  useEffect(() => {
    if (!token) return;
    setLoading(true);

    const loadData = async () => {
      try {
        const propData = await getProperties(token);
        const props = Array.isArray(propData) ? propData : (propData as any).results || [];
        setAllProperties(props);

        if (id !== "new") {
          const campData = await getCampaign(token, id as string);
          setCampaign(campData);
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
          setPreviewUrl(`${baseUrl}/campaigns/${id}/brochure-preview/?token=${token}`);
          setLastSaved(new Date());
        } else {
          setCampaign({
            id: 0,
            name: "Nueva Campaña",
            slug: "nueva-campaña",
            budget: "0",
            is_active: true,
            start_date: null,
            end_date: null,
            brochure_title: "",
            brochure_description: "",
            brochure_features: [],
            properties: []
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, token]);

  useEffect(() => {
    if (debouncedCampaign && token && id !== "new" && lastSaved) {
      handleSave(true);
    }
  }, [debouncedCampaign]);

  const handleSave = async (isAuto = false) => {
    if (!token || !campaign || !id) return;
    
    // Validación de campos obligatorios
    if (!campaign.name?.trim()) {
      if (!isAuto) alert("Falta el Nombre de la Campaña");
      return;
    }
    if (!campaign.brochure_title?.trim()) {
      if (!isAuto) alert("Falta el Título de Portada para el PDF");
      return;
    }

    if (!isAuto) setSaving(true);
    try {
      if (id === "new") {
        const newCamp = await createCampaign(token, campaign);
        router.replace(`/dashboard/campaigns/${newCamp.id}`);
      } else {
        await updateCampaign(token, id as string, campaign);
        setLastSaved(new Date());
      }
    } catch (err) {
      console.error(err);
      if (!isAuto) alert("Error al guardar: Verifica que el nombre no esté duplicado.");
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

  const filteredProperties = useMemo(() => {
    return allProperties.filter(p => 
      p.name.toLowerCase().includes(propertySearch.toLowerCase()) ||
      p.location.toLowerCase().includes(propertySearch.toLowerCase())
    );
  }, [allProperties, propertySearch]);

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
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest tracking-[0.2em]">Configurador v4 Premium</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {lastSaved && (
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mr-2">
              Autoguardado: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="flex items-center gap-3 px-8 py-3.5 bg-white text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-50 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0"
            >
              {saving ? "Guardando..." : "Guardar Campaña"}
              <Save className="w-4 h-4" />
            </button>

            {id !== "new" && (
              <a 
                href={`${process.env.NEXT_PUBLIC_API_URL}/campaigns/${id}/download_pdf/?token=${token}`} 
                download={`Brochure_${campaign.name}.pdf`}
                className="flex items-center gap-3 px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:-translate-y-0.5 transition-all"
              >
                Descargar PDF
                <Download className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Editor */}
        <div className="w-[500px] border-r border-white/5 bg-[#141721] overflow-y-auto p-8 space-y-12 custom-scrollbar">
          
          <EditorSection title="Estrategia & Estado" icon={Settings2}>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre de la Campaña</label>
                <input 
                  type="text" 
                  value={campaign.name} 
                  onChange={e => {
                    const newName = e.target.value;
                    const newSlug = newName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                    setCampaign({...campaign, name: newName, slug: newSlug});
                  }}
                  placeholder="Ej: Inversión Verano 2024"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Presupuesto USD</label>
                  <input 
                    type="text" 
                    value={campaign.budget} 
                    onChange={e => setCampaign({...campaign, budget: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/30 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Disponibilidad</label>
                  <button 
                    onClick={() => setCampaign({...campaign, is_active: !campaign.is_active})}
                    className={cn(
                      "w-full h-[46px] rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                      campaign.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}
                  >
                    {campaign.is_active ? "Activa" : "Inactiva"}
                  </button>
                </div>
              </div>
            </div>
          </EditorSection>

          <EditorSection title="Marketing Brochure" icon={FileText}>
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Título Portada</label>
                <input 
                  type="text" 
                  value={campaign.brochure_title} 
                  onChange={e => setCampaign({...campaign, brochure_title: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Introducción / Pitch Comercial</label>
                <textarea 
                  value={campaign.brochure_description} 
                  onChange={e => setCampaign({...campaign, brochure_description: e.target.value})}
                  rows={4}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/30 transition-all resize-none"
                />
              </div>
            </div>
          </EditorSection>

          <EditorSection title="Selector de Activos" icon={Building2}>
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Buscar en el catálogo..."
                  value={propertySearch}
                  onChange={(e) => setPropertySearch(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-xs focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
              </div>

              {/* Property Grid */}
              <div className="grid grid-cols-1 gap-3">
                {filteredProperties.map((prop) => {
                    const isSelected = campaign.properties?.includes(prop.id);
                    const imageUrl = prop.main_image_url ? (prop.main_image_url.startsWith('http') ? prop.main_image_url : `${API_BASE_URL}${prop.main_image_url}`) : null;
                    
                    return (
                        <div 
                          key={prop.id}
                          onClick={() => toggleProperty(prop.id)}
                          className={cn(
                            "flex items-center gap-4 p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group",
                            isSelected 
                              ? "bg-blue-600/10 border-blue-500/40 ring-1 ring-blue-500/20" 
                              : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                          )}
                        >
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                            {imageUrl ? (
                                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-700">
                                    <Building2 className="w-6 h-6" />
                                </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={cn("text-xs font-black truncate mb-1", isSelected ? "text-blue-400" : "text-white")}>
                                {prop.name}
                            </h4>
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                    <MapPin className="w-2.5 h-2.5" /> {prop.location}
                                </span>
                                <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-500/80 uppercase tracking-widest">
                                    <TrendingUp className="w-2.5 h-2.5" /> {prop.estimated_return || '12%'}
                                </span>
                            </div>
                          </div>
                          <div className={cn(
                            "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                            isSelected ? "bg-blue-600 border-blue-500 text-white scale-110" : "border-white/10 text-transparent"
                          )}>
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                        </div>
                    );
                })}
              </div>
            </div>
          </EditorSection>

        </div>

        {/* Right side: Live Preview (Iframe Real) */}
        <div className="flex-1 bg-black/40 p-8 overflow-y-auto custom-scrollbar flex items-center justify-center">
          <div className="w-[600px] aspect-[1/1.41] bg-white rounded-[32px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden group relative">
            
            {/* Iframe que carga el diseño Gold Standard */}
            <iframe 
              src={previewUrl}
              className="w-full h-full border-none"
              title="Brochure Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function EditorSection({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-3 border-b border-white/[0.04]">
        <div className="w-9 h-9 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
}
