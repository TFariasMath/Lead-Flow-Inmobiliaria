"use client";

import React from "react";
import * as LucideIcons from "lucide-react";
import MapSection from "./MapSection";

export interface Benefit {
  icon: string;
  title: string;
}

export interface LandingData {
  title: string;
  subtitle: string;
  description: string;
  benefits: Benefit[];
  form_config?: any;
  cta_text: string;
  success_message: string;
  primary_color: string;
  image_url: string;
  campaign_name?: string;
  visits_count?: number;
  conversion_rate?: number;
  latitude?: number;
  longitude?: number;
  campaign?: number;
  properties_details?: any[];
}

interface LandingLayoutProps {
  data: LandingData;
  onSubmit: (values: any) => Promise<void>;
  submitting?: boolean;
  error?: string;
  submitted?: boolean;
}

const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.HelpCircle;
  return <IconComponent className={className} />;
};

export default function LandingLayout({
  data,
  onSubmit,
  submitting = false,
  error = "",
  submitted = false,
}: LandingLayoutProps) {
  const [form, setForm] = React.useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    company: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const primaryColor = data.primary_color || "#3b82f6";

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <LucideIcons.CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">¡Listo!</h2>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed">
            {data.success_message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-medium hover:opacity-80 transition-colors"
            style={{ color: primaryColor }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-blue-500/30 flex relative overflow-hidden font-sans @container">
      <style>{`
        :root { --primary: ${primaryColor}; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease forwards; }
        
        /* Fluid Typography based on container width */
        .fluid-h1 { font-size: clamp(1.8rem, 8cqw, 3.5rem); line-height: 1.1; }
        .fluid-p { font-size: clamp(0.9rem, 2.5cqw, 1.15rem); line-height: 1.6; }
      `}</style>

      {/* Decorative Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px] pointer-events-none" style={{ backgroundColor: primaryColor }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 @[50rem]:grid-cols-2 min-h-screen">
        {/* Left Column: Content */}
        <div className="flex flex-col justify-center p-6 @[50rem]:p-12 lg:p-16 z-10 animate-fadeInUp">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-sm font-semibold mb-6 border border-white/10 w-fit" style={{ color: primaryColor }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: primaryColor }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: primaryColor }}></span>
            </span>
            {data.campaign_name || "Oportunidad de Inversión"}
          </div>
          
          <h1 className="fluid-h1 font-extrabold tracking-tight text-white mb-6">
            {data.title}
          </h1>
          
          <p className="fluid-p text-slate-400 mb-10 max-w-lg">
            {data.subtitle}
          </p>
          
          <div className="space-y-4 mb-10">
            {data.benefits?.map((benefit, idx) => (
              <FeatureItem key={idx} icon={benefit.icon} title={benefit.title} />
            ))}
          </div>

          {(data.latitude || (data.properties_details && data.properties_details.length > 0)) && (
            <div className="mt-8 @[40rem]:mt-12 h-[350px] w-full animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                <MapSection 
                    latitude={data.latitude} 
                    longitude={data.longitude} 
                    properties={data.properties_details} 
                    primaryColor={primaryColor} 
                />
            </div>
          )}

          {data.image_url && (
            <div className="mt-8 rounded-2xl overflow-hidden border border-white/10 shadow-2xl max-w-lg hidden @[40rem]:block opacity-60 hover:opacity-100 transition-opacity">
                <img src={data.image_url} alt="Preview" className="w-full h-48 object-cover" />
            </div>
          )}
        </div>

        {/* Right Column: Form */}
        <div className="flex items-center justify-center p-4 @[50rem]:p-8 lg:p-12 z-10 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <div className="w-full max-w-md bg-[#1a1d27]/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 @[50rem]:p-8 shadow-2xl">
            <h2 className="text-xl @[50rem]:text-2xl font-bold text-white mb-2">Déjanos tus datos</h2>
            <p className="text-xs @[50rem]:text-sm text-slate-400 mb-6 @[50rem]:mb-8">{data.description}</p>
            
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 @[30rem]:grid-cols-2 gap-4">
                {data.form_config?.fields?.includes("first_name") && (
                  <Input name="first_name" placeholder="Nombre" icon="User" value={form.first_name} onChange={(v: string) => setForm(f => ({...f, first_name: v}))} />
                )}
                {data.form_config?.fields?.includes("last_name") && (
                  <Input name="last_name" placeholder="Apellido" icon="User" value={form.last_name} onChange={(v: string) => setForm(f => ({...f, last_name: v}))} />
                )}
              </div>
              
              <Input name="email" type="email" placeholder="Correo electrónico" icon="Mail" value={form.email} onChange={(v: string) => setForm(f => ({...f, email: v}))} required />
              
              {data.form_config?.fields?.includes("phone") && (
                <Input name="phone" type="tel" placeholder="Teléfono" icon="Phone" value={form.phone} onChange={(v: string) => setForm(f => ({...f, phone: v}))} />
              )}
              
              {data.form_config?.fields?.includes("company") && (
                <Input name="company" placeholder="Empresa (Opcional)" icon="Building" value={form.company} onChange={(v: string) => setForm(f => ({...f, company: v}))} />
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 @[50rem]:mt-6 flex items-center justify-center gap-2 py-3 @[50rem]:py-4 rounded-xl text-white font-bold text-base @[50rem]:text-lg shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`, boxShadow: `0 10px 25px -5px ${primaryColor}40` }}
              >
                {submitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {data.cta_text}
                    <LucideIcons.Send className="w-5 h-5" />
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-slate-500 mt-6 uppercase tracking-widest font-semibold">
                🔒 Privacidad Garantizada
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
        <DynamicIcon name={icon} className="w-6 h-6 text-slate-300" />
      </div>
      <span className="text-slate-300 font-semibold text-lg">{title}</span>
    </div>
  );
}

function Input({ name, type = "text", placeholder, icon, value, onChange, required = false }: any) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <DynamicIcon name={icon} className="h-4 w-4 text-slate-500" />
      </div>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-transparent transition-all"
      />
    </div>
  );
}
