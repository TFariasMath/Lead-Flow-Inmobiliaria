/**
 * BackgroundEngine - Smart Liquid System
 * =====================================
 * Genera un fondo dinámico con estética de "Cristal Líquido" 
 * que se fusiona orgánicamente.
 */

"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const BackgroundEngine = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-[#02040a] pointer-events-none">
      {/* 1. Base Gradient Texture */}
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_50%,#0f172a_0%,#02040a_100%)]" />

      {/* 2. The Liquid Canvas */}
      <div className="absolute inset-0 filter blur-[80px] saturate-150 contrast-125 opacity-40 transform-gpu">
        
        {/* Blob 1: Deep Indigo */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600 rounded-full animate-liquid-1 mix-blend-screen will-change-transform" />
        
        {/* Blob 2: Electric Violet */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-700 rounded-full animate-liquid-2 mix-blend-screen will-change-transform" />
        
        {/* Blob 3: Cyber Cyan */}
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-cyan-500 rounded-full animate-liquid-3 mix-blend-screen will-change-transform" />
        
        {/* Blob 4: Deep Ocean */}
        <div className="absolute bottom-[20%] left-[10%] w-[45%] h-[45%] bg-blue-900 rounded-full animate-liquid-4 mix-blend-screen will-change-transform" />
      </div>

      {/* 3. Noise & Grain Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
        }}
      />

      {/* 4. Fine Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* CSS Keyframes for the Liquid Motion */}
      <style jsx>{`
        @keyframes liquid-1 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          33% { transform: translate3d(10%, 15%, 0) scale(1.1); }
          66% { transform: translate3d(-5%, 20%, 0) scale(0.9); }
        }
        @keyframes liquid-2 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          33% { transform: translate3d(-15%, -10%, 0) scale(0.9); }
          66% { transform: translate3d(10%, -20%, 0) scale(1.2); }
        }
        @keyframes liquid-3 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1.1); }
          50% { transform: translate3d(20%, -10%, 0) scale(0.8); }
        }
        @keyframes liquid-4 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(0.9); }
          50% { transform: translate3d(-10%, 10%, 0) scale(1.1); }
        }
        .animate-liquid-1 { animation: liquid-1 15s ease-in-out infinite; }
        .animate-liquid-2 { animation: liquid-2 18s ease-in-out infinite; }
        .animate-liquid-3 { animation: liquid-3 12s ease-in-out infinite; }
        .animate-liquid-4 { animation: liquid-4 16s ease-in-out infinite; }
      `}</style>
    </div>
  );
};
