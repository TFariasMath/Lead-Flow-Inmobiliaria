import { Benefit, LandingData as BaseLandingData } from "@/types/api";

export type { Benefit };

// Extendemos o usamos el alias para mantener compatibilidad
export interface LandingData extends BaseLandingData {
  campaign_name?: string; // Propiedad adicional usada en algunos componentes
}

export const COUNTRY_CODES = [
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
