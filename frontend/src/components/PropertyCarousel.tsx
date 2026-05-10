"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, MapPin, TrendingUp, DollarSign } from "lucide-react";

export interface Property {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  main_image_url?: string;
  min_investment?: string | number;
  estimated_return?: string;
  location?: string;
  address?: string;
  campaign_name?: string;
}

interface PropertyCarouselProps {
  properties: Property[];
  primaryColor?: string;
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

const getFullImageUrl = (url: string | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
};

export default function PropertyCarousel({ 
    properties, 
    primaryColor = "#3b82f6",
    currentIndex: externalIndex,
    onIndexChange
}: PropertyCarouselProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  
  const currentIndex = externalIndex !== undefined ? externalIndex : internalIndex;

  const handleIndexChange = (newIndex: number) => {
    if (externalIndex === undefined) {
        setInternalIndex(newIndex);
    }
    if (onIndexChange) {
        onIndexChange(newIndex);
    }
  };

  if (!properties || properties.length === 0) {
    return (
        <div className="w-full aspect-[21/9] bg-slate-900 flex items-center justify-center border-b border-white/10">
            <p className="text-slate-500 font-medium">Cargando propiedades...</p>
        </div>
    );
  }

  const nextSlide = () => {
    handleIndexChange((currentIndex + 1) % properties.length);
  };

  const prevSlide = () => {
    handleIndexChange((currentIndex - 1 + properties.length) % properties.length);
  };

  const currentProperty = properties[currentIndex];

  return (
    <div className="relative w-full overflow-hidden bg-black group/carousel">
      {/* Background Image with Blur (for filling gaps/aesthetic) */}
      <div className="absolute inset-0 opacity-30 blur-3xl scale-150 transition-all duration-1000">
        <img 
          src={getFullImageUrl(currentProperty.main_image_url) || ""} 
          alt="" 
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative w-full aspect-[4/3] md:aspect-[21/7] max-h-[800px] flex flex-col md:block items-center justify-center bg-[#0f172a]">
        {/* Main Content Area */}
        <div className="relative w-full h-full flex flex-col md:block">
          
          {/* Property Image Container */}
          <div className="w-full aspect-[4/3] md:h-full relative overflow-hidden">
             {/* Slide Animation Container */}
             <div className="absolute inset-0 transition-all duration-700 ease-in-out">
                <img 
                  key={currentProperty.id}
                  src={getFullImageUrl(currentProperty.main_image_url) || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop"} 
                  alt={currentProperty.name}
                  className="w-full h-full object-cover animate-in fade-in duration-1000"
                />
                
                {/* Overlay Gradient - Minimalist on mobile */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:from-[#0f172a] md:via-[#0f172a]/40" />
             </div>
 
             {/* Desktop Info Overlay (Hidden on Mobile) */}
             <div className="hidden md:block absolute bottom-0 left-0 right-0 p-16 z-20">
                <div className="max-w-7xl mx-auto flex flex-row items-end justify-between gap-8">
                    <div className="space-y-4 animate-in slide-in-from-bottom-8 duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-widest text-white">
                            <MapPin className="w-3 h-3" />
                            {currentProperty.location || "Ubicación Premium"}
                        </div>
                        <h2 className="text-6xl font-black text-white tracking-tight leading-none">
                            {currentProperty.name}
                        </h2>
                        <p className="text-slate-300 text-xl font-medium max-w-2xl">
                            {currentProperty.address || "Explora una oportunidad única de inversión inmobiliaria."}
                        </p>
                    </div>
                </div>
             </div>

             {/* Mobile Info Minimal Overlay (Street Name Only) */}
             <div className="md:hidden absolute bottom-0 left-0 right-0 p-4 z-20">
                <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full w-fit">
                    {currentProperty.address || "Ubicación Premium"}
                </p>
             </div>
 
             {/* Navigation Controls (More subtle on mobile) */}
             <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 md:px-8 z-30 pointer-events-none">
                <button 
                  onClick={prevSlide}
                  className="w-8 h-8 md:w-16 md:h-16 rounded-full bg-black/40 md:bg-black/20 hover:bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white transition-all pointer-events-auto hover:scale-110 active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4 md:w-8 md:h-8" />
                </button>
                <button 
                  onClick={nextSlide}
                  className="w-8 h-8 md:w-16 md:h-16 rounded-full bg-black/40 md:bg-black/20 hover:bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white transition-all pointer-events-auto hover:scale-110 active:scale-95"
                >
                  <ChevronRight className="w-4 h-4 md:w-8 md:h-8" />
                </button>
             </div>
          </div>

          <div className="md:hidden w-full bg-[#0f172a] p-6 border-b border-white/10">
            <div className="space-y-2">
                <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
                    {currentProperty.name}
                </h2>
                <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                    <MapPin className="w-3 h-3" />
                    {currentProperty.location || "Sector de Alta Plusvalía"}
                </div>
            </div>
          </div>
 
          {/* Indicators */}
          <div className="absolute top-4 right-4 md:top-auto md:bottom-6 md:left-1/2 md:-translate-x-1/2 flex gap-1.5 z-30">
              {properties.map((_, i) => (
                  <button
                      key={i}
                      onClick={() => handleIndexChange(i)}
                      className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-6 md:w-8' : 'w-1.5 md:w-2 bg-white/20'}`}
                      style={{ backgroundColor: i === currentIndex ? primaryColor : undefined }}
                  />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
 
function MetricCard({ icon, label, value, primaryColor, mobile = false }: { icon: React.ReactNode; label: string; value: string; primaryColor: string; mobile?: boolean }) {
  return (
    <div className={`bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl hover:bg-white/10 transition-all group ${mobile ? 'p-3' : 'p-4 min-w-[180px]'}`}>
      <div className="flex items-center gap-3 mb-1">
        <div className="p-1.5 md:p-2 rounded-lg bg-white/5 text-slate-400 group-hover:text-white transition-colors" style={{ color: primaryColor }}>
          {icon}
        </div>
        <span className={`${mobile ? 'text-[8px]' : 'text-xs'} font-black uppercase tracking-widest text-slate-500`}>{label}</span>
      </div>
      <div className={`${mobile ? 'text-lg' : 'text-2xl'} font-black text-white`}>{value}</div>
    </div>
  );
}
