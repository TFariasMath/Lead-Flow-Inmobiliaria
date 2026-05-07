/**
 * Lead Flow - New Lead Page
 * =========================
 * Formulario de creación manual con Formik + Yup.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createLead, getSources, getUsers, type Source, type User } from "@/lib/api";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { ArrowLeft, UserPlus } from "lucide-react";

const validationSchema = Yup.object({
  original_email: Yup.string()
    .email("Email inválido")
    .required("El email es requerido"),
  first_name: Yup.string().max(150, "Máximo 150 caracteres"),
  last_name: Yup.string().max(150, "Máximo 150 caracteres"),
  phone: Yup.string().matches(
    /^[\d\s\-\+\(\)]*$/,
    "Solo números, espacios, guiones y paréntesis"
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
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <button
        onClick={() => router.push("/dashboard/leads")}
        className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Leads
      </button>

      <div>
        <h1 className="text-2xl font-bold text-white">Crear Nuevo Lead</h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          Ingreso manual de un contacto al sistema
        </p>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-8">
        <Formik
          initialValues={{
            original_email: "",
            first_name: "",
            last_name: "",
            phone: "",
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
              const payload: Record<string, unknown> = { ...values };
              if (!payload.first_source) delete payload.first_source;
              if (!payload.assigned_to) delete payload.assigned_to;

              await createLead(token, payload);
              router.push("/dashboard/leads");
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : "Error al crear el lead";
              setError(message);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
                    Email *
                  </label>
                  <Field
                    type="email"
                    name="original_email"
                    placeholder="contacto@ejemplo.com"
                    className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-sm text-white placeholder-[var(--color-text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                  />
                  <ErrorMessage
                    name="original_email"
                    component="p"
                    className="text-xs text-[var(--color-danger)] mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
                    Nombre
                  </label>
                  <Field
                    type="text"
                    name="first_name"
                    placeholder="Juan"
                    className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-sm text-white placeholder-[var(--color-text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                  />
                  <ErrorMessage
                    name="first_name"
                    component="p"
                    className="text-xs text-[var(--color-danger)] mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
                    Apellido
                  </label>
                  <Field
                    type="text"
                    name="last_name"
                    placeholder="Pérez"
                    className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-sm text-white placeholder-[var(--color-text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                  />
                  <ErrorMessage
                    name="last_name"
                    component="p"
                    className="text-xs text-[var(--color-danger)] mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
                    Teléfono
                  </label>
                  <Field
                    type="text"
                    name="phone"
                    placeholder="809-555-1234"
                    className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-sm text-white placeholder-[var(--color-text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                  />
                  <ErrorMessage
                    name="phone"
                    component="p"
                    className="text-xs text-[var(--color-danger)] mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
                    Empresa
                  </label>
                  <Field
                    type="text"
                    name="company"
                    placeholder="Empresa S.A."
                    className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-sm text-white placeholder-[var(--color-text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
                    Dirección
                  </label>
                  <Field
                    type="text"
                    name="address"
                    placeholder="Calle Principal #123, Ciudad"
                    className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-sm text-white placeholder-[var(--color-text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
                    Fuente
                  </label>
                  <Field
                    as="select"
                    name="first_source"
                    className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                  >
                    <option value="">Seleccionar fuente...</option>
                    {sources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Field>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
                    Asignar a Vendedor
                  </label>
                  {user?.isStaff ? (
                    <Field
                      as="select"
                      name="assigned_to"
                      className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                    >
                      <option value="">Sin asignar</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.first_name} {u.last_name} ({u.username})
                        </option>
                      ))}
                    </Field>
                  ) : (
                    <input
                      type="text"
                      value="Asignado a ti (automáticamente)"
                      disabled
                      className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-muted)] opacity-60 cursor-not-allowed"
                    />
                  )}
                </div>
              </div>

              {error && (
                <div className="text-sm text-[var(--color-danger)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-lg px-4 py-2.5">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white font-medium hover:shadow-lg hover:shadow-[var(--color-primary)]/25 transition-all disabled:opacity-50"
              >
                <UserPlus className="w-5 h-5" />
                {isSubmitting ? "Creando..." : "Crear Lead"}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
