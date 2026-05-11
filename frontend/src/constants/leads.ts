export const STATUS_OPTIONS = ["nuevo", "contactado", "en_calificacion", "propuesta_enviada", "cierre_ganado", "cierre_perdido"];

export const STATUS_BADGE_MAP: Record<string, string> = {
  nuevo: "badge-blue",
  contactado: "badge-cyan",
  en_calificacion: "badge-amber",
  propuesta_enviada: "badge-violet",
  cierre_ganado: "badge-emerald",
  cierre_perdido: "badge-slate",
};

export const STATUS_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  en_calificacion: "Calificación",
  propuesta_enviada: "Propuesta",
  cierre_ganado: "Ganado",
  cierre_perdido: "Perdido",
};
