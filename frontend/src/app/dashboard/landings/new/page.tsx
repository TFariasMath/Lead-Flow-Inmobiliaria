"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LandingLayout, { type LandingData } from "@/components/LandingLayout";
import { ChevronLeft, Save, Loader2, Monitor, Smartphone, Layout as LayoutIcon, Eye, Zap as ZapIcon } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function NewLandingPage() {
  const { token } = useAuth();
  const router = useRouter();
  
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  
  const [data, setData] = useState<LandingData & { slug: string; is_active: boolean }>({
    title: "Nueva Inversión Inmobiliaria",
    slug: "",
    subtitle: "Descubre una oportunidad única en el corazón de la ciudad.",
    description: "Déjanos tus datos y un asesor experto te contactará en menos de 5 minutos.",
    benefit_1_icon: "Building",
    benefit_1_title: "Entrega Inmediata",
    benefit_2_icon: "User",
    benefit_2_title: "Asesoría Gratuita",
    benefit_3_icon: "TrendingUp",
    benefit_3_title: "Plusvalía Asegurada",
    cta_text: "Quiero más información →",
    success_message: "¡Listo! Hemos recibido tu información. Uno de nuestros asesores se pondrá en contacto contigo a la brevedad.",
    primary_color: "#3b82f6",
    image_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1000",
    is_active: true,
  });

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
        <div className="w-[400px] border-r border-white/5 bg-[#141721] overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <Section title="Estructura Base" icon={LayoutIcon}>
            <Field label="Título de la Página" value={data.title} onChange={(v: string) => setData({...data, title: v})} placeholder="ej: Departamento en Santiago" />
            <Field label="Slug de URL" value={data.slug} onChange={(v: string) => setData({...data, slug: v.toLowerCase().replace(/\s+/g, '-')})} placeholder="ej: santiago-centro" />
          </Section>

          <Section title="Contenido Hero" icon={Eye}>
            <Field label="Subtítulo" type="textarea" value={data.subtitle} onChange={(v: string) => setData({...data, subtitle: v})} placeholder="Una breve descripción que atrape..." />
            <Field label="Imagen de Fondo (URL)" value={data.image_url} onChange={(v: string) => setData({...data, image_url: v})} placeholder="https://..." />
            <Field label="Color Principal" type="color" value={data.primary_color} onChange={(v: string) => setData({...data, primary_color: v})} />
          </Section>

          <Section title="Beneficios" icon={ZapIcon}>
            <BenefitField 
              label="Beneficio 1" 
              title={data.benefit_1_title} 
              icon={data.benefit_1_icon} 
              onTitleChange={(v: string) => setData({...data, benefit_1_title: v})}
              onIconChange={(v: string) => setData({...data, benefit_1_icon: v})}
            />
            <BenefitField 
              label="Beneficio 2" 
              title={data.benefit_2_title} 
              icon={data.benefit_2_icon} 
              onTitleChange={(v: string) => setData({...data, benefit_2_title: v})}
              onIconChange={(v: string) => setData({...data, benefit_2_icon: v})}
            />
            <BenefitField 
              label="Beneficio 3" 
              title={data.benefit_3_title} 
              icon={data.benefit_3_icon} 
              onTitleChange={(v: string) => setData({...data, benefit_3_title: v})}
              onIconChange={(v: string) => setData({...data, benefit_3_icon: v})}
            />
          </Section>

          <Section title="Conversión (Formulario)" icon={Smartphone}>
            <Field label="Descripción del Formulario" type="textarea" value={data.description} onChange={(v: string) => setData({...data, description: v})} />
            <Field label="Texto del Botón (CTA)" value={data.cta_text} onChange={(v: string) => setData({...data, cta_text: v})} />
            <Field label="Mensaje de Éxito" type="textarea" value={data.success_message} onChange={(v: string) => setData({...data, success_message: v})} />
          </Section>
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
            <div className={`w-full h-full overflow-y-auto overflow-x-hidden ${previewMode === "desktop" ? 'scale-[0.8] lg:scale-[1] origin-center' : 'scale-[1] origin-top'}`}>
               <LandingLayout 
                 data={data} 
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

function Section({ title, icon: Icon, children }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-slate-400 mb-4">
        <Icon className="w-4 h-4" />
        <h3 className="text-xs font-bold uppercase tracking-widest">{title}</h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      )}
    </div>
  );
}

function BenefitField({ label, title, icon, onTitleChange, onIconChange }: any) {
  return (
    <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-3">
      <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{label}</div>
      <div className="flex gap-2">
        <input
          type="text"
          value={icon}
          onChange={(e) => onIconChange(e.target.value)}
          placeholder="Icono (Lucide)"
          className="w-24 bg-black/30 border border-white/5 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Descripción corta"
          className="flex-1 bg-black/30 border border-white/5 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
      </div>
    </div>
  );
}
