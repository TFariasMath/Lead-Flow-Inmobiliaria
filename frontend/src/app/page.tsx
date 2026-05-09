/**
 * Lead Flow - Futuristic Login Experience
 * ========================================
 * Una interfaz de alta fidelidad con estética cinematográfica,
 * efectos de nebulosa y animaciones cuánticas.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Zap, Eye, EyeOff, ArrowRight, Shield, Globe, Lock, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const { login, token } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // CENTRO DE MANDO: Gestión de Ciclo de Vida y Navegación
  useEffect(() => {
    // 1. Marcar montaje para animaciones iniciales
    setMounted(true);

    let timer: NodeJS.Timeout;

    // 2. Lógica de Redirección
    if (token) {
      if (isSuccess) {
        // Login exitoso ahora mismo -> Esperar animación
        timer = setTimeout(() => {
          router.push("/dashboard");
        }, 700);
      } else {
        // Sesión ya existía (p.ej. al refrescar) -> Redirigir ya
        router.push("/dashboard");
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [token, isSuccess, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isSuccess) return;
    
    setError("");
    setLoading(true);
    try {
      // Intentar autenticación
      await login(username, password);
      // Solo llegamos aquí si el login fue exitoso
      setIsSuccess(true);
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err?.message || "ACCESO DENEGADO: Verifique sus credenciales.");
      setLoading(false);
      setIsSuccess(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-6 overflow-hidden">
      {/* El fondo ahora es gestionado globalmente por BackgroundEngine en layout.tsx */}

      {/* --- LOGIN INTERFACE --- */}
      <div className={cn(
        "relative z-10 w-full max-w-[420px] transition-all duration-[800ms] ease-in-out flex flex-col items-center",
        mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95",
        isSuccess && "scale-[1.15] opacity-0 blur-2xl pointer-events-none" // Zoom-in effect
      )}>
        
        {/* Branding Header */}
        <div className={cn(
            "text-center mb-8 space-y-3 group transition-all duration-700",
            isSuccess && "scale-110"
        )}>
            <div className="relative">
                <h1 className={cn(
                    "text-5xl font-black text-white tracking-[-0.08em] leading-none relative z-10 transition-all duration-700",
                    isSuccess && "drop-shadow-[0_0_30px_rgba(96,165,250,0.8)]"
                )}>
                    <span className="inline-block transition-transform duration-500 cursor-default">
                        LEAD
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-indigo-500 animate-text-shimmer bg-[length:200%_auto]">
                            FLOW
                        </span>
                    </span>
                </h1>
                <div className={cn(
                    "absolute -inset-8 bg-blue-600/15 blur-[50px] transition-opacity duration-1000 pointer-events-none",
                    isSuccess ? "opacity-100 scale-150" : "opacity-0 group-hover:opacity-100"
                )} />
                
                <div className="flex items-center justify-center gap-3 mt-4 opacity-50">
                    <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-blue-500/50" />
                    <span className="text-[8px] text-blue-400 font-black uppercase tracking-[0.5em] animate-pulse">
                        Smarter Investment
                    </span>
                    <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-blue-500/50" />
                </div>
            </div>
        </div>

        {/* Glass Card */}
        <div className={cn(
            "w-full glass-container rounded-[2rem] p-1 pb-1 overflow-hidden relative group/card border border-white/5 bg-white/[0.01] backdrop-blur-2xl shadow-2xl shadow-black/50 transition-all duration-700",
            isSuccess && "border-blue-500/30 bg-blue-500/5 shadow-[0_0_100px_rgba(59,130,246,0.3)]"
        )}>
          {/* Internal Shimmer Line */}
          <div className="absolute top-0 left-[-100%] w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent animate-shimmer" />
          
          <div className="p-8 bg-[#050811]/70 rounded-[1.9rem] relative z-10">
            <div className="mb-8">
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-500" />
                    Acceso al Nodo
                </h2>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Autenticación requerida</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div className="space-y-1.5 group/input">
                <div className="flex justify-between items-center px-1">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest group-focus-within/input:text-blue-500 transition-colors">
                        Terminal ID
                    </label>
                    <Globe className="w-2.5 h-2.5 text-slate-800 group-focus-within/input:text-blue-600 transition-colors" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-11 bg-black/40 border border-white/5 rounded-xl px-4 text-xs text-white placeholder:text-slate-800 focus:outline-none focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/5 transition-all duration-300 neon-text-input"
                  placeholder="Master User"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5 group/input">
                <div className="flex justify-between items-center px-1">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest group-focus-within/input:text-indigo-500 transition-colors">
                        Security Key
                    </label>
                    <Lock className="w-2.5 h-2.5 text-slate-800 group-focus-within/input:text-indigo-600 transition-colors" />
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 bg-black/40 border border-white/5 rounded-xl px-4 text-xs text-white placeholder:text-slate-800 focus:outline-none focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 neon-text-input"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-red-400 bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-3 animate-shake">
                  <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit Action */}
              <button
                type="submit"
                disabled={loading || isSuccess}
                className="group/btn relative w-full h-12 bg-white text-black rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                
                <span className="relative z-10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] group-hover/btn:text-white transition-colors duration-300">
                  {loading && !isSuccess ? (
                    <>
                        <Cpu className="w-3.5 h-3.5 animate-spin" />
                        Auth...
                    </>
                  ) : isSuccess ? (
                    <>
                        Acceso Concedido
                    </>
                  ) : (
                    <>
                        Conectar
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* System Metadata */}
        <div className={cn(
            "mt-8 flex flex-col items-center gap-4 transition-all duration-500",
            isSuccess ? "opacity-0 translate-y-4" : "opacity-30 hover:opacity-100"
        )}>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Status: Active</span>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Enc: AES-256</span>
                <div className="w-px h-3 bg-white/10" />
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">v4.0.2</span>
            </div>
        </div>
      </div>

      {/* CSS-ONLY ANIMATIONS & UTILS */}
      <style jsx global>{`
        .neon-text-input {
            caret-color: #60a5fa;
            text-shadow: 0 0 8px rgba(96, 165, 250, 0.3);
        }
        .neon-text-input:focus {
            text-shadow: 0 0 12px rgba(96, 165, 250, 0.5);
        }
        @keyframes text-shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .animate-text-shimmer {
          animation: text-shimmer 3s linear infinite;
        }
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite linear;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        .glass-container {
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
}
