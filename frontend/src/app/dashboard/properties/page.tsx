/**
 * Lead Flow - Properties Catalog
 * =============================
 * Gestión del catálogo maestro de proyectos inmobiliarios.
 * Permite crear, editar y visualizar las propiedades disponibles para los brochures.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getProperties, deleteProperty, type Property } from "@/lib/api";
import { 
  Building2, 
  MapPin, 
  TrendingUp, 
  Calendar, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import PropertyEditor from "@/components/PropertyEditor";

export default function PropertiesPage() {
  const { token } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const fetchProperties = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getProperties(token);
      setProperties(data.results || []);
    } catch (err) {
      console.error("Error fetching properties:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleDelete = async (id: number) => {
    if (!token || !confirm("¿Estás seguro de eliminar esta propiedad?")) return;
    try {
      await deleteProperty(token, id.toString());
      setProperties(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (property: Property) => {
    setSelectedProperty(property);
    setIsEditorOpen(true);
  };

  const handleNew = () => {
    setSelectedProperty(null);
    setIsEditorOpen(true);
  };

  const filteredProperties = properties.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Catálogo de Proyectos</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
            <Building2 className="w-3 h-3 text-blue-500" />
            {properties.length} Propiedades registradas en el sistema
          </p>
        </div>
        <button
          onClick={handleNew}
          className="h-12 px-6 rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-500 shadow-xl shadow-blue-600/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Proyecto
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-900/40 p-4 rounded-[2rem] border border-white/5 backdrop-blur-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o ubicación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-white/5 rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-6 px-4">
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Activos</p>
            <p className="text-lg font-black text-emerald-400">{properties.filter(p => p.is_active).length}</p>
          </div>
          <div className="w-px h-8 bg-white/5" />
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Zonas</p>
            <p className="text-lg font-black text-white">{new Set(properties.map(p => p.location)).size}</p>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[400px] bg-slate-900/20 rounded-[2.5rem] animate-pulse border border-white/5" />
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/10 rounded-[3rem] border border-dashed border-white/5">
          <Building2 className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-widest">No se encontraron proyectos</p>
          <button 
            onClick={handleNew}
            className="mt-4 text-blue-500 text-xs font-bold uppercase tracking-widest hover:underline"
          >
            Crear el primer proyecto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.map((property) => (
            <div 
              key={property.id}
              className="group bg-slate-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden hover:border-blue-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-900/10 flex flex-col"
            >
              {/* Image Header */}
              <div className="relative h-48 bg-slate-800 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
                {/* Fallback image style */}
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                  <Building2 className="w-12 h-12 text-slate-700 group-hover:scale-110 transition-transform duration-500" />
                </div>
                
                {/* Badges */}
                <div className="absolute top-4 left-4 z-20 flex gap-2">
                  <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                    {property.estimated_return || 'N/A'}
                  </span>
                  {property.is_active ? (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest rounded-lg backdrop-blur-md">
                      Activo
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-black uppercase tracking-widest rounded-lg backdrop-blur-md">
                      Pausado
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors truncate">
                    {property.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-blue-500" />
                    {property.location}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <DollarSign className="w-2.5 h-2.5" />
                      Inversión
                    </p>
                    <p className="text-sm font-black text-white">
                      ${Number(property.min_investment).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      Entrega
                    </p>
                    <p className="text-sm font-black text-white">
                      {property.delivery_date || 'Inmediata'}
                    </p>
                  </div>
                </div>

                {/* Amenities Preview */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {property.amenities?.slice(0, 3).map((am, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-800/50 text-slate-400 text-[8px] font-bold uppercase tracking-widest rounded-md border border-white/5">
                      {am}
                    </span>
                  ))}
                  {property.amenities?.length > 3 && (
                    <span className="text-[8px] font-bold text-slate-600 p-0.5">
                      +{property.amenities.length - 3}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(property)}
                      className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(property.id)}
                      className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/10"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <a 
                    href={`/projects/${property.slug}`}
                    target="_blank"
                    className="p-2.5 rounded-xl bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-lg shadow-blue-950/20"
                    title="Ver Landing"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <PropertyEditor 
        property={selectedProperty}
        isOpen={isEditorOpen}
        token={token}
        onClose={() => setIsEditorOpen(false)}
        onSuccess={fetchProperties}
      />
    </div>
  );
}
