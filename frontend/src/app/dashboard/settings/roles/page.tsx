/**
 * Lead Flow - Roles Management
 * ===========================
 * Permite al administrador ver y gestionar los roles del sistema.
 */

"use client";

import { useEffect, useState } from "react";
import { Shield, Plus, Users, ChevronRight, Trash2, Edit3 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getGroups, deleteGroup, Group } from "@/lib/api";

export default function RolesPage() {
  const { token } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await getGroups(token);
      setGroups(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [token]);

  const handleDelete = async (id: number) => {
    if (!token || !confirm("¿Estás seguro de eliminar este rol?")) return;
    try {
      await deleteGroup(token, id.toString());
      setGroups(groups.filter(g => g.id !== id));
    } catch (err) {
      alert("Error al eliminar: " + (err instanceof Error ? err.message : "Desconocido"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-500" />
            Gestión de Roles
          </h1>
          <p className="text-slate-400 mt-1">
            Define quién puede crear páginas, gestionar leads o ver analíticas.
          </p>
        </div>
        
        <Link
          href="/dashboard/settings/roles/new"
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-5 h-5" />
          Nuevo Rol
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <div
            key={group.id}
            className="group relative bg-[#1e293b]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 hover:border-blue-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl group-hover:bg-blue-500/20 transition-colors">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/dashboard/settings/roles/${group.id}`}
                  className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDelete(group.id)}
                  className="p-2 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">{group.name}</h3>
            
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
              <Users className="w-4 h-4" />
              <span>{group.user_count} usuarios asignados</span>
            </div>

            <div className="space-y-3">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Permisos Clave
              </div>
              <div className="flex flex-wrap gap-2">
                {group.permissions_details?.slice(0, 3).map((p) => (
                  <span
                    key={p.id}
                    className="px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] text-slate-300"
                  >
                    {p.name.replace("Can ", "").replace("can ", "")}
                  </span>
                ))}
                {(group.permissions_details?.length || 0) > 3 && (
                  <span className="px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] text-slate-500">
                    +{(group.permissions_details?.length || 0) - 3} más
                  </span>
                )}
                {(group.permissions_details?.length || 0) === 0 && (
                  <span className="text-[10px] text-slate-600 italic">Sin permisos asignados</span>
                )}
              </div>
            </div>

            <Link
              href={`/dashboard/settings/roles/${group.id}`}
              className="mt-8 flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-2xl transition-all border border-white/5"
            >
              Configurar Permisos
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>

      {groups.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-[#1e293b]/20 border border-dashed border-white/10 rounded-[2.5rem]">
          <Shield className="w-16 h-16 text-slate-700 mb-4" />
          <p className="text-slate-500 font-medium">No hay roles personalizados creados.</p>
          <Link
            href="/dashboard/settings/roles/new"
            className="mt-4 text-blue-400 hover:text-blue-300 font-bold"
          >
            Crea el primer rol ahora
          </Link>
        </div>
      )}
    </div>
  );
}
