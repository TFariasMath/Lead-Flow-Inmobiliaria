"use client";

import React from "react";
import * as LucideIcons from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
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
  const [activePropertyIndex, setActivePropertyIndex] = React.useState(0);
  const [step, setStep] = React.useState(1);
  const totalSteps = 3;

  const validationSchema = Yup.object({
    first_name: Yup.string().required('Ingresa tu nombre'),
    last_name: Yup.string().required('Ingresa tu apellido'),
    email: Yup.string().email('Email inválido').required('El email es obligatorio'),
    phone: Yup.string().min(8, 'El teléfono debe tener al menos 8 dígitos').required('El teléfono es obligatorio'),
    investment_goal: Yup.string().required('Selecciona un objetivo'),
    investment_capacity: Yup.string().required('Selecciona un rango'),
  });

  const formik = useFormik({
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone_code: "+56",
      phone: "",
      investment_goal: "",
      investment_capacity: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      const finalPhone = `${values.phone_code}${values.phone.replace(/\s+/g, '')}`;
      const { phone_code, ...rest } = values;
      onSubmit({ ...rest, phone: finalPhone });
    },
  });

  const nextStep = async () => {
    if (step === 1) {
      if (formik.values.first_name && formik.values.last_name) setStep(2);
      else { formik.setFieldTouched('first_name', true); formik.setFieldTouched('last_name', true); }
    } else if (step === 2) {
      if (formik.values.investment_goal && formik.values.investment_capacity) setStep(3);
    }
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cursor = document.getElementById('custom-cursor');
      const follower = document.getElementById('cursor-follower');
      if (cursor && follower) {
        cursor.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`;
        follower.style.transform = `translate(${e.clientX - 20}px, ${e.clientY - 20}px)`;
      }

      // Reactive Light Global
      document.documentElement.style.setProperty('--mouse-x', `${(e.clientX / window.innerWidth) * 100}%`);
      document.documentElement.style.setProperty('--mouse-y', `${(e.clientY / window.innerHeight) * 100}%`);

      // Local tracking for cards
      const cards = document.querySelectorAll('.bento-card');
      cards.forEach(card => {
        const rect = (card as HTMLElement).getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        (card as HTMLElement).style.setProperty('--mouse-x', `${x}%`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${y}%`);
      });

      // Magnetic Button Effect
      const magneticBtns = document.querySelectorAll('.magnetic-btn');
      magneticBtns.forEach(btn => {
        const rect = (btn as HTMLElement).getBoundingClientRect();
        const btnX = rect.left + rect.width / 2;
        const btnY = rect.top + rect.height / 2;
        const distanceX = e.clientX - btnX;
        const distanceY = e.clientY - btnY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        if (distance < 150) {
          const pullX = distanceX * 0.15;
          const pullY = distanceY * 0.15;
          (btn as HTMLElement).style.transform = `translate(${pullX}px, ${pullY}px) scale(1.05)`;
        } else {
          (btn as HTMLElement).style.transform = `translate(0, 0) scale(1)`;
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const primaryColor = data.primary_color || "#3b82f6";

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-10 text-center shadow-2xl">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <LucideIcons.CheckCircle2 className="w-10 h-10 text-white icon-glow" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 tracking-tight font-outfit uppercase tracking-tighter">¡Protocolo Activado!</h2>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed">
            {data.success_message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="magnetic-btn px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm hover:bg-white/10 transition-all uppercase tracking-widest"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen abstract-bg text-white selection:bg-blue-500/30 flex flex-col relative overflow-x-hidden font-sans">
      <div className="fixed inset-0 dot-grid opacity-40 pointer-events-none -z-10" />
      
      {/* Aurora Layers (Global Atmosphere) */}
      <div className="aurora-layer">
          <div className="aurora-blob bg-blue-600/20 top-[-10%] left-[-10%]" />
          <div className="aurora-blob bg-purple-600/20 bottom-[-10%] right-[-10%]" />
          <div className="aurora-blob bg-blue-400/10 top-[40%] right-[20%]" />
      </div>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;900&family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
      <style jsx global>{`
        body { font-family: 'Inter', sans-serif; cursor: none; background-color: #020617; }
        h1, h2, h3, .font-outfit { font-family: 'Outfit', sans-serif; }
        
        #custom-cursor {
            width: 8px; height: 8px; background: white;
            border-radius: 50%; position: fixed; pointer-events: none;
            z-index: 9999; transition: transform 0.1s ease-out;
            box-shadow: 0 0 20px rgba(255,255,255,0.5);
        }
        #cursor-follower {
            width: 40px; height: 40px; border: 1px solid rgba(255,255,255,0.2);
            border-radius: 50%; position: fixed; pointer-events: none;
            z-index: 9998; transition: transform 0.2s ease-out;
        }

        .fluid-h1 { font-size: clamp(2.5rem, 8cqw, 5rem); line-height: 0.95; font-weight: 900; letter-spacing: -0.05em; }
        .fluid-p { font-size: clamp(1rem, 2.5cqw, 1.15rem); line-height: 1.5; letter-spacing: -0.01em; }

        .abstract-bg {
            background-color: #020617;
            background-image: 
                radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.12) 0px, transparent 50%),
                radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.08) 0px, transparent 50%),
                radial-gradient(at 50% 100%, rgba(15, 23, 42, 1) 0px, transparent 50%);
            position: relative;
        }

        .dot-grid {
            background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
            background-size: 40px 40px;
        }

        .noise-overlay {
            position: fixed; inset: 0; pointer-events: none; z-index: 50;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            opacity: 0.025; contrast: 120%; brightness: 120%;
        }

        .bento-card {
            background: rgba(255,255,255,0.02);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 1.5rem; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative; overflow: hidden;
        }
        
        .bento-card:hover {
            transform: translateY(-4px);
            background: rgba(255,255,255,0.04);
            border-color: rgba(255,255,255,0.1);
        }

        .icon-glow { filter: drop-shadow(0 0 8px currentColor); }
        
        .text-metallic {
            background: linear-gradient(to bottom, #fff, rgba(255,255,255,0.7));
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Aesthetic Overlays */}
      <div className="noise-overlay" />
      <div className="fixed inset-0 dot-grid opacity-40 pointer-events-none -z-10" />

      {/* Custom Cursor */}
      <div id="custom-cursor" className="hidden lg:block" />
      <div id="cursor-follower" className="hidden lg:block" />

      {/* 1. Hero Section (Masterpiece) */}
      <div className="w-full h-[90vh] flex items-center justify-center overflow-hidden">
          <div className="relative z-10 text-center px-6 max-w-4xl">
              <h1 className="fluid-h1 text-metallic mb-8">
                  {data.title}
              </h1>
              <p className="fluid-p text-slate-400 font-medium max-w-xl mx-auto mb-12">
                  {data.description || "Modelos de inversión basados en activos reales con proyección de plusvalía garantizada."}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <a 
                    href="#register" 
                    className="magnetic-btn px-10 py-5 rounded-2xl text-white font-black text-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`, boxShadow: `0 20px 40px -10px ${primaryColor}40` }}
                  >
                      {data.cta_text || "Explorar Activos"}
                  </a>
                  <div className="flex items-center gap-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      <div className="flex -space-x-2">
                          {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-[#020617] bg-slate-800" />)}
                      </div>
                      +120 Inversores Activos
                  </div>
              </div>
          </div>
      </div>

      {/* 2. Visual & Info Block */}
      <div className="w-full flex flex-col">
        <PropertyCarousel 
          properties={data.properties_details || []} 
          primaryColor={primaryColor} 
          currentIndex={activePropertyIndex}
          onIndexChange={setActivePropertyIndex}
        />
        
        <div className="w-full grid grid-cols-1 lg:grid-cols-10 border-y border-white/5 bg-white/[0.01] backdrop-blur-3xl overflow-hidden">
            {(data.latitude || (data.properties_details && data.properties_details.length > 0)) && (
                <div className="lg:col-span-4 min-h-[400px] lg:min-h-[600px] relative order-2 lg:order-1 border-r border-white/5">
                    <div className="absolute inset-0">
                        <MapSection 
                            latitude={data.latitude} 
                            longitude={data.longitude} 
                            properties={data.properties_details} 
                            primaryColor={primaryColor} 
                            activePropertyIndex={activePropertyIndex}
                        />
                    </div>
                </div>
            )}

            {data.properties_details && data.properties_details.length > 0 && (
                <div className="lg:col-span-6 p-10 md:p-24 flex flex-col justify-center order-1 lg:order-2 bg-white/[0.01]">
                    <div className="max-w-2xl w-full mx-auto lg:mx-0 text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                            <div className="w-8 lg:w-10 h-[1px] bg-blue-500/50" />
                            <div className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Propiedad Seleccionada</div>
                        </div>
                        
                        <div className="relative mb-8">
                            <div className="hidden lg:block absolute -left-8 top-0 bottom-0 w-1 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
                            <h2 className="text-3xl md:text-6xl font-black text-white tracking-tight leading-tight mb-6 font-outfit">
                                {data.properties_details[activePropertyIndex].name}
                            </h2>
                            <p className="text-slate-400 text-lg md:text-xl leading-relaxed font-medium max-w-lg mx-auto lg:mx-0">
                                {data.properties_details[activePropertyIndex].description || "Ubicación estratégica con alta demanda y proyección de plusvalía."}
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 pt-10 border-t border-white/5">
                            <div className="bento-card p-6 md:p-8 group/card text-left">
                                <div className="flex items-center gap-3 mb-4">
                                    <LucideIcons.CircleDollarSign className="w-4 h-4 text-slate-500 group-hover/card:text-blue-400 transition-colors" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inversión Mínima</span>
                                </div>
                                <span className="text-2xl md:text-3xl font-black text-white font-outfit tracking-tight">
                                    {data.properties_details[activePropertyIndex].min_investment}
                                </span>
                            </div>
                            
                            <div className="bento-card p-6 md:p-8 group/card text-left">
                                <div className="flex items-center gap-3 mb-4">
                                    <LucideIcons.TrendingUp className="w-4 h-4 text-slate-500 group-hover/card:text-emerald-400 transition-colors" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Retorno Estimado</span>
                                </div>
                                <span className="text-2xl md:text-3xl font-black text-emerald-400 font-outfit tracking-tight">
                                    {data.properties_details[activePropertyIndex].estimated_return}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>


      {/* 4. Registration Form (Multi-step Experience) */}
      <div id="register" className="w-full py-24 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-10 gap-16 items-start">
            <div className="lg:col-span-4 space-y-8 text-center lg:text-left sticky top-24">
                <div className="space-y-4">
                    <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-none">ÚNETE A LA ERA.</h2>
                    <p className="text-xl text-slate-500 font-medium">Asesoría de inversión personalizada en tiempo real.</p>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center justify-center lg:justify-start gap-4">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'w-12 bg-blue-500' : 'w-4 bg-white/10'}`} />
                            <span className={`text-[10px] font-black tracking-widest ${step === s ? 'text-white' : 'text-slate-600'}`}>0{s}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="lg:col-span-6 w-full max-w-2xl mx-auto lg:ml-auto">
                <div className="bento-card p-8 md:p-16 relative overflow-hidden bg-white/[0.02]">
                    <form onSubmit={formik.handleSubmit} className="space-y-8">
                        {step === 1 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Identidad VIP</span>
                                    <h3 className="text-3xl font-black text-white font-outfit">¿Con quién tenemos el gusto?</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input 
                                        label="Nombre" placeholder="Tu nombre" icon="User" 
                                        value={formik.values.first_name} 
                                        onChange={(v: string) => formik.setFieldValue('first_name', v)}
                                        error={formik.touched.first_name && formik.errors.first_name}
                                    />
                                    <Input 
                                        label="Apellido" placeholder="Tu apellido" icon="User" 
                                        value={formik.values.last_name} 
                                        onChange={(v: string) => formik.setFieldValue('last_name', v)}
                                        error={formik.touched.last_name && formik.errors.last_name}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="magnetic-btn w-full py-6 rounded-2xl bg-white text-slate-950 font-black text-sm uppercase tracking-widest shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-all flex items-center justify-center gap-3"
                                >
                                    Continuar <LucideIcons.ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Perfil de Inversión</span>
                                    <h3 className="text-3xl font-black text-white font-outfit">Define tu estrategia</h3>
                                </div>
                                
                                <div className="space-y-6">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Objetivo principal</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {[
                                            { id: 'renta', label: 'Renta', icon: 'Coins' },
                                            { id: 'plusvalia', label: 'Plusvalía', icon: 'TrendingUp' },
                                            { id: 'patrimonio', label: 'Patrimonio', icon: 'Shield' }
                                        ].map((goal) => (
                                            <button
                                                key={goal.id}
                                                type="button"
                                                onClick={() => formik.setFieldValue('investment_goal', goal.id)}
                                                className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-3 ${formik.values.investment_goal === goal.id ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}
                                            >
                                                {React.createElement((LucideIcons as any)[goal.icon], { className: `w-5 h-5 ${formik.values.investment_goal === goal.id ? 'icon-glow' : ''}` })}
                                                <span className="text-[10px] font-bold uppercase">{goal.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block pt-4">Capacidad de inversión</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['USD 100k - 300k', 'USD 300k - 600k', 'USD 600k - 1M', 'USD 1M+'].map((cap) => (
                                            <button
                                                key={cap}
                                                type="button"
                                                onClick={() => formik.setFieldValue('investment_capacity', cap)}
                                                className={`py-3 px-4 rounded-xl border text-[10px] font-bold uppercase transition-all ${formik.values.investment_capacity === cap ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}
                                            >
                                                {cap}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(1)} 
                                        className="magnetic-btn px-8 py-6 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm uppercase tracking-widest transition-all"
                                    >
                                        Atrás
                                    </button>
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="magnetic-btn flex-1 py-6 rounded-2xl bg-white text-slate-950 font-black text-sm uppercase tracking-widest shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-all flex items-center justify-center gap-3"
                                    >
                                        Siguiente <LucideIcons.ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Conexión Directa</span>
                                    <h3 className="text-3xl font-black text-white font-outfit">Canales de contacto</h3>
                                </div>
                                <div className="space-y-6">
                                    <Input 
                                        label="Email" type="email" placeholder="ejemplo@correo.com" icon="Mail" 
                                        value={formik.values.email} 
                                        onChange={(v: string) => formik.setFieldValue('email', v)}
                                        error={formik.touched.email && formik.errors.email}
                                    />
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">WhatsApp</label>
                                        <div className="flex gap-4">
                                            <select
                                                name="phone_code"
                                                value={formik.values.phone_code}
                                                onChange={formik.handleChange}
                                                className="w-[100px] bg-white/5 border border-white/10 rounded-xl text-white text-xs px-4 focus:outline-none focus:ring-1 focus:ring-white/20"
                                            >
                                                {COUNTRY_CODES.map(c => <option key={c.code} value={c.code} className="bg-[#1a1d27]">{c.flag} {c.code}</option>)}
                                            </select>
                                            <div className="flex-1">
                                                <Input noLabel placeholder="9 1234 5678" type="tel" icon="Phone" 
                                                    value={formik.values.phone} 
                                                    onChange={(v: string) => formik.setFieldValue('phone', v)}
                                                    error={formik.touched.phone && formik.errors.phone}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(2)} 
                                        className="magnetic-btn px-8 py-6 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm uppercase tracking-widest transition-all"
                                    >
                                        Atrás
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="magnetic-btn flex-1 py-6 rounded-2xl text-white font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                                        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`, boxShadow: `0 20px 40px -10px ${primaryColor}40` }}
                                    >
                                        {submitting ? <LucideIcons.Loader2 className="w-5 h-5 animate-spin" /> : "Solicitar Invitación"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, placeholder, type = "text", icon, value, onChange, required = false, noLabel = false }: any) {
  return (
    <div className="space-y-2">
      {!noLabel && <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{label}</label>}
      <div className="relative group/input">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <DynamicIcon name={icon} className="h-4 w-4 text-slate-500 group-focus-within/input:text-white transition-colors" />
        </div>
        <input
          type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} required={required}
          className="w-full pl-12 pr-4 h-[52px] bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all focus:bg-white/[0.08]"
        />
      </div>
    </div>
  );
}
