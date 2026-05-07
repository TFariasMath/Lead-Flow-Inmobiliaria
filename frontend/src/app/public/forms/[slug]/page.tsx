"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { CheckCircle2, Building, Phone, Mail, User as UserIcon, Send } from "lucide-react";

const validationSchema = Yup.object({
  first_name: Yup.string()
    .required("El nombre es requerido")
    .max(150, "Máximo 150 caracteres"),
  last_name: Yup.string()
    .required("El apellido es requerido")
    .max(150, "Máximo 150 caracteres"),
  email: Yup.string()
    .email("Email inválido")
    .required("El email es requerido"),
  phone: Yup.string()
    .required("El teléfono es requerido")
    .matches(/^[\d\s\-\+\(\)]*$/, "Formato de teléfono inválido"),
  company: Yup.string().max(200, "Máximo 200 caracteres"),
});

export default function PublicLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  // Convertimos el slug en un título legible
  // ej: inversion-punta-cana -> Inversion Punta Cana
  const campaignName = slug
    ? (Array.isArray(slug) ? slug[0] : slug).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Consulta General";

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[var(--color-surface)] via-[var(--color-bg)] to-black p-4">
        <div className="max-w-md w-full bg-[var(--color-surface)]/40 backdrop-blur-xl border border-[var(--color-border)] rounded-3xl p-10 text-center shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">¡Gracias por tu interés!</h2>
          <p className="text-[var(--color-text-muted)] text-lg mb-8 leading-relaxed">
            Hemos recibido tus datos correctamente. Uno de nuestros asesores expertos se pondrá en contacto contigo muy pronto.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
          >
            Enviar otra consulta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-white selection:bg-[var(--color-primary)]/30 flex relative overflow-hidden">
      {/* Elementos decorativos de fondo (Glassmorphism blobs) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--color-primary)]/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[50%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left Column: Hero Copy */}
        <div className="flex flex-col justify-center p-8 lg:p-16 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-semibold mb-6 border border-[var(--color-primary)]/20 w-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-primary)]"></span>
            </span>
            Campaña Activa: {campaignName}
          </div>
          
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
            Descubre tu próxima <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-purple-400">
              gran inversión.
            </span>
          </h1>
          <p className="text-lg lg:text-xl text-[var(--color-text-muted)] mb-8 max-w-lg leading-relaxed">
            Completa el formulario para recibir asesoría personalizada sobre oportunidades inmobiliarias exclusivas antes de que salgan al mercado.
          </p>
          
          <div className="space-y-4">
            <Feature icon={Building} title="Propiedades Exclusivas" />
            <Feature icon={UserIcon} title="Asesoría 1 a 1" />
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="flex items-center justify-center p-4 lg:p-12 z-10">
          <div className="w-full max-w-md bg-[#1a1d27]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">Déjanos tus datos</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-8">Un experto se comunicará contigo hoy mismo.</p>
            
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Formik
              initialValues={{
                first_name: "",
                last_name: "",
                email: "",
                phone: "",
                company: "",
              }}
              validationSchema={validationSchema}
              onSubmit={async (values, { setSubmitting }) => {
                setError("");
                try {
                  const payload = {
                    source_type: slug || "landing-page",
                    data: values
                  };

                  const response = await fetch("http://localhost:8000/api/v1/webhooks/receive/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });

                  if (!response.ok) {
                    throw new Error("Ocurrió un error al procesar tu solicitud.");
                  }

                  setIsSuccess(true);
                } catch (err: any) {
                  setError(err.message || "Error de conexión. Intenta nuevamente.");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField name="first_name" placeholder="Nombre" icon={UserIcon} />
                    <FormField name="last_name" placeholder="Apellido" icon={UserIcon} />
                  </div>
                  
                  <FormField name="email" type="email" placeholder="Correo electrónico" icon={Mail} />
                  <FormField name="phone" type="tel" placeholder="Teléfono" icon={Phone} />
                  <FormField name="company" placeholder="Empresa (Opcional)" icon={Building} />

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-purple-600 hover:to-purple-500 text-white font-semibold text-lg shadow-lg shadow-[var(--color-primary)]/25 hover:shadow-[var(--color-primary)]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Solicitar Asesoría
                        <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-gray-500 mt-4">
                    Tus datos están protegidos y encriptados.
                  </p>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-gray-300" />
      </div>
      <span className="text-gray-300 font-medium">{title}</span>
    </div>
  );
}

function FormField({ name, type = "text", placeholder, icon: Icon }: any) {
  return (
    <div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Icon className="h-4 w-4 text-gray-500" />
        </div>
        <Field
          type={type}
          name={name}
          placeholder={placeholder}
          className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-transparent transition-all"
        />
      </div>
      <ErrorMessage
        name={name}
        component="p"
        className="text-xs text-red-400 mt-1.5 pl-1"
      />
    </div>
  );
}
