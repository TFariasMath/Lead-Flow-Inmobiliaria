"use client";

import { useState, useEffect, useDeferredValue } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LandingLayout, { type LandingData } from "@/components/LandingLayout";
import BenefitEditor from "@/components/BenefitEditor";
import { ChevronLeft, Save, Loader2, Monitor, Smartphone, Layout as LayoutIcon, Eye, Zap as ZapIcon, Target, Building2, MapPin, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function NewLandingPage() {
  const { token } = useAuth();
  const router = useRouter();
  
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  
  const [data, setData] = useState<LandingData & { slug: string; is_active: boolean }>({
    title: "Nueva Inversión Inmobiliaria",
    slug: "",
    subtitle: "Descubre una oportunidad única en el corazón de la ciudad.",
    description: "Déjanos tus datos y un asesor experto te contactará en menos de 5 minutos.",
    benefits: [
      { id: "1", icon: "Building", title: "Entrega Inmediata" },
      { id: "2", icon: "User", title: "Asesoría Gratuita" },
      { id: "3", icon: "TrendingUp", title: "Plusvalía Asegurada" },
    ],
    form_config: {
      fields: ["first_name", "last_name", "email", "phone", "company"],
      required: ["first_name", "email"],
    },
    cta_text: "Quiero más información →",
    success_message: "¡Listo! Hemos recibido tu información. Uno de nuestros asesores se pondrá en contacto contigo a la brevedad.",
    primary_color: "#3b82f6",
    image_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1000",
    is_active: true,
    campaign: undefined,
  });

  const deferredData = useDeferredValue(data);

  useEffect(() => {
    if (!token) return;
    // Cargar Campañas y Propiedades para los selectores
    Promise.all([
      fetch(`${API_BASE}/campaigns/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_BASE}/properties/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ]).then(([campData, propData]) => {
      setCampaigns(campData.results || campData);
      setProperties(propData.results || propData);
    }).catch(console.error);
  }, [token]);

  const handleCampaignChange = (campaignId: string) => {
    const selected = campaigns.find(c => String(c.id) === campaignId);
    if (selected) {
      setData({
        ...data,
        campaign: Number(campaignId),
        title: selected.name,
      });
    } else {
      setData({ ...data, campaign: undefined });
    }
  };

  const handleSave = async () => {
    if (!token) return;
    if (!data.slug) {
        alert("El slug es necesario para la URL.");
        return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/landings/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Error al crear la landing page");
      }
      
      router.push("/dashboard/landings");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#0f172a] text-white overflow-hidden -m-8">
      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-6 bg-[#1a1d27] border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-lg text-slate-400">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-white/10" />
          <h1 className="font-bold">Crear Nueva Landing</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex bg-black/20 rounded-lg p-1">
            <button 
              onClick={() => setPreviewMode("desktop")}
              className={`p-1.5 rounded ${previewMode === "desktop" ? 'bg-white/10 text-white' : 'text-slate-500'}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setPreviewMode("mobile")}
              className={`p-1.5 rounded ${previewMode === "mobile" ? 'bg-white/10 text-white' : 'text-slate-500'}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 rounded-lg font-bold hover:bg-blue-500 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Crear Landing
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor */}
        <div className="w-[420px] border-r border-white/5 bg-[#11141d]/80 backdrop-blur-xl overflow-y-auto p-6 space-y-4 custom-scrollbar z-20 shadow-2xl">
          <div className="mb-8">
             <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                   <Monitor className="w-5 h-5" />
                </div>
                <div>
                   <h2 className="font-black text-lg tracking-tight">Constructor</h2>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lead Flow Engine v3</p>
                </div>
             </div>
          </div>

          <AccordionSection title="Estrategia & Conexión" icon={Target} defaultOpen>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Campaña de Origen</label>
                <select 
                  value={data.campaign || ""} 
                  onChange={(e) => handleCampaignChange(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Independiente (Sin Campaña)</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Título de la Página</label>
                <input 
                  type="text"
                  value={data.title}
                  onChange={(e) => setData({...data, title: e.target.value})}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                  placeholder="ej: Inversión en Santiago"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ruta (Slug)</label>
                <input 
                  type="text"
                  value={data.slug}
                  onChange={(e) => setData({...data, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                  placeholder="ej: oferta-exclusiva"
                />
                <div className="flex items-center gap-2 mt-2 px-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   <p className="text-[9px] font-bold text-slate-500 truncate">
                      leadflow.com/l/<span className="text-emerald-400">{data.slug || "ruta-final"}</span>
                   </p>
                </div>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="Identidad Visual" icon={Eye}>
             <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Imagen Hero (URL)</label>
                   <input 
                     type="text"
                     value={data.image_url}
                     onChange={(e) => setData({...data, image_url: e.target.value})}
                     className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Color de Marca</label>
                   <div className="flex gap-3 items-center">
                      <input 
                        type="color"
                        value={data.primary_color}
                        onChange={(e) => setData({...data, primary_color: e.target.value})}
                        className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                      />
                      <input 
                        type="text"
                        value={data.primary_color}
                        onChange={(e) => setData({...data, primary_color: e.target.value})}
                        className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-sm font-mono text-white"
                      />
                   </div>
                </div>
             </div>
          </AccordionSection>

          <AccordionSection title="Beneficios Clave" icon={ZapIcon}>
            <div className="space-y-4 pt-2">
              {data.benefits.map((benefit, idx) => (
                <div key={benefit.id} className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-2 relative group">
                  <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Beneficio {idx + 1}</div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={benefit.icon} 
                      onChange={(e) => {
                        const newBenefits = [...data.benefits];
                        newBenefits[idx].icon = e.target.value;
                        setData({...data, benefits: newBenefits});
                      }}
                      className="w-16 bg-black/40 border border-white/5 rounded-lg px-2 py-1.5 text-[10px] font-bold focus:outline-none"
                      placeholder="Icon"
                    />
                    <input 
                      type="text" 
                      value={benefit.title} 
                      onChange={(e) => {
                        const newBenefits = [...data.benefits];
                        newBenefits[idx].title = e.target.value;
                        setData({...data, benefits: newBenefits});
                      }}
                      className="flex-1 bg-black/40 border border-white/5 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                      placeholder="Descripción..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </AccordionSection>

          <AccordionSection title="Conversión & Lead" icon={Smartphone}>
             <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subtítulo Hero</label>
                   <textarea 
                     value={data.subtitle}
                     onChange={(e) => setData({...data, subtitle: e.target.value})}
                     className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                     rows={3}
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Texto CTA (Botón)</label>
                   <input 
                     type="text"
                     value={data.cta_text}
                     onChange={(e) => setData({...data, cta_text: e.target.value})}
                     className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                   />
                </div>
             </div>
          </AccordionSection>
        </div>

        {/* Right: Preview */}
        <div className="flex-1 bg-black/40 flex items-center justify-center p-8 relative">
          <div className="absolute top-4 left-4 text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Live Preview
          </div>
          
          <div 
            className={`bg-[#0f172a] shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden transition-all duration-500 ${previewMode === "mobile" ? 'w-[375px] h-[667px]' : 'w-full h-full'}`}
            style={{ containerType: 'inline-size' }}
          >
            <div className={`w-full h-full overflow-y-auto overflow-x-hidden ${previewMode === "desktop" ? 'scale-[0.85] lg:scale-[1] origin-center' : 'scale-[1] origin-top'}`}>
               <LandingLayout 
                 data={deferredData} 
                 onSubmit={async () => {}} 
                 submitting={false}
               />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccordionSection({ title, icon: Icon, children, defaultOpen = false }: any) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01] mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-blue-400">
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">{title}</h3>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-slate-600 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>
      
      <div className={cn(
        "grid transition-all duration-300 ease-in-out",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
      )}>
        <div className="overflow-hidden">
          <div className="p-4 pt-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
