export const STATUS_OPTIONS = [
  "nuevo",
  "contactado",
  "en_calificacion",
  "propuesta_enviada",
  "cierre_ganado",
  "cierre_perdido",
];

export const STATUS_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  en_calificacion: "En Calificación",
  propuesta_enviada: "Propuesta Enviada",
  cierre_ganado: "Cierre Ganado",
  cierre_perdido: "Cierre Perdido",
};

export const STATUS_COLORS: Record<string, string> = {
  nuevo: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  contactado: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  en_calificacion: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  propuesta_enviada: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  cierre_ganado: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  cierre_perdido: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

export const THEME_COLORS: Record<string, string> = {
  nuevo: "bg-blue-500",
  contactado: "bg-cyan-500",
  en_calificacion: "bg-amber-500",
  propuesta_enviada: "bg-violet-500",
  cierre_ganado: "bg-emerald-500",
  cierre_perdido: "bg-red-500",
};
