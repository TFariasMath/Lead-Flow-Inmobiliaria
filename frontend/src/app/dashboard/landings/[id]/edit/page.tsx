"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LandingLayout, { type LandingData } from "@/components/LandingLayout";
import { ChevronLeft, Save, Loader2, Eye, Layout as LayoutIcon, Smartphone, Monitor, Zap as ZapIcon } from "lucide-react";
import BenefitEditor from "@/components/BenefitEditor";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function LandingBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  
  // State for the landing data (form fields)
  const [data, setData] = useState<LandingData & { slug: string; is_active: boolean; campaign?: any }>({
    title: "",
    slug: "",
    subtitle: "",
    description: "",
    benefits: [],
    form_config: {
      fields: ["first_name", "last_name", "email", "phone", "company"],
      required: ["first_name", "email"],
    },
    cta_text: "Quiero más información →",
    success_message: "",
    primary_color: "#3b82f6",
    image_url: "",
    is_active: true,
  });

  useEffect(() => {
    if (!token || id === "new") {
        setLoading(false);
        return;
    }
    fetch(`${API_BASE}/landings/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(console.error);
  }, [id, token]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const url = id === "new" ? `${API_BASE}/landings/` : `${API_BASE}/landings/${id}/`;
      const method = id === "new" ? "POST" : "PATCH";
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(JSON.stringify(errorData));
      }
      
      router.push("/dashboard/landings");
    } catch (err: any) {
      console.error(err);
      alert(`Error al guardar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f172a]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0f172a] text-white overflow-hidden -m-8">
      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-6 bg-[#1a1d27] border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-lg text-slate-400">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-white/10" />
          <h1 className="font-bold">Editor Visual de Landing</h1>
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
            {id === "new" ? "Crear Landing" : "Guardar Cambios"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor */}
        <div className="w-[400px] border-r border-white/5 bg-[#141721] overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <Section title="Estructura Base" icon={LayoutIcon}>
            <Field label="Título de la Página" value={data.title} onChange={v => setData({...data, title: v})} placeholder="ej: Departamento en Santiago" />
            <Field label="Slug de URL" value={data.slug} onChange={v => setData({...data, slug: v})} placeholder="ej: santiago-centro" />
          </Section>

          <Section title="Contenido Hero" icon={Eye}>
            <Field label="Subtítulo" type="textarea" value={data.subtitle} onChange={v => setData({...data, subtitle: v})} placeholder="Una breve descripción que atrape..." />
            <Field label="Imagen de Fondo (URL)" value={data.image_url} onChange={v => setData({...data, image_url: v})} placeholder="https://..." />
            <Field label="Color Principal" type="color" value={data.primary_color} onChange={v => setData({...data, primary_color: v})} />
          </Section>

          <Section title="Beneficios" icon={ZapIcon}>
            <BenefitField 
              label="Beneficio 1" 
              title={data.benefit_1_title} 
              icon={data.benefit_1_icon} 
              onTitleChange={v => setData({...data, benefit_1_title: v})}
              onIconChange={v => setData({...data, benefit_1_icon: v})}
            />
            <BenefitField 
              label="Beneficio 2" 
              title={data.benefit_2_title} 
              icon={data.benefit_2_icon} 
              onTitleChange={v => setData({...data, benefit_2_title: v})}
              onIconChange={v => setData({...data, benefit_2_icon: v})}
            />
            <BenefitField 
              label="Beneficio 3" 
              title={data.benefit_3_title} 
              icon={data.benefit_3_icon} 
              onTitleChange={v => setData({...data, benefit_3_title: v})}
              onIconChange={v => setData({...data, benefit_3_icon: v})}
            />
          </Section>

          <Section title="Conversión (Formulario)" icon={Smartphone}>
            <Field label="Descripción del Formulario" type="textarea" value={data.description} onChange={v => setData({...data, description: v})} />
            <Field label="Texto del Botón (CTA)" value={data.cta_text} onChange={v => setData({...data, cta_text: v})} />
            <Field label="Mensaje de Éxito" type="textarea" value={data.success_message} onChange={v => setData({...data, success_message: v})} />
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
