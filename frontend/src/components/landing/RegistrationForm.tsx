import React from "react";
import * as LucideIcons from "lucide-react";
import { Input } from "./FormInputs";
import { COUNTRY_CODES, LandingData } from "./types";
import { useLandingForm } from "../../hooks/useLandingForm";

interface RegistrationFormProps {
  data: LandingData;
  onSubmit: (values: any) => Promise<void>;
  submitting: boolean;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ 
  data, 
  onSubmit, 
  submitting 
}) => {
  const { formik, step, prevStep, nextStep } = useLandingForm(onSubmit);
  const primaryColor = data.primary_color || "#3b82f6";

  return (
    <div id="register" className="w-full py-24 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-10 gap-16 items-start">
        <div className="lg:col-span-4 space-y-8 text-center lg:text-left sticky top-24">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-none">ÚNETE A LA ERA.</h2>
            <p className="text-xl text-slate-500 font-medium">Asesoría de inversión personalizada en tiempo real.</p>
          </div>

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
                      onChange={(v) => formik.setFieldValue('first_name', v)}
                      error={formik.touched.first_name && formik.errors.first_name}
                    />
                    <Input 
                      label="Apellido" placeholder="Tu apellido" icon="User" 
                      value={formik.values.last_name} 
                      onChange={(v) => formik.setFieldValue('last_name', v)}
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
                      onClick={prevStep} 
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
                      onChange={(v) => formik.setFieldValue('email', v)}
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
                            onChange={(v) => formik.setFieldValue('phone', v)}
                            error={formik.touched.phone && formik.errors.phone}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      type="button" 
                      onClick={prevStep} 
                      className="magnetic-btn px-8 py-6 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm uppercase tracking-widest transition-all"
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="magnetic-btn flex-1 py-6 rounded-2xl text-white font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                      style={{ 
                        background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`, 
                        boxShadow: `0 20px 40px -10px ${primaryColor}40` 
                      }}
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
  );
};
