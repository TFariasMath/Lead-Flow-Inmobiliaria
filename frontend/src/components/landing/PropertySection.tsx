import React from "react";
import * as LucideIcons from "lucide-react";
import MapSection from "../MapSection";
import PropertyCarousel from "../PropertyCarousel";
import { LandingData } from "./types";

interface PropertySectionProps {
  data: LandingData;
  activePropertyIndex: number;
  setActivePropertyIndex: (index: number) => void;
}

export const PropertySection: React.FC<PropertySectionProps> = ({ 
  data, 
  activePropertyIndex, 
  setActivePropertyIndex 
}) => {
  const primaryColor = data.primary_color || "#3b82f6";

  return (
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
  );
};
