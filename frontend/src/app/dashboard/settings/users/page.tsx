/**
 * Lead Flow - Users Management
 * ===========================
 * Permite al administrador gestionar los perfiles de usuario y asignar roles.
 */

"use client";

import { useEffect, useState } from "react";
import { Users, Plus, UserCircle, Edit3, Trash2, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUsers, User } from "@/lib/api";

export default function UsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await getUsers(token);
      // getUsers now returns a paginated response because it's a ViewSet
      // Wait, let's check if I should update getUsers in api.ts
      setUsers(Array.isArray(data) ? data : (data as any).results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

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
            <Users className="w-8 h-8 text-blue-500" />
            Gestión de Perfiles
          </h1>
          <p className="text-slate-400 mt-1">
            Crea cuentas para nuevos vendedores y asígnales roles.
          </p>
        </div>
        
        <Link
          href="/dashboard/settings/users/new"
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-5 h-5" />
          Nuevo Usuario
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-[#1e293b]/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Usuario</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre Completo</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Roles</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-500 font-bold border border-white/5 shadow-inner">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">{u.username}</span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {u.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-300">
                    {u.first_name} {u.last_name}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {(u as any).group_names?.map((gn: string) => (
                      <span key={gn} className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] text-blue-400 font-bold">
                        {gn}
                      </span>
                    ))}
                    {(!(u as any).group_names || (u as any).group_names.length === 0) && (
                      <span className="text-[10px] text-slate-600 italic">Sin rol</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {u.is_staff ? (
                    <span className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Staff Admin
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-500 font-bold">Activo</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/dashboard/settings/users/${u.id}`}
                      className="p-2 hover:bg-blue-500/10 rounded-xl text-slate-400 hover:text-blue-400 transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
