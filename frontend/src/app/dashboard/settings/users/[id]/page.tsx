/**
 * Lead Flow - User Editor
 * =======================
 * Permite crear o editar un perfil de usuario y asignarle roles.
 */

"use client";

import { useEffect, useState, use } from "react";
import { UserPlus, Save, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getGroups, Group } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function UserEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "new";
  const { token } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    is_staff: false,
    groups: [] as number[],
  });

  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const groupsData = await getGroups(token);
        setAllGroups(groupsData.results);

        if (!isNew) {
          const res = await fetch(`${API_BASE}/users/${id}/`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const userData = await res.json();
            setFormData({
              username: userData.username,
              first_name: userData.first_name,
              last_name: userData.last_name,
              email: userData.email,
              password: "",
              is_staff: userData.is_staff,
              groups: userData.groups,
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando datos");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, id, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setSaving(true);
      const url = isNew ? `${API_BASE}/users/` : `${API_BASE}/users/${id}/`;
      const method = isNew ? "POST" : "PATCH";
      
      const payload = { ...formData };
      if (!payload.password) delete (payload as any).password;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Error al guardar usuario");

      router.push("/dashboard/settings/users");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
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
    <div className="p-8 max-w-2xl mx-auto animate-fadeIn">
      <Link
        href="/dashboard/settings/users"
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group w-fit"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Volver a Usuarios
      </Link>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-[#1e293b]/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <UserPlus className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-2xl font-black text-white">
              {isNew ? "Crear Nuevo Usuario" : `Editando: ${formData.username}`}
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Usuario</label>
              <input
                type="text"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500 transition-all outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Contraseña</label>
              <input
                type="password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder={isNew ? "" : "Dejar vacío para no cambiar"}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500 transition-all outline-none"
                required={isNew}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Nombre</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={e => setFormData({...formData, first_name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500 transition-all outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Apellido</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={e => setFormData({...formData, last_name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500 transition-all outline-none"
              required
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Asignar Rol</label>
            <div className="grid grid-cols-1 gap-2">
              {allGroups.map(group => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => {
                    const exists = formData.groups.includes(group.id);
                    setFormData({
                      ...formData,
                      groups: exists ? formData.groups.filter(g => g !== group.id) : [...formData.groups, group.id]
                    });
                  }}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all border ${
                    formData.groups.includes(group.id)
                      ? "bg-blue-600/10 border-blue-500/30 text-white"
                      : "bg-white/5 border-transparent text-slate-400 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Shield className={`w-5 h-5 ${formData.groups.includes(group.id) ? "text-blue-500" : "text-slate-600"}`} />
                    <span className="font-bold">{group.name}</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    formData.groups.includes(group.id) ? "border-blue-500 bg-blue-500" : "border-slate-700"
                  }`}>
                    {formData.groups.includes(group.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <input
              type="checkbox"
              id="is_staff"
              checked={formData.is_staff}
              onChange={e => setFormData({...formData, is_staff: e.target.checked})}
              className="w-5 h-5 rounded-lg bg-white/5 border-white/10 text-blue-600 focus:ring-0"
            />
            <label htmlFor="is_staff" className="text-sm font-bold text-slate-300 cursor-pointer">
              Acceso a configuraciones técnicas (Staff Status)
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-black transition-all shadow-lg shadow-blue-600/20"
          >
            {saving ? (
              <div className="w-5 h-5 animate-spin border-2 border-white/20 border-t-white rounded-full" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isNew ? "Crear Usuario" : "Guardar Perfil"}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
