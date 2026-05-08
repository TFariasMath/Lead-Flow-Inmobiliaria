"use client";

import { Building2, CheckCircle2, User, Mail, Star, MapPin, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { type Campaign, type Property } from "@/lib/api";
import { cn } from "@/lib/utils";

interface BrochurePreviewProps {
  campaign: Campaign;
  selectedProperties: Property[];
}

export default function BrochurePreview({ campaign, selectedProperties }: BrochurePreviewProps) {
  const primaryColor = "#3b82f6"; // O sacar de la campaña si se añade el campo

  return (
    <div className="w-full bg-white text-[#1e293b] shadow-2xl overflow-y-auto custom-scrollbar h-full flex flex-col font-sans">
      
      {/* ── Page 1: Cover ── */}
      <div className="flex-shrink-0 min-h-[600px] flex flex-col border-b-8 border-slate-100">
        <div 
          className="p-16 text-center" 
          style={{ backgroundColor: primaryColor }}
        >
          <h1 className="text-5xl font-black text-white mb-4 leading-tight uppercase tracking-tighter">
            {campaign.brochure_title || campaign.name}
          </h1>
          <div className="w-20 h-1 bg-white/30 mx-auto mb-4 rounded-full" />
          <p className="text-xl text-white/80 font-bold uppercase tracking-[0.3em]">Propuesta Exclusiva de Inversión</p>
        </div>

        <div className="p-16 flex-1 flex flex-col justify-center">
          <div className="mb-10">
            <h2 className="text-2xl font-black mb-4 flex items-center gap-3" style={{ color: primaryColor }}>
              Hola Inversionista,
            </h2>
            <p className="text-lg leading-relaxed text-slate-600 italic">
              {campaign.brochure_description || "Hemos preparado esta selección especial de propiedades pensando en tus objetivos de inversión. Nuestro equipo ha analizado cada detalle para asegurar la mejor rentabilidad."}
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
              ¿Por qué invertir con nosotros?
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {(campaign.brochure_features || [
                "Alta Rentabilidad y ROI Garantizado",
                "Ubicación Estratégica en Zonas de Alta Plusvalía",
                "Proyectos de Desarrolladores con Trayectoria"
              ]).map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto p-10 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                <User className="w-6 h-6" />
              </div>
              <div className="text-[10px]">
                <p className="text-slate-400 font-black uppercase tracking-widest">Tu Asesor Asignado</p>
                <p className="text-slate-900 font-black text-xs uppercase">Asesor LeadFlow</p>
                <p className="text-slate-500 font-medium">asesor@leadflow.dev</p>
              </div>
           </div>
           <div className="text-right">
              <span className="text-xl font-black tracking-tighter" style={{ color: primaryColor }}>LEAD FLOW</span>
           </div>
        </div>
      </div>

      {/* ── Pages 2+: Properties ── */}
      {selectedProperties.map((prop) => (
        <div key={prop.id} className="flex-shrink-0 min-h-screen p-16 flex flex-col border-b-8 border-slate-100 animate-fadeIn">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 leading-none mb-2 uppercase tracking-tighter">{prop.name}</h2>
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest" style={{ color: primaryColor }}>
                <MapPin className="w-4 h-4" />
                {prop.location}
              </div>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID de Activo</p>
               <p className="text-xs font-mono font-bold text-slate-600">#{prop.id.toString().padStart(5, '0')}</p>
            </div>
          </div>

          <div className="aspect-video bg-slate-100 rounded-3xl overflow-hidden mb-10 shadow-xl border border-slate-200 relative group">
            {prop.main_image_url ? (
              <img src={prop.main_image_url} className="w-full h-full object-cover" alt={prop.name} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                <Building2 className="w-20 h-20 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest mt-4">Imagen no disponible</p>
              </div>
            )}
            <div className="absolute top-6 left-6 flex gap-2">
               <div className="px-4 py-2 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                 <Star className="w-3 h-3" /> Proyecto Destacado
               </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-10">
            <MetricBox icon={DollarSign} label="Inversión Mínima" value={`$${Number(prop.min_investment).toLocaleString()}`} />
            <MetricBox icon={TrendingUp} label="Retorno Est." value={prop.estimated_return} color="#10b981" />
            <MetricBox icon={Calendar} label="Fecha Entrega" value={prop.delivery_date} />
          </div>

          <div className="flex-1">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
               <div className="w-4 h-px bg-slate-200" /> Descripción del Proyecto
             </h3>
             <p className="text-slate-600 leading-relaxed text-lg mb-8">
               {prop.description}
             </p>

             <div className="flex flex-wrap gap-2">
                {prop.amenities?.map((am, i) => (
                  <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200/50">
                    {am}
                  </span>
                ))}
             </div>
          </div>

          <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-center opacity-40 grayscale">
             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Brochure Digital - Propiedad {prop.id}</span>
             <span className="text-sm font-black tracking-tighter" style={{ color: primaryColor }}>LEAD FLOW</span>
          </div>
        </div>
      ))}

      {selectedProperties.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-40 text-slate-300">
           <Building2 className="w-20 h-20 opacity-10 mb-4" />
           <p className="text-sm font-black uppercase tracking-widest">Selecciona proyectos para ver las fichas</p>
        </div>
      )}
    </div>
  );
}

function MetricBox({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color?: string }) {
  return (
    <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl text-center group hover:bg-white hover:shadow-lg transition-all">
      <div className="flex items-center justify-center gap-2 mb-2 text-slate-400 group-hover:text-blue-500 transition-colors">
        <Icon className="w-4 h-4" />
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-900" style={{ color: color }}>{value}</p>
    </div>
  );
}
