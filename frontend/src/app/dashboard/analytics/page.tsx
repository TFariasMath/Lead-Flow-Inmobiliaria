"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPerformanceAnalytics, type VendorPerformance } from "@/lib/api";
import { Users, Target, Trophy, XCircle } from "lucide-react";

export default function AnalyticsPage() {
  const { token, user } = useAuth();
  const [data, setData] = useState<VendorPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getPerformanceAnalytics(token)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user?.isStaff) {
    return (
      <div className="p-8 text-center text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">
        <h2 className="text-xl font-bold">Acceso Denegado</h2>
        <p className="mt-2 text-sm">
          Solo los administradores pueden ver el panel de rendimiento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-white">Rendimiento Comercial</h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          Analíticas de conversión y asignación por vendedor
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.map((vendor, i) => (
          <div
            key={i}
            className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl relative overflow-hidden group hover:border-[var(--color-primary)]/50 transition-all"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Top right availability indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${vendor.is_available ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`} />
              <span className="text-xs font-medium text-[var(--color-text-muted)]">
                {vendor.is_available ? 'En Round Robin' : 'Fuera de RR'}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 flex items-center justify-center text-xl font-bold text-[var(--color-primary-hover)]">
                {vendor.vendor_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {vendor.vendor_name}
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              {/* Conversion Rate */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--color-text-muted)]">Conversión</span>
                  <span className="font-bold text-emerald-400">{vendor.conversion_rate}%</span>
                </div>
                <div className="w-full bg-[var(--color-border)] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${vendor.conversion_rate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[var(--color-border)]">
                <div className="text-center">
                  <div className="flex justify-center mb-1 text-[var(--color-text-muted)]">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-bold text-white">{vendor.total_assigned}</div>
                  <div className="text-[10px] text-[var(--color-text-muted)] uppercase">Asignados</div>
                </div>
                
                <div className="text-center">
                  <div className="flex justify-center mb-1 text-emerald-400/70">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-bold text-white">{vendor.won}</div>
                  <div className="text-[10px] text-[var(--color-text-muted)] uppercase">Ganados</div>
                </div>

                <div className="text-center">
                  <div className="flex justify-center mb-1 text-red-400/70">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-bold text-white">{vendor.lost}</div>
                  <div className="text-[10px] text-[var(--color-text-muted)] uppercase">Perdidos</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
