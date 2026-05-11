import { createPortal } from "react-dom";
import { X, Download } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import { Lead, User } from "@/lib/api";
import { STATUS_OPTIONS, STATUS_LABELS, STATUS_BADGE_MAP } from "@/constants/leads";

interface BulkActionsBarProps {
  selectedIds: Set<string>;
  onClear: () => void;
  onBulkUpdate: (fields: Partial<Lead>) => void;
  usersData: User[] | undefined;
  onExport: () => void;
  isMounted: boolean;
}

export const BulkActionsBar = ({
  selectedIds,
  onClear,
  onBulkUpdate,
  usersData,
  onExport,
  isMounted
}: BulkActionsBarProps) => {
  if (!isMounted || selectedIds.size === 0) return null;

  return createPortal(
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[999] animate-slideUp">
      <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-6 ring-1 ring-white/5">
        <div className="flex items-center gap-3 pr-6 border-r border-white/10">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-black text-white">
            {selectedIds.size}
          </div>
          <p className="text-[10px] font-black text-white uppercase tracking-widest">Leads Seleccionados</p>
          <button onClick={onClear} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cambiar Estado:</p>
            <CustomSelect
              value=""
              onChange={(val) => onBulkUpdate({ status: val as any })}
              options={[
                { value: "", label: "Seleccionar..." },
                ...STATUS_OPTIONS.map(opt => ({ 
                  value: opt, 
                  label: STATUS_LABELS[opt] || opt,
                  badgeClass: STATUS_BADGE_MAP[opt]
                }))
              ]}
              className="min-w-[120px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Asignar a:</p>
            <CustomSelect
              value=""
              onChange={(val) => onBulkUpdate({ assigned_to: parseInt(val) })}
              options={[
                { value: "", label: "Vendedor..." },
                ...(usersData || []).map((u: any) => ({ value: u.id.toString(), label: u.username }))
              ]}
              className="min-w-[120px]"
            />
          </div>

          <button 
            onClick={onExport} 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-white uppercase hover:bg-white/10 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
