/**
 * Lead Flow - New Lead Page (Premium v3)
 * =====================================
 * Interfaz de alta precisión para el registro manual de contactos.
 * Organizada por secciones con feedback visual inmediato.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createLead, getSources, getUsers, type Source, type User } from "@/lib/api";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { 
  ArrowLeft, 
  UserPlus, 
  Mail, 
  User as UserIcon, 
  Phone, 
  Building2, 
  MapPin, 
  Zap,
  Target,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const COUNTRY_CODES = [
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+51", country: "Perú", flag: "🇵🇪" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+52", country: "México", flag: "🇲🇽" },
  { code: "+34", country: "España", flag: "🇪🇸" },
  { code: "+1", country: "USA/Dom", flag: "🇺🇸" },
  { code: "+598", country: "Uruguay", flag: "🇺🇾" },
  { code: "+591", country: "Bolivia", flag: "🇧🇴" },
  { code: "+593", country: "Ecuador", flag: "🇪🇨" },
  { code: "+506", country: "Costa Rica", flag: "🇨🇷" },
  { code: "+507", country: "Panamá", flag: "🇵🇦" },
];

const validationSchema = Yup.object({
  original_email: Yup.string()
    .email("Ingresa un correo electrónico válido")
    .required("El email es obligatorio para el seguimiento"),
  first_name: Yup.string().max(150, "El nombre es demasiado largo"),
  last_name: Yup.string().max(150, "El apellido es demasiado largo"),
  phone: Yup.string().matches(
    /^[\d\s\-\+\(\)]*$/,
    "Formato de teléfono no válido"
  ),
});

export default function NewLeadPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [sources, setSources] = useState<Source[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    Promise.all([getSources(token), getUsers(token)])
      .then(([s, u]) => {
        setSources(s.results);
        setUsers(u);
      })
      .catch(console.error);
  }, [token]);

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fadeIn">
      {/* ── Breadcrumb & Action ── */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.push("/dashboard/leads")}
          className="btn-ghost flex items-center gap-2 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver a la lista
        </button>
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-white/5 px-3 py-1 rounded-full border border-white/5">
          Creación Manual • v3.0
        </div>
      </div>

      {/* ── Header Section ── */}
      <div className="flex items-center gap-6 mb-10">
        <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/20 relative group overflow-hidden">
          <UserPlus className="w-10 h-10 text-white relative z-10 group-hover:scale-110 transition-transform duration-500" />
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Ingresar Nuevo Prospecto</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
            Completa los datos para iniciar el flujo de conversión
          </p>
        </div>
      </div>

      {/* ── Form Container ── */}
      <div className="glass-container rounded-[2.5rem] p-10 relative">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />

        <Formik
          initialValues={{
            original_email: "",
            first_name: "",
            last_name: "",
            phone_code: "+56",
            phone_number: "",
            address: "",
            company: "",
            first_source: "",
            assigned_to: "",
          }}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting }) => {
            if (!token) return;
            setError("");
            try {
              const payload: Record<string, any> = { ...values };
              
              // Combinar código de país con el número
              if (values.phone_number) {
                payload.phone = `${values.phone_code}${values.phone_number.replace(/\s+/g, '')}`;
              } else {
                delete payload.phone;
              }
              
              delete payload.phone_code;
              delete payload.phone_number;

              if (!payload.first_source) delete payload.first_source;
              if (!payload.assigned_to) delete payload.assigned_to;

              await createLead(token, payload);
              router.push("/dashboard/leads");
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : "Error crítico al guardar el lead";
              setError(message);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, values }) => (
            <Form className="space-y-12">
              
              {/* ── SECCIÓN 1: IDENTIDAD ── */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <UserIcon className="w-4 h-4 text-blue-500" />
                  <h2 className="section-label text-white">Información de Identidad</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre</label>
                    <div className="input-icon-wrapper">
                      <UserIcon className="w-4 h-4 text-slate-500" />
                      <Field name="first_name" placeholder="Ej: Juan" className="input-premium input-premium-icon" />
                    </div>
                    <ErrorMessage name="first_name" component="p" className="text-[10px] font-bold text-red-500 ml-1" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Apellido</label>
                    <div className="input-icon-wrapper">
                      <UserIcon className="w-4 h-4 text-slate-500" />
                      <Field name="last_name" placeholder="Ej: Pérez" className="input-premium input-premium-icon" />
                    </div>
                    <ErrorMessage name="last_name" component="p" className="text-[10px] font-bold text-red-500 ml-1" />
                  </div>
                </div>
              </section>

              {/* ── SECCIÓN 2: CONTACTO & EMPRESA ── */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <Zap className="w-4 h-4 text-cyan-500" />
                  <h2 className="section-label text-white">Canales de Contacto</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                      Email Principal <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                    </label>
                    <div className="input-icon-wrapper">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <Field type="email" name="original_email" placeholder="cliente@empresa.com" className="input-premium input-premium-icon" />
                    </div>
                    <ErrorMessage name="original_email" component="p" className="text-[10px] font-bold text-red-500 ml-1" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Teléfono Móvil</label>
                    <div className="flex gap-2">
                      <div className="w-[120px] shrink-0">
                        <Field as="select" name="phone_code" className="input-premium appearance-none cursor-pointer h-full py-0 px-3 text-sm">
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code} className="bg-slate-900">
                              {c.flag} {c.code}
                            </option>
                          ))}
                        </Field>
                      </div>
                      <div className="input-icon-wrapper flex-1">
                        <Phone className="w-4 h-4 text-slate-500" />
                        <Field name="phone_number" placeholder="9 1234 5678" className="input-premium input-premium-icon" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Empresa / Organización</label>
                    <div className="input-icon-wrapper">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <Field name="company" placeholder="Nombre de la empresa" className="input-premium input-premium-icon" />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dirección Física</label>
                    <div className="input-icon-wrapper">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <Field name="address" placeholder="Calle, Ciudad, País" className="input-premium input-premium-icon" />
                    </div>
                  </div>
                </div>
              </section>

              {/* ── SECCIÓN 3: CLASIFICACIÓN ── */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <Target className="w-4 h-4 text-emerald-500" />
                  <h2 className="section-label text-white">Asignación Operativa</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fuente de Origen</label>
                    <div className="input-icon-wrapper">
                      <Zap className="w-4 h-4 text-slate-500" />
                      <Field as="select" name="first_source" className="input-premium input-premium-icon appearance-none cursor-pointer">
                        <option value="" className="bg-slate-900">Seleccionar fuente...</option>
                        {sources.map((s) => (
                          <option key={s.id} value={s.id} className="bg-slate-900">
                            {s.name}
                          </option>
                        ))}
                      </Field>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vendedor Asignado</label>
                    <div className="input-icon-wrapper">
                      <ShieldCheck className="w-4 h-4 text-slate-500" />
                      {user?.isStaff ? (
                        <Field as="select" name="assigned_to" className="input-premium input-premium-icon appearance-none cursor-pointer">
                          <option value="" className="bg-slate-900">Sin asignar (Libre)</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id} className="bg-slate-900">
                              {u.first_name} {u.last_name} ({u.username})
                            </option>
                          ))}
                        </Field>
                      ) : (
                        <div className="input-premium input-premium-icon opacity-50 cursor-not-allowed flex items-center">
                          <span className="text-xs font-bold">Auto-asignado a ti</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold animate-fadeIn">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">!</div>
                  {error}
                </div>
              )}

              {/* ── Final Action ── */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full h-14 flex items-center justify-center gap-3 group/submit"
                >
                  <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-sm">
                    {isSubmitting ? "Sincronizando con Servidor..." : "Finalizar Registro de Lead"}
                  </span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform opacity-50" />
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
      
      {/* ── Footer Info ── */}
      <div className="mt-8 flex justify-center gap-10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Resolución de Identidad</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Validación de Datos</span>
        </div>
      </div>
    </div>
  );
}
