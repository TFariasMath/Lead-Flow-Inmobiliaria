import React, { useState } from "react";
import { Mail, Phone, Building2, Calendar, Copy, CheckCircle2, ExternalLink, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Lead } from "@/lib/api";

interface InfoCardProps {
  icon: any;
  label: string;
  value: string;
  action?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon: Icon, label, value, action }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10 transition-all group relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Icon className="w-4 h-4" />
          </div>
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
        </div>
        
        {value && value !== "—" && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={handleCopy}
              className="p-1.5 rounded-md hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
              title="Copiar"
            >
              {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
            {action && (
              <a 
                href={`${action}:${value}`}
                className="p-1.5 rounded-md hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                title="Abrir"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>
      <p className="text-sm font-bold text-white truncate pr-8">{value}</p>
    </div>
  );
};

interface ContactInfoProps {
  lead: Lead;
}

export const ContactInfo: React.FC<ContactInfoProps> = ({ lead }) => {
  return (
    <section className="bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-6 shadow-inner relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />
      
      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
        <User className="w-3.5 h-3.5 text-blue-400" /> 
        Información de Contacto
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoCard icon={Mail} label="Email Principal" value={lead.original_email} action="mailto" />
        <InfoCard icon={Phone} label="Teléfono" value={lead.phone || "—"} action="tel" />
        <InfoCard icon={Building2} label="Fuente del Lead" value={lead.first_source_name} />
        <InfoCard icon={Calendar} label="Fecha de Captura" value={format(new Date(lead.created_at), "dd MMM, yyyy", { locale: es })} />
      </div>
    </section>
  );
};
