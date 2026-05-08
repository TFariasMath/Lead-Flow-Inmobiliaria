/**
 * Lead Flow - Role Editor
 * =======================
 * Permite crear o editar un rol y asignar permisos específicos.
 */

"use client";

import { useEffect, useState, use } from "react";
import { Shield, Save, ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getGroup, createGroup, updateGroup, getPermissions, Group, Permission } from "@/lib/api";

export default function RoleEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "new";
  const { token } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const permsData = await getPermissions(token);
        setAllPermissions(permsData);

        if (!isNew) {
          const groupData = await getGroup(token, id);
          setName(groupData.name);
          setSelectedPerms(groupData.permissions);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando datos");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, id, isNew]);

  const togglePermission = (permId: number) => {
    setSelectedPerms(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !name) return;

    try {
      setSaving(true);
      const data = { name, permissions: selectedPerms };
      if (isNew) {
        await createGroup(token, data);
      } else {
        await updateGroup(token, id, data);
      }
      router.push("/dashboard/settings/roles");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  // Agrupar permisos por modelo para que sea más fácil de leer
  const groupedPerms = allPermissions.reduce((acc, perm) => {
    const model = perm.codename.split("_")[1] || "general";
    if (!acc[model]) acc[model] = [];
    acc[model].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fadeIn">
      <Link
        href="/dashboard/settings/roles"
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group w-fit"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Volver a Roles
      </Link>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#1e293b]/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem]">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <h1 className="text-2xl font-black text-white">
                {isNew ? "Crear Nuevo Rol" : `Editando: ${name}`}
              </h1>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del Rol (ej: Supervisor de Ventas)"
              className="w-full bg-transparent border-none text-xl font-bold text-white placeholder:text-slate-600 focus:ring-0 p-0"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20"
          >
            {saving ? (
              <div className="w-5 h-5 animate-spin border-2 border-white/20 border-t-white rounded-full" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isNew ? "Crear Rol" : "Guardar Cambios"}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Permissions Selection */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-black text-white uppercase tracking-widest">
              Permisos del Sistema
            </h2>
            <span className="text-xs text-slate-500 font-bold bg-white/5 px-3 py-1 rounded-full border border-white/5">
              {selectedPerms.length} Seleccionados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(groupedPerms).map(([model, perms]) => (
              <div
                key={model}
                className="bg-[#1e293b]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6"
              >
                <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  Módulo: {model}
                </h3>
                
                <div className="space-y-2">
                  {perms.map((perm) => {
                    const isSelected = selectedPerms.includes(perm.id);
                    return (
                      <button
                        key={perm.id}
                        type="button"
                        onClick={() => togglePermission(perm.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all border ${
                          isSelected
                            ? "bg-blue-600/10 border-blue-500/30 text-white"
                            : "bg-white/5 border-transparent text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        <span className="text-sm font-medium">
                          {perm.name.replace(`Can add ${model}`, "Crear").replace(`Can change ${model}`, "Editar").replace(`Can delete ${model}`, "Borrar").replace(`Can view ${model}`, "Ver").replace("Can ", "").replace("can ", "")}
                        </span>
                        {isSelected ? (
                          <CheckCircle2 className="w-5 h-5 text-blue-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-700" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
