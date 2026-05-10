"use client";

import React from "react";
import * as LucideIcons from "lucide-react";
import MapSection from "./MapSection";
import PropertyCarousel from "./PropertyCarousel";

const COUNTRY_CODES = [
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+51", country: "Perú", flag: "🇵🇪" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+52", country: "México", flag: "🇲🇽" },
  { code: "+34", country: "España", flag: "🇪🇸" },
  { code: "+1", country: "USA/Dom", flag: "🇺🇸" },
  { code: "+598", country: "Uruguay", flag: "🇺🇾" },
  { code: "+591", country: "Bolivia", flag: "🇧🇴" },
  { code: "+593", country: "Ecuador", flag: "🇪🇨" },
  { code: "+506", country: "Costa Rica", flag: "🇨🇷" },
  { code: "+507", country: "Panamá", flag: "🇵🇦" },
];

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
    phone_code: "+56",
    phone: "",
    company: "",
  });
  
  const [activePropertyIndex, setActivePropertyIndex] = React.useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalForm = { ...form };
    if (form.phone) {
        finalForm.phone = `${form.phone_code}${form.phone.replace(/\s+/g, '')}`;
    }
    const { phone_code, ...rest } = finalForm;
    onSubmit(rest);
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
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-blue-500/30 flex flex-col relative overflow-x-hidden font-sans @container">
      <style>{`
        :root { --primary: ${primaryColor}; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease forwards; }
        
        .fluid-h1 { font-size: clamp(2.5rem, 8cqw, 4rem); line-height: 1.1; }
        .fluid-p { font-size: clamp(1rem, 2.5cqw, 1.25rem); line-height: 1.6; }
      `}</style>

      {/* 1. Header Section (Title & Subtitle) */}
      <div className="w-full max-w-7xl mx-auto px-6 pt-16 pb-8 md:pt-24 md:pb-12 text-center animate-fadeInUp">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 text-xs font-black uppercase tracking-[0.2em] mb-4 border border-white/10" style={{ color: primaryColor }}>
              {data.campaign_name || "Oportunidad Exclusiva"}
          </div>
          <h1 className="fluid-h1 font-black tracking-tight text-white">
              {data.title}
          </h1>
          <p className="fluid-p text-slate-400 max-w-2xl mx-auto">
              {data.subtitle}
          </p>
        </div>
      </div>

      {/* 2. Visual Block (Carousel & Map Together) */}
      <div className="w-full flex flex-col animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
        <PropertyCarousel 
          properties={data.properties_details || []} 
          primaryColor={primaryColor} 
          currentIndex={activePropertyIndex}
          onIndexChange={setActivePropertyIndex}
        />
        
        {/* Combined Map and Info Section */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-10 border-y border-white/10 bg-[#0f172a] min-h-[400px] lg:min-h-[500px]">
            {/* Map (40% on desktop) */}
            {(data.latitude || (data.properties_details && data.properties_details.length > 0)) && (
                <div className="lg:col-span-4 h-[350px] lg:h-auto relative border-b lg:border-b-0 lg:border-r border-white/5 order-2 lg:order-1">
                    <MapSection 
                        latitude={data.latitude} 
                        longitude={data.longitude} 
                        properties={data.properties_details} 
                        primaryColor={primaryColor} 
                        activePropertyIndex={activePropertyIndex}
                    />
                </div>
            )}

            {/* Property Info Panel (60% on desktop) */}
            {data.properties_details && data.properties_details.length > 0 && (
                <div className="lg:col-span-6 h-auto bg-white/[0.02] backdrop-blur-md p-6 md:p-12 flex flex-col justify-between order-1 lg:order-2">
                    <div className="space-y-6 md:space-y-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-[9px] font-black uppercase tracking-widest text-blue-400 mb-4 border border-blue-500/20">
                                Información de la Unidad
                            </div>
                            <h2 className="text-2xl md:text-4xl font-black text-white mb-4 tracking-tight">
                                {data.properties_details[activePropertyIndex].name}
                            </h2>
                            <p className="text-sm md:text-lg text-slate-400 leading-relaxed max-w-3xl">
                                {data.properties_details[activePropertyIndex].description || "Una excelente oportunidad de inversión en una ubicación privilegiada con terminaciones de primer nivel."}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                    <LucideIcons.MapPin className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="min-w-0">
                                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Ubicación</span>
                                    <span className="text-xs md:text-sm text-white font-bold truncate block">{data.properties_details[activePropertyIndex].address || data.properties_details[activePropertyIndex].location || "Sector Privilegiado"}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                    <LucideIcons.Calendar className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Entrega</span>
                                    <span className="text-xs md:text-sm text-white font-bold block">{data.properties_details[activePropertyIndex].delivery_date || "Inmediata"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <LucideIcons.Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                                Equipamiento Destacado
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {(() => {
                                    const amenities = data.properties_details[activePropertyIndex].amenities;
                                    let amenitiesList = [];
                                    if (Array.isArray(amenities)) amenitiesList = amenities;
                                    else if (typeof amenities === 'string' && amenities.trim() !== '') amenitiesList = amenities.split(',');
                                    else amenitiesList = ['Gym', 'Piscina', 'Quincho', 'Seguridad'];

                                    return amenitiesList.map((amenity: string, idx: number) => (
                                        <span key={idx} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                            {amenity.trim()}
                                        </span>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 lg:mt-0 pt-8 border-t border-white/10">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Inversión desde</span>
                                <span className="text-xl md:text-2xl font-black text-white">{data.properties_details[activePropertyIndex].min_investment}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Rentabilidad</span>
                                <span className="text-xl md:text-2xl font-black text-emerald-400">{data.properties_details[activePropertyIndex].estimated_return}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* 3. Benefits Section (Global) */}
      <div className="w-full max-w-7xl mx-auto px-6 py-20 z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            {data.benefits?.map((benefit, idx) => (
              <FeatureCard key={idx} icon={benefit.icon} title={benefit.title} />
            ))}
          </div>
      </div>

      {/* 4. Registration Form (At the Bottom) */}
      <div id="register" className="w-full bg-[#1a1d27]/40 backdrop-blur-3xl border-t border-white/10 py-24 px-6 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
                <div className="space-y-4">
                    <h2 className="text-4xl md:text-5xl font-black text-white">Inscríbete para más información</h2>
                    <p className="text-xl text-slate-400 leading-relaxed">
                        {data.description || "Déjanos tus datos y un asesor experto se pondrá en contacto contigo para brindarte todos los detalles de esta oportunidad de inversión."}
                    </p>
                </div>
                
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4 text-slate-300">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                            <LucideIcons.CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        </div>
                        <span className="font-medium uppercase tracking-widest text-[10px] font-bold">Asesoría de inversión gratuita</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-bold text-slate-500">
                        <div className="w-12 h-px bg-slate-800" />
                        PRIVACIDAD GARANTIZADA
                    </div>
                </div>
            </div>

            <div className="bg-[#0f172a] border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -z-10" />
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Nombre" placeholder="Tu nombre" icon="User" value={form.first_name} onChange={(v: string) => setForm(f => ({...f, first_name: v}))} required />
                        <Input label="Apellido" placeholder="Tu apellido" icon="User" value={form.last_name} onChange={(v: string) => setForm(f => ({...f, last_name: v}))} />
                    </div>
                    
                    <Input label="Email" type="email" placeholder="ejemplo@correo.com" icon="Mail" value={form.email} onChange={(v: string) => setForm(f => ({...f, email: v}))} required />
                    
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Teléfono de contacto</label>
                        <div className="flex gap-2">
                            <div className="w-[110px] shrink-0">
                                <select
                                    value={form.phone_code}
                                    onChange={(e) => setForm(f => ({...f, phone_code: e.target.value}))}
                                    className="w-full h-[52px] bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 appearance-none cursor-pointer px-4"
                                >
                                    {COUNTRY_CODES.map(c => (
                                        <option key={c.code} value={c.code} className="bg-[#1a1d27]">{c.flag} {c.code}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <Input noLabel placeholder="9 1234 5678" type="tel" icon="Phone" value={form.phone} onChange={(v: string) => setForm(f => ({...f, phone: v}))} />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-5 rounded-2xl text-white font-black text-lg shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`, boxShadow: `0 15px 35px -10px ${primaryColor}60` }}
                    >
                        {submitting ? (
                            <LucideIcons.Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                {data.cta_text || "Solicitar Información"}
                                <LucideIcons.ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                    <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest font-bold">Respuesta en menos de 5 minutos</p>
                </form>
            </div>
        </div>
      </div>

      {/* Decorative Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-20 blur-[150px]" style={{ backgroundColor: primaryColor }} />
          <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[60%] rounded-full bg-purple-600/10 blur-[150px]" />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group hover:-translate-y-2">
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
        <DynamicIcon name={icon} className="w-8 h-8 text-slate-300" />
      </div>
      <span className="text-white font-bold text-xl text-center">{title}</span>
    </div>
  );
}

function Input({ label, placeholder, type = "text", icon, value, onChange, required = false, noLabel = false }: any) {
  return (
    <div className="space-y-2">
      {!noLabel && <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest px-1">{label}</label>}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <DynamicIcon name={icon} className="h-5 w-5 text-slate-500" />
        </div>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full pl-12 pr-4 h-[52px] bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition-all"
        />
      </div>
    </div>
  );
}
