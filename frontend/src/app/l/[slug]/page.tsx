/**
 * Lead Flow - Landing Page Pública
 * =================================
 * Ruta pública /l/[slug] — fuera del dashboard.
 * Muestra una landing page personalizada y registra el lead en el CRM.
 */

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface LandingData {
  title: string;
  subtitle: string;
  description: string;
  primary_color: string;
  image_url: string;
  campaign_name: string;
}

interface FormState {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  company: string;
}

export default function LandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [landing, setLanding] = useState<LandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormState>({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    company: "",
  });

  useEffect(() => {
    fetch(`${API_BASE}/landings/${slug}/`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => { if (data) setLanding(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) { setError("El email es requerido."); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/landings/${slug}/submit/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const errData = await res.json();
        setError(errData.email?.[0] || errData.detail || "Error al enviar. Intenta de nuevo.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Error de conexión. Intenta de nuevo más tarde.");
    } finally {
      setSubmitting(false);
    }
  };

  const primaryColor = landing?.primary_color || "#3b82f6";

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${primaryColor}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", color: "#fff" }}>
          <h1 style={{ fontSize: 48, margin: 0 }}>404</h1>
          <p style={{ color: "#94a3b8" }}>Esta página no existe o ya no está disponible.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", color: "#fff", padding: 40, background: "rgba(255,255,255,0.05)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", maxWidth: 480 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 28, marginBottom: 8 }}>¡Listo! Te contactaremos pronto.</h2>
          <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
            Hemos recibido tu información. Uno de nuestros asesores se pondrá en contacto contigo a la brevedad.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .landing-input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 10px;
          color: #fff;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s;
        }
        .landing-input::placeholder { color: rgba(255,255,255,0.35); }
        .landing-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent); }
        .submit-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
        }
        .submit-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div style={{ "--primary": primaryColor } as React.CSSProperties}>
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
          {/* Hero */}
          <div style={{ position: "relative", padding: "80px 24px 60px", textAlign: "center", animation: "fadeInUp 0.6s ease" }}>
            {/* Glow */}
            <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 600, height: 300, background: `radial-gradient(ellipse at center, ${primaryColor}22 0%, transparent 70%)`, pointerEvents: "none" }} />

            {landing?.image_url && (
              <img
                src={landing.image_url}
                alt={landing.title}
                style={{ width: "100%", maxWidth: 600, height: 280, objectFit: "cover", borderRadius: 16, marginBottom: 32, boxShadow: `0 20px 60px ${primaryColor}33` }}
              />
            )}

            <div style={{ display: "inline-block", padding: "6px 16px", background: `${primaryColor}22`, border: `1px solid ${primaryColor}44`, borderRadius: 20, color: primaryColor, fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
              {landing?.campaign_name || "Oferta Exclusiva"}
            </div>

            <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: 16, maxWidth: 700, margin: "0 auto 16px" }}>
              {landing?.title}
            </h1>

            {landing?.subtitle && (
              <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: "#94a3b8", lineHeight: 1.6, maxWidth: 560, margin: "0 auto 40px" }}>
                {landing.subtitle}
              </p>
            )}
          </div>

          {/* Form Card */}
          <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 24px 80px", animation: "fadeInUp 0.8s ease" }}>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "36px 32px", backdropFilter: "blur(12px)" }}>
              <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                Agenda tu asesoría gratuita
              </h2>
              <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28 }}>
                {landing?.description || "Déjanos tus datos y te contactaremos a la brevedad."}
              </p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <input
                  id="landing-email"
                  className="landing-input"
                  type="email"
                  placeholder="Email *"
                  required
                  value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <input
                    id="landing-first-name"
                    className="landing-input"
                    type="text"
                    placeholder="Nombre"
                    value={form.first_name}
                    onChange={(e) => setForm(f => ({ ...f, first_name: e.target.value }))}
                  />
                  <input
                    id="landing-last-name"
                    className="landing-input"
                    type="text"
                    placeholder="Apellido"
                    value={form.last_name}
                    onChange={(e) => setForm(f => ({ ...f, last_name: e.target.value }))}
                  />
                </div>
                <input
                  id="landing-phone"
                  className="landing-input"
                  type="tel"
                  placeholder="Teléfono"
                  value={form.phone}
                  onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                />
                <input
                  id="landing-company"
                  className="landing-input"
                  type="text"
                  placeholder="Empresa (opcional)"
                  value={form.company}
                  onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))}
                />

                {error && (
                  <p style={{ color: "#f87171", fontSize: 13, padding: "10px 14px", background: "rgba(239,68,68,0.1)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)" }}>
                    {error}
                  </p>
                )}

                <button
                  id="landing-submit"
                  type="submit"
                  disabled={submitting}
                  className="submit-btn"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`, color: "#fff", marginTop: 8 }}
                >
                  {submitting ? "Enviando..." : "Quiero más información →"}
                </button>
              </form>

              <p style={{ textAlign: "center", color: "#475569", fontSize: 12, marginTop: 20 }}>
                🔒 Tu información es 100% confidencial y segura.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
