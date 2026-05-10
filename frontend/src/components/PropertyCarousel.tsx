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

      <div className="relative w-full aspect-[21/10] md:aspect-[21/7] max-h-[700px] flex items-center justify-center">
        {/* Main Content Area */}
        <div className="relative w-full h-full flex items-center">
          
          {/* Property Image and Details Card */}
          <div className="w-full h-full relative overflow-hidden">
             {/* Slide Animation Container */}
             <div className="absolute inset-0 transition-all duration-700 ease-in-out">
                <img 
                  key={currentProperty.id}
                  src={getFullImageUrl(currentProperty.main_image_url) || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop"} 
                  alt={currentProperty.name}
                  className="w-full h-full object-cover animate-in fade-in duration-1000"
                />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent" />
             </div>

             {/* Property Info Content */}
             <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 z-20">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4 animate-in slide-in-from-bottom-8 duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-widest text-white">
                            <MapPin className="w-3 h-3" />
                            {currentProperty.location || "Ubicación Premium"}
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none">
                            {currentProperty.name}
                        </h2>
                        <p className="text-slate-300 text-lg md:text-xl font-medium max-w-2xl line-clamp-2">
                            {currentProperty.address || "Explora una oportunidad única de inversión inmobiliaria en una de las zonas de mayor plusvalía."}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 md:gap-6 animate-in slide-in-from-bottom-12 duration-700 delay-150">
                        <MetricCard 
                            icon={<DollarSign className="w-5 h-5" />} 
                            label="Desde" 
                            value={`$${Number(currentProperty.min_investment || 0).toLocaleString()}`} 
                            primaryColor={primaryColor}
                        />
                        <MetricCard 
                            icon={<TrendingUp className="w-5 h-5" />} 
                            label="Retorno Est." 
                            value={currentProperty.estimated_return || "12%"} 
                            primaryColor={primaryColor}
                        />
                    </div>
                </div>
             </div>
          </div>

          {/* Navigation Controls */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 md:px-8 z-30 pointer-events-none">
            <button 
              onClick={prevSlide}
              className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white transition-all pointer-events-auto hover:scale-110 active:scale-95 group/btn"
            >
              <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 group-hover/btn:-translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={nextSlide}
              className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white transition-all pointer-events-auto hover:scale-110 active:scale-95 group/btn"
            >
              <ChevronRight className="w-6 h-6 md:w-8 md:h-8 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30">
            {properties.map((_, i) => (
                <button
                    key={i}
                    onClick={() => handleIndexChange(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8' : 'w-2 bg-white/20'}`}
                    style={{ backgroundColor: i === currentIndex ? primaryColor : undefined }}
                />
            ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, primaryColor }: { icon: React.ReactNode; label: string; value: string; primaryColor: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 min-w-[140px] md:min-w-[180px] hover:bg-white/10 transition-all group">
      <div className="flex items-center gap-3 mb-1">
        <div className="p-2 rounded-lg bg-white/5 text-slate-400 group-hover:text-white transition-colors" style={{ color: primaryColor }}>
          {icon}
        </div>
        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500">{label}</span>
      </div>
      <div className="text-xl md:text-2xl font-black text-white">{value}</div>
    </div>
  );
}
