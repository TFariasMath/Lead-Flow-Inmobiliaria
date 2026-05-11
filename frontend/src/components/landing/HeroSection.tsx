import React from "react";
import { LandingData } from "./types";

interface HeroSectionProps {
  data: LandingData;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ data }) => {
  const primaryColor = data.primary_color || "#3b82f6";

  return (
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
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`, 
              boxShadow: `0 20px 40px -10px ${primaryColor}40` 
            }}
          >
            {data.cta_text || "Explorar Activos"}
          </a>
          <div className="flex items-center gap-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#020617] bg-slate-800" />
              ))}
            </div>
            +120 Inversores Activos
          </div>
        </div>
      </div>
    </div>
  );
};
