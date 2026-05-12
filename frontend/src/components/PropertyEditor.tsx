/**
 * Lead Flow - Property Editor Component
 * =====================================
 * Slide-over para crear o editar proyectos inmobiliarios.
 */

"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, Building2, MapPin, DollarSign, Calendar, TrendingUp, Plus, Trash, Image as ImageIcon } from "lucide-react";
import { createProperty, updateProperty, type Property, type MediaAsset } from "@/lib/api";
import { cn } from "@/lib/utils";
import MediaPicker from "./MediaPicker";

interface PropertyEditorProps {
  property: Property | null;
  isOpen: boolean;
  token: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PropertyEditor({ property, isOpen, token, onClose, onSuccess }: PropertyEditorProps) {
  const [loading, setLoading] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [selectedImageAsset, setSelectedImageAsset] = useState<MediaAsset | null>(null);

  const [formData, setFormData] = useState<Partial<Property>>({
    name: "",
    slug: "",
    description: "",
    location: "",
    latitude: 0,
    longitude: 0,
    min_investment: "0",
    estimated_return: "10%",
    delivery_date: "",
    amenities: [],
    is_active: true,
  });

  const [newAmenity, setNewAmenity] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 🔍 Mapbox Address Autocomplete Logic
  useEffect(() => {
    const query = formData.address;
    if (!query || query.length < 5) {
      setSuggestions([]);
      return;
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) return;

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&autocomplete=true&limit=5&language=es`
        );
        const data = await response.json();
        setSuggestions(data.features || []);
      } catch (err) {
        console.error("Mapbox Error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.address]);

  const handleSelectSuggestion = (feature: any) => {
    const [lng, lat] = feature.center;
    
    // Intentar extraer la ciudad/región para el campo 'location'
    const context = feature.context || [];
    const city = context.find((c: any) => c.id.startsWith('place'))?.text || "";
    const country = context.find((c: any) => c.id.startsWith('country'))?.text || "";
    const locationStr = [city, country].filter(Boolean).join(", ");

    setFormData({
      ...formData,
      address: feature.place_name,
      latitude: lat,
      longitude: lng,
      location: locationStr || formData.location
    });
    setSuggestions([]);
  };

  useEffect(() => {
    if (property) {
      setFormData(property);
      // If we have a URL from the serializer, we can show it in the preview
      if (property.main_image_url) {
        setSelectedImageAsset({ 
          file: property.main_image_url, 
          id: property.main_image 
        } as MediaAsset);
      } else {
        setSelectedImageAsset(null);
      }
    } else {
      setFormData({
        name: "",
        slug: "",
        description: "",
        location: "",
        latitude: 0,
        longitude: 0,
        min_investment: "0",
        estimated_return: "10%",
        delivery_date: "",
        amenities: [],
        is_active: true,
      });
      setSelectedImageAsset(null);
    }
  }, [property, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);

    // Sanitizar payload para evitar enviar campos calculados o de solo lectura
    const { 
      id, created_at, updated_at, main_image_url, 
      ...payload 
    } = formData;

    try {
      if (property) {
        await updateProperty(token, property.id.toString(), payload);
      } else {
        await createProperty(token, payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error al guardar la propiedad");
    } finally {
      setLoading(false);
    }
  };

  const addAmenity = () => {
    if (!newAmenity.trim()) return;
    setFormData({
      ...formData,
      amenities: [...(formData.amenities || []), newAmenity.trim()],
    });
    setNewAmenity("");
  };

  const removeAmenity = (index: number) => {
    setFormData({
      ...formData,
      amenities: (formData.amenities || []).filter((_, i) => i !== index),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-[#0f172a] border-l border-white/10 shadow-2xl animate-slideInRight flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-600/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {property ? "Editar Proyecto" : "Nuevo Proyecto"}
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Configuración del activo inmobiliario</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          {/* Main Info */}
          <div className="space-y-6">
             <div className="flex items-center gap-2 text-slate-400 mb-2">
                <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest">Información Base</span>
             </div>
             
             {/* Image Picker */}
             <div className="space-y-4 mb-6">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Imagen Principal</label>
                <div 
                  onClick={() => setShowMediaPicker(true)}
                  className="group relative aspect-video rounded-2xl bg-slate-900 border border-white/5 overflow-hidden cursor-pointer hover:border-blue-500/50 transition-all flex flex-col items-center justify-center gap-3"
                >
                  {selectedImageAsset ? (
                    <>
                      <img src={selectedImageAsset.file} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <span className="text-[10px] font-black text-white uppercase tracking-widest bg-blue-600 px-4 py-2 rounded-xl">Cambiar Imagen</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-blue-500 transition-colors">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Click para seleccionar imagen</p>
                    </>
                  )}
                </div>
             </div>

             <div className="space-y-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nombre del Proyecto <span className="text-red-500">*</span></label>
                 <input
                   required
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                   placeholder="Ej: Residencial Las Palmas"
                   className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                 />
               </div>
 
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ubicación <span className="text-red-500">*</span></label>
                   <div className="relative">
                     <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                     <input
                       required
                       value={formData.location}
                       onChange={e => setFormData({...formData, location: e.target.value})}
                       placeholder="Ciudad, País"
                       className="w-full bg-slate-900/50 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                     />
                   </div>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">URL Amigable (Slug)</label>
                   <input
                     value={formData.slug}
                     onChange={e => setFormData({...formData, slug: e.target.value})}
                     placeholder="las-palmas"
                     className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                   />
                 </div>
               </div>

                <div className="space-y-2 relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                    <span>Dirección Completa</span>
                    {isSearching && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                  </label>
                  <div className="relative">
                    <input
                      value={formData.address || ""}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      placeholder="Ej: Av. Costanera 123, Oficina 402"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                    />
                    
                    {/* Suggestions Dropdown */}
                    {suggestions.length > 0 && (
                      <div className="absolute z-[110] left-0 right-0 mt-2 bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
                        {suggestions.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSelectSuggestion(s)}
                            className="w-full px-5 py-3 text-left hover:bg-blue-600/10 transition-colors border-b border-white/5 last:border-0 group"
                          >
                            <p className="text-xs font-black text-white line-clamp-1 group-hover:text-blue-400 transition-colors">
                              {s.text}
                            </p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase truncate mt-0.5">
                              {s.place_name}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
               <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Latitud</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={e => setFormData({...formData, latitude: parseFloat(e.target.value) || 0})}
                      className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Longitud</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={e => setFormData({...formData, longitude: parseFloat(e.target.value) || 0})}
                      className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                    />
                  </div>
                </div>
             </div>
          </div>

          {/* Metrics */}
          <div className="space-y-6">
             <div className="flex items-center gap-2 text-slate-400 mb-2">
                <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest">Métricas de Inversión</span>
             </div>

             <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <DollarSign className="w-3 h-3" /> Min. Inv. <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">$</span>
                    <input
                      type="text"
                      required
                      value={formData.min_investment}
                      onChange={e => setFormData({...formData, min_investment: e.target.value})}
                      className="w-full bg-slate-900/50 border border-white/5 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3" /> ROI Est. <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.estimated_return?.replace('%', '')}
                      onChange={e => setFormData({...formData, estimated_return: e.target.value + '%'})}
                      placeholder="12"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-xl pl-4 pr-8 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> Entrega
                  </label>
                  <input
                    type="text"
                    value={formData.delivery_date}
                    onChange={e => setFormData({...formData, delivery_date: e.target.value})}
                    placeholder="Dic 2025"
                    className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                  />
                </div>
             </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Descripción del Proyecto</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows={4}
              placeholder="Describe las ventajas competitivas del proyecto..."
              className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 resize-none"
            />
          </div>

          {/* Amenities */}
          <div className="space-y-4">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amenidades & Servicios</label>
             <div className="flex gap-2">
                <input
                  value={newAmenity}
                  onChange={e => setNewAmenity(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                  placeholder="Ej: Piscina Infinity"
                  className="flex-1 bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                />
                <button
                  type="button"
                  onClick={addAmenity}
                  className="p-3 bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors"
                >
                  <Plus className="w-5 h-5 text-white" />
                </button>
             </div>
             <div className="flex flex-wrap gap-2">
                {formData.amenities?.map((am, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 text-xs text-slate-300">
                    {am}
                    <button type="button" onClick={() => removeAmenity(i)} className="text-slate-500 hover:text-red-400">
                      <Trash className="w-3 h-3" />
                    </button>
                  </div>
                ))}
             </div>
          </div>

        </form>

        {/* Footer Actions */}
        <div className="p-8 border-t border-white/5 bg-slate-950/30 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Publicar en Brochure:</span>
              <button
                type="button"
                onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                  formData.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                )}
              >
                {formData.is_active ? "Activo" : "Pausado"}
              </button>
           </div>
           
           <div className="flex gap-4">
             <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
             >
                Cancelar
             </button>
             <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50 shadow-xl shadow-blue-600/20"
             >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Proyecto
             </button>
           </div>
        </div>
      </div>

      {showMediaPicker && (
        <MediaPicker 
          token={token}
          selectedId={formData.main_image}
          onSelect={(asset) => {
            setSelectedImageAsset(asset);
            setFormData({ ...formData, main_image: asset.id });
          }}
          onClose={() => setShowMediaPicker(false)}
        />
      )}
    </div>
  );
}
