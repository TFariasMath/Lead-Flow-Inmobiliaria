"use client";

import React, { useState } from "react";
import * as LucideIcons from "lucide-react";
import { LandingData } from "./landing/types";
export type { LandingData };
import { AestheticCursor } from "./landing/AestheticCursor";
import { HeroSection } from "./landing/HeroSection";
import { PropertySection } from "./landing/PropertySection";
import { RegistrationForm } from "./landing/RegistrationForm";
import { useAestheticEffects } from "../hooks/useAestheticEffects";
import "./landing/landing.css";

interface LandingLayoutProps {
  data: LandingData;
  onSubmit: (values: any) => Promise<void>;
  submitting?: boolean;
  error?: string;
  submitted?: boolean;
}

const SuccessState = ({ message }: { message: string }) => (
  <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-10 text-center shadow-2xl">
      <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
        <LucideIcons.CheckCircle2 className="w-10 h-10 text-white icon-glow" />
      </div>
      <h2 className="text-3xl font-black text-white mb-4 tracking-tight font-outfit uppercase tracking-tighter">
        ¡Protocolo Activado!
      </h2>
      <p className="text-slate-400 text-lg mb-8 leading-relaxed">
        {message}
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

export default function LandingLayout({
  data,
  onSubmit,
  submitting = false,
  submitted = false,
}: LandingLayoutProps) {
  const [activePropertyIndex, setActivePropertyIndex] = useState(0);
  
  // Custom Hook for all cursor and magnetic effects
  useAestheticEffects();

  if (submitted) {
    return <SuccessState message={data.success_message} />;
  }

  return (
    <div className="min-h-screen abstract-bg text-white selection:bg-blue-500/30 flex flex-col relative overflow-x-hidden font-sans">
      <AestheticCursor />

      {/* 1. Hero Section */}
      <HeroSection data={data} />

      {/* 2. Visual & Info Block (Carousel + Map + Property Details) */}
      <PropertySection 
        data={data} 
        activePropertyIndex={activePropertyIndex} 
        setActivePropertyIndex={setActivePropertyIndex} 
      />

      {/* 3. Registration Form (Multi-step) */}
      <RegistrationForm 
        data={data} 
        onSubmit={onSubmit} 
        submitting={submitting} 
      />

      <style jsx global>{`
        body { cursor: none; background-color: #020617; }
        
        .abstract-bg {
            background-color: #020617;
            background-image: 
                radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.12) 0px, transparent 50%),
                radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.08) 0px, transparent 50%),
                radial-gradient(at 50% 100%, rgba(15, 23, 42, 1) 0px, transparent 50%);
            position: relative;
        }
      `}</style>
    </div>
  );
}
