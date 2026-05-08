/**
 * Lead Flow - Login Page (Premium v3)
 * ====================================
 * Página de autenticación con diseño premium, animaciones sutiles
 * y branding profesional.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Zap, Eye, EyeOff, ArrowRight, Shield } from "lucide-react";

export default function LoginPage() {
  const { login, token } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (token) router.push("/dashboard");
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      router.push("/dashboard");
    } catch {
      setError("Credenciales inválidas. Verifica tu usuario y contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-6 noise-overlay">
      {/* Ambient Background */}
      <div className="fixed inset-0 bg-[#030712]" />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet-600/6 rounded-full blur-[120px] animate-float" style={{ animationDelay: "3s" }} />
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Grid Pattern */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className={`relative z-10 w-full max-w-[440px] transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Logo & Brand */}
        <div className="flex flex-col items-center mb-12">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-pulse-glow">
              <Zap className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
            <div className="absolute -inset-3 bg-blue-500/15 blur-2xl rounded-full pointer-events-none" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Lead Flow
          </h1>
          <p className="text-xs text-slate-500 font-bold mt-2 uppercase tracking-[0.3em]">
            Investment Platform
          </p>
        </div>

        {/* Card */}
        <div className="glass-container rounded-[2rem] p-10 relative overflow-hidden">
          {/* Card shimmer */}
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />

          <div className="relative z-10">
            <div className="mb-8">
              <h2 className="text-xl font-black text-white tracking-tight">Bienvenido</h2>
              <p className="text-sm text-slate-500 mt-1">
                Ingresa tus credenciales para acceder al sistema
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="section-label text-slate-500 ml-1">
                  Usuario
                </label>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-premium w-full h-12"
                  placeholder="admin"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <label className="section-label text-slate-500 ml-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-premium w-full h-12 pr-12"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 text-xs font-bold text-red-400 bg-red-400/8 border border-red-400/15 rounded-xl px-4 py-3 animate-fadeIn">
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="btn-primary w-full h-12 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verificando...
                  </span>
                ) : (
                  <>
                    Ingresar al Sistema
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 pt-6 border-t border-white/5">
              <div className="flex items-center justify-center">
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                  Lead Flow Enterprise v2.5
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-700 font-medium">
          Demo: <span className="text-slate-500">admin</span> / <span className="text-slate-500">admin123</span>
        </p>
      </div>
    </div>
  );
}
