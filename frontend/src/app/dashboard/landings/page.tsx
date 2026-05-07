"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Globe, Plus, ExternalLink, Edit2, Layout } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Landing {
  id: number;
  title: string;
  slug: string;
  is_active: boolean;
  campaign_name?: string;
  created_at: string;
}

export default function LandingsListPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [landings, setLandings] = useState<Landing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/landings/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setLandings(data.results || data))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Landing Pages</h1>
          <p className="text-slate-400 mt-1">Gestiona tus páginas de captura dinámicas.</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/landings/new")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nueva Landing
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
          ))
        ) : landings.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white/5 border border-white/10 rounded-2xl">
            <Layout className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No tienes landing pages creadas.</p>
          </div>
        ) : (
          landings.map((lp) => (
            <div
              key={lp.id}
              className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/l/${lp.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => router.push(`/dashboard/landings/${lp.id}/edit`)}
                    className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-1 truncate">{lp.title}</h3>
              <p className="text-xs text-slate-500 font-mono mb-4">/l/{lp.slug}</p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                <div className="flex flex-col gap-1">
                   <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Conversión</span>
                   <span className="text-sm font-bold text-blue-400">{lp.conversion_rate}%</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                   <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Visitas</span>
                   <span className="text-sm font-bold text-white">{lp.visits_count}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
