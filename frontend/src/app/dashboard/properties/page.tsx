/**
 * Lead Flow - Properties Catalog (Premium v3)
 * ==========================================
 * Gestión del catálogo maestro de activos inmobiliarios.
 * Interfaz de alta fidelidad para la administración de proyectos.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getProperties, deleteProperty, type Property } from "@/lib/api";
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink,
  DollarSign,
  TrendingUp,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import PropertyEditor from "@/components/PropertyEditor";
import MapSection from "@/components/MapSection";
import { Grid, Map as MapIcon } from "lucide-react";

export default function PropertiesPage() {
  const { token } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

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
    if (!token || !confirm("¿Estás seguro de eliminar este proyecto del catálogo?")) return;
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
    <div className="space-y-8 animate-fadeIn pb-16">
      
      {/* ── Metric Strip ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger-children">
        <MiniCard icon={Building2} label="Proyectos Totales" value={properties.length} color="#3b82f6" />
        <MiniCard icon={Layers} label="En Inventario" value={properties.filter(p => p.is_active).length} color="#10b981" />
        <MiniCard icon={MapPin} label="Ubicaciones" value={new Set(properties.map(p => p.location)).size} color="#f59e0b" />
        <MiniCard icon={TrendingUp} label="Retorno Promedio" value="14.2%" color="#a78bfa" trend="↑ 1.2%" />
      </div>

      {/* ── Header Section ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="section-title">Portafolio de Activos</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
            <Building2 className="w-3 h-3 text-blue-500" />
            Control maestro de inventario inmobiliario
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-slate-900/50 border border-white/5 p-1 rounded-xl mr-2">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === "grid" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
              title="Vista de Cuadrícula"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === "map" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
              title="Vista de Mapa"
            >
              <MapIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="input-icon-wrapper group">
            <Search className="w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar proyecto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-premium input-premium-icon h-12 w-64 lg:w-80"
            />
          </div>
          <button
            onClick={handleNew}
            className="btn-primary h-12 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Proyecto
          </button>
        </div>
      </div>

      {/* ── Properties Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[480px] glass-container rounded-[2.5rem] animate-pulse border border-white/5 bg-white/[0.01]" />
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="py-40 glass-container rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-slate-500 border-dashed border-2">
          <Building2 className="w-12 h-12 opacity-20" />
          <p className="font-bold text-sm">No se encontraron proyectos en el catálogo</p>
          <button onClick={handleNew} className="btn-ghost mt-2">Crear primer activo</button>
        </div>
      ) : viewMode === "map" ? (
        <div className="h-[600px] w-full animate-fadeInUp">
          <MapSection 
            properties={filteredProperties} 
            primaryColor="#3b82f6" 
            onPropertyClick={handleEdit}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 stagger-children">
          {filteredProperties.map((property, idx) => (
            <div 
              key={property.id}
              className="glass-card rounded-[2.5rem] overflow-hidden group flex flex-col h-full border border-white/[0.05]"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Media Header */}
              <div className="relative h-56 bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#060a18] via-transparent to-transparent z-10" />
                
                {property.main_image_url ? (
                  <img 
                    src={property.main_image_url} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    alt={property.name}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 group-hover:scale-110 transition-transform duration-700">
                    <div className="absolute inset-0 opacity-[0.03] pattern-grid-lg" />
                    <Building2 className="w-16 h-16 text-slate-700 group-hover:text-blue-500/40 transition-colors" />
                  </div>
                )}
                
                {/* Float Badges */}
                <div className="absolute top-5 left-5 z-20 flex flex-col gap-2">
                  <div className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl flex items-center gap-1.5 animate-fadeIn">
                    <TrendingUp className="w-3 h-3" />
                    {property.estimated_return || '12%'} ROI Est.
                  </div>
                  <div className={cn(
                    "px-3 py-1.5 backdrop-blur-xl text-[10px] font-black uppercase tracking-widest rounded-xl border animate-fadeIn",
                    property.is_active 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  )}>
                    {property.is_active ? 'Activo' : 'Pausado'}
                  </div>
                </div>

                <div className="absolute bottom-5 left-5 right-5 z-20">
                   <div className="flex items-center gap-2 text-white/60">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[10px] font-black uppercase tracking-[0.15em]">{property.location}</span>
                   </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-black text-white mb-6 group-hover:text-blue-400 transition-colors line-clamp-1">
                  {property.name}
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] group/item hover:bg-white/[0.04] transition-all">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                      <DollarSign className="w-3 h-3 text-emerald-500" /> Inversión
                    </p>
                    <p className="text-base font-black text-white">
                      ${Number(property.min_investment).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] group/item hover:bg-white/[0.04] transition-all">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-blue-500" /> Entrega
                    </p>
                    <p className="text-base font-black text-white">
                      {property.delivery_date || 'Inmediata'}
                    </p>
                  </div>
                </div>

                {/* Amenities */}
                <div className="flex flex-wrap gap-2 mb-10">
                  {property.amenities?.slice(0, 3).map((am, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white/[0.03] text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-white/[0.04]">
                      {am}
                    </span>
                  ))}
                  {property.amenities?.length > 3 && (
                    <span className="text-[9px] font-black text-slate-700 px-1 py-1">
                      +{property.amenities.length - 3} more
                    </span>
                  )}
                </div>

                {/* Action Row */}
                <div className="mt-auto pt-6 border-t border-white/[0.04] flex items-center justify-between">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(property)}
                      className="w-10 h-10 rounded-xl bg-white/[0.03] text-slate-600 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10 flex items-center justify-center"
                      title="Editar Activo"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(property.id)}
                      className="w-10 h-10 rounded-xl bg-white/[0.03] text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/10 flex items-center justify-center"
                      title="Eliminar de Catálogo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <a 
                    href={`/projects/${property.slug}`}
                    target="_blank"
                    className="h-10 px-4 rounded-xl bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                  >
                    Landing
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal Overlay */}
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

function MiniCard({ icon: Icon, label, value, color, trend }: { icon: any; label: string; value: string | number; color: string; trend?: string }) {
  return (
    <div className="glass-card rounded-2xl p-4 flex items-center justify-between group relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full opacity-40 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: color }} />
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform duration-500" style={{ color }}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-0.5">{label}</p>
          <p className="text-xl font-black text-white">{value}</p>
        </div>
      </div>
      {trend && (
        <div className="text-[9px] font-black px-1.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          {trend}
        </div>
      )}
    </div>
  );
}
