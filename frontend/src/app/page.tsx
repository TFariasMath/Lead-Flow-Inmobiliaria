/**
 * Lead Flow - Login Page
 * ======================
 * Página de inicio de sesión con diseño premium oscuro.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Zap, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      router.push("/dashboard");
    } catch {
      setError("Credenciales inválidas. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-6">
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: "radial-gradient(circle at 50% -20%, #1e40af, transparent)" }} />

      <div className="relative z-10 w-full max-w-[420px] animate-fadeIn">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Lead Flow
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1 uppercase tracking-[0.2em]">
            Investment Platform
          </p>
        </div>

        {/* Card */}
        <div className="glass-container rounded-3xl p-10">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white">Bienvenido</h2>
            <p className="text-sm text-slate-400 mt-1">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Usuario
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-12 px-4 bg-slate-900/50 border border-white/5 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                placeholder="admin"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 px-4 pr-12 bg-slate-900/50 border border-white/5 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs font-semibold text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 animate-fadeIn">
                {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ingresando...
                </span>
              ) : (
                "Ingresar al Sistema"
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5">
            <div className="flex items-center justify-center gap-4 grayscale opacity-40">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Lead Flow Enterprise v2.5</div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-xs text-slate-600 font-medium">
          Demo: <span className="text-slate-400">admin</span> / <span className="text-slate-400">admin123</span>
        </p>
      </div>
    </div>
  );
}
