"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import LandingLayout, { type LandingData } from "@/components/LandingLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function PublicLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [landing, setLanding] = useState<LandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  const handleSubmit = async (form: any) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !landing) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white text-center p-4">
        <div>
          <h1 className="text-6xl font-bold mb-4 opacity-20">404</h1>
          <p className="text-slate-400">Esta página no existe o ha sido desactivada.</p>
        </div>
      </div>
    );
  }

  return (
    <LandingLayout
      data={landing}
      onSubmit={handleSubmit}
      submitting={submitting}
      error={error}
      submitted={submitted}
    />
  );
}
