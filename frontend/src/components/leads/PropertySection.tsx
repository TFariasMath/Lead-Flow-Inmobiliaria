import React, { useState } from "react";
import { MapPin, Plus, Search, CheckCircle2, Building2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Lead, Property } from "@/lib/api";

interface PropertySectionProps {
  lead: Lead;
  allProperties: Property[];
  toggleProperty: (id: number) => Promise<void>;
}

export const PropertySection: React.FC<PropertySectionProps> = ({ 
  lead, 
  allProperties, 
  toggleProperty 
}) => {
  const [showPropertySelect, setShowPropertySelect] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const interestedProps = allProperties.filter(p => lead.interested_properties?.includes(p.id));

  return (
    <section className="bg-blue-500/[0.02] border border-blue-500/10 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
          <MapPin className="w-3 h-3" /> Proyectos de Interés
        </h3>
        <button 
          onClick={() => setShowPropertySelect(!showPropertySelect)}
          className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showPropertySelect && (
        <div className="mb-6 space-y-3">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
             <input 
               type="text" 
               placeholder="Buscar por nombre o ubicación..." 
               className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
               autoFocus
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
          
          <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-2">
            {allProperties
              .filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                p.location.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(prop => (
              <button
                key={prop.id}
                onClick={() => toggleProperty(prop.id)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border text-left transition-all group",
                  lead.interested_properties?.includes(prop.id)
                    ? "bg-blue-600/20 border-blue-500/30 text-white"
                    : "bg-white/[0.02] border-white/[0.05] text-slate-400 hover:border-white/20"
                )}
              >
                <div>
                  <p className="text-xs font-bold">{prop.name}</p>
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">{prop.location}</p>
                </div>
                {lead.interested_properties?.includes(prop.id) && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
              </button>
            ))}
            {allProperties.length > 0 && allProperties.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
              <p className="text-center py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">No se encontraron proyectos</p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {interestedProps.length > 0 ? (
          interestedProps.map(prop => (
            <div key={prop.id} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl group hover:border-blue-500/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                   <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-white">{prop.name}</p>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{prop.location}</p>
                </div>
              </div>
              <button onClick={() => toggleProperty(prop.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-red-400 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="py-8 text-center border-2 border-dashed border-white/[0.04] rounded-2xl">
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Sin proyectos asignados</p>
          </div>
        )}
      </div>
    </section>
  );
};
