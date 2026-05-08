"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Save, 
  Loader2, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { Property, createProperty, updateProperty } from "@/lib/api";
import { cn } from "@/lib/utils";

interface PropertyEditorProps {
  property: Property | null; // null for "new" mode
  isOpen: boolean;
  token: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PropertyEditor({ property, isOpen, token, onClose, onSuccess }: PropertyEditorProps) {
  const [formData, setFormData] = useState<Partial<Property>>({
    name: "",
    slug: "",
    description: "",
    location: "",
    min_investment: "0.00",
    estimated_return: "",
    delivery_date: "",
    amenities: [],
    is_active: true
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (property) {
      setFormData(property);
    } else {
      setFormData({
        name: "",
        slug: "",
        description: "",
        location: "",
        min_investment: "0.00",
        estimated_return: "",
        delivery_date: "",
        amenities: [],
        is_active: true
      });
    }
    setError(null);
  }, [property, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setError(null);

    try {
      if (property) {
        await updateProperty(token, property.id.toString(), formData);
      } else {
        await createProperty(token, formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al guardar la propiedad");
    } finally {
      setSaving(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    const current = formData.amenities || [];
    const updated = current.includes(amenity)
      ? current.filter(a => a !== amenity)
      : [...current, amenity];
    setFormData({ ...formData, amenities: updated });
  };

  const handleSlugify = (name: string) => {
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    setFormData({ ...formData, name, slug });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] animate-fadeIn"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-3 right-3 bottom-3 w-full max-w-xl bg-[#060c1a] border border-white/[0.06] rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.6)] z-[101] flex flex-col overflow-hidden animate-slideInRight">
        {/* Header */}
        <div className="p-8 border-b border-white/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {property ? "Editar Proyecto" : "Nuevo Proyecto"}
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                {property ? `ID: ${property.id}` : "Configuración de catálogo maestro"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 text-slate-600 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-xs font-bold animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Section: Basic Info */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Información Principal</label>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => handleSlugify(e.target.value)}
                  placeholder="Nombre del proyecto"
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <input 
                  type="text" 
                  value={formData.slug} 
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Slug (URL)"
                  className="w-full bg-white/[0.01] border border-white/5 rounded-xl px-5 py-2.5 text-xs text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section: Location & Financials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Ubicación</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  value={formData.location} 
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ej: Punta Cana"
                  className="w-full pl-12 pr-5 py-3.5 bg-white/[0.02] border border-white/5 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                  required
                />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Inversión Mínima ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.min_investment} 
                  onChange={e => setFormData({ ...formData, min_investment: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-12 pr-5 py-3.5 bg-white/[0.02] border border-white/5 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section: Returns & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Retorno Estimado</label>
                <div className="relative">
                  <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    value={formData.estimated_return} 
                    onChange={e => setFormData({ ...formData, estimated_return: e.target.value })}
                    placeholder="Ej: 8% - 12% Anual"
                    className="w-full pl-12 pr-5 py-3.5 bg-white/[0.02] border border-white/5 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Fecha de Entrega</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    value={formData.delivery_date} 
                    onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
                    placeholder="Ej: Dic 2025"
                    className="w-full pl-12 pr-5 py-3.5 bg-white/[0.02] border border-white/5 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                  />
                </div>
              </div>
          </div>

          {/* Section: Description */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Descripción del Proyecto</label>
            <textarea 
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Escribe los detalles técnicos y comerciales..."
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all resize-none"
            />
          </div>

          {/* Section: Status */}
          <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5">
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-tight">Estado de Publicación</p>
              <p className="text-[10px] text-slate-500 font-medium">Define si el proyecto es visible en campañas.</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
              className={cn(
                "h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                formData.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
              )}
            >
              {formData.is_active ? "Activo" : "Pausado"}
            </button>
          </div>

        </form>

        {/* Footer */}
        <div className="p-8 border-t border-white/[0.04] bg-[#08101f]/50 backdrop-blur-md">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-[0.1em] shadow-xl shadow-blue-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {property ? "Guardar Cambios" : "Crear Proyecto"}
          </button>
        </div>
      </div>
    </>
  );
}
