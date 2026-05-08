"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Upload, 
  Check, 
  Loader2, 
  Plus,
  Image as ImageIcon,
  Search
} from "lucide-react";
import { MediaAsset, getMediaAssets, uploadMediaAsset } from "@/lib/api";
import { cn } from "@/lib/utils";

interface MediaPickerProps {
  token: string | null;
  selectedId: number | null;
  onSelect: (asset: MediaAsset) => void;
  onClose: () => void;
}

export default function MediaPicker({ token, selectedId, onSelect, onClose }: MediaPickerProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchAssets = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getMediaAssets(token);
      setAssets(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [token]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploading(true);
    try {
      const newAsset = await uploadMediaAsset(token, file, file.name);
      setAssets([newAsset, ...assets]);
      onSelect(newAsset);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  const filteredAssets = assets.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fadeIn" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-[#0f172a] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-scaleIn">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Biblioteca de Medios</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Selecciona o sube una imagen para el proyecto</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Upload Bar */}
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 bg-slate-950/20">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input 
              type="text" 
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50"
            />
          </div>
          
          <label className={cn(
            "cursor-pointer flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20",
            uploading && "opacity-50 pointer-events-none"
          )}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Subir Nueva
            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
          </label>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Cargando galería...</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-600 italic">
              <ImageIcon className="w-12 h-12 opacity-10" />
              <p>No se encontraron imágenes</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredAssets.map((asset) => (
                <div 
                  key={asset.id}
                  onClick={() => onSelect(asset)}
                  className={cn(
                    "group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all",
                    selectedId === asset.id ? "border-blue-500 ring-4 ring-blue-500/20" : "border-white/5 hover:border-white/20"
                  )}
                >
                  <img 
                    src={asset.file} 
                    alt={asset.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="absolute bottom-2 left-2 right-2 text-[8px] font-bold text-white uppercase tracking-wider truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {asset.title}
                  </p>
                  
                  {selectedId === asset.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg animate-scaleIn">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-slate-950/30 text-center">
          <button 
            onClick={onClose}
            className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
          >
            Cerrar Galería
          </button>
        </div>
      </div>
    </div>
  );
}
