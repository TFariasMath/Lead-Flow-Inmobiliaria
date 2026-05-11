export interface Benefit {
  icon: string;
  title: string;
}

export interface LandingData {
  title: string;
  subtitle: string;
  description: string;
  benefits: Benefit[];
  form_config?: any;
  cta_text: string;
  success_message: string;
  primary_color: string;
  image_url: string;
  campaign_name?: string;
  visits_count?: number;
  conversion_rate?: number;
  latitude?: number;
  longitude?: number;
  campaign?: number;
  properties_details?: any[];
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
