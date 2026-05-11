import { memo, KeyboardEvent } from "react";
import { 
  CheckSquare, 
  Square, 
  MessageCircle, 
  StickyNote, 
  ArrowUpRight 
} from "lucide-react";
import { cn } from "@/lib/utils";
import CustomSelect from "@/components/CustomSelect";
import { Lead } from "@/lib/api";
import { STATUS_OPTIONS, STATUS_LABELS, STATUS_BADGE_MAP } from "@/constants/leads";

interface LeadRowProps {
  lead: Lead;
  virtualRow: any;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  editingCell: { id: string; field: string; value: string } | null;
  setEditingCell: (cell: { id: string; field: string; value: string } | null) => void;
  onInlineUpdate: (id: string, field: string, value: any) => void;
  onSelect: (lead: Lead) => void;
  onStatusUpdate: (id: string, status: string) => void;
  onAction: (lead: Lead) => void;
  visibleColumns: Set<string>;
  getAvatarColor: (name: string) => string;
}

export const LeadRow = memo(({ 
  lead, 
  virtualRow, 
  isSelected, 
  onToggleSelect, 
  editingCell, 
  setEditingCell, 
  onInlineUpdate, 
  onSelect, 
  onStatusUpdate, 
  onAction,
  visibleColumns,
  getAvatarColor
}: LeadRowProps) => {
  const isEditing = (field: string) => editingCell?.id === lead.id && editingCell?.field === field;

  const handleDoubleClick = (field: string, value: string) => {
    setEditingCell({ id: lead.id, field, value });
  };

  const handleKeyDown = (e: KeyboardEvent, field: string) => {
    if (e.key === "Enter") {
      onInlineUpdate(lead.id, field, (e.target as HTMLInputElement).value);
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  const renderEditable = (field: string, value: string, placeholder: string = "...") => {
    if (isEditing(field)) {
      return (
        <input
          autoFocus
          onClick={(e) => e.stopPropagation()}
          className="bg-blue-500/10 border border-blue-500/50 text-white text-xs px-2 py-1 rounded w-full outline-none focus:ring-1 focus:ring-blue-500"
          defaultValue={value}
          onBlur={(e) => onInlineUpdate(lead.id, field, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, field)}
        />
      );
    }
    return (
      <p 
        onDoubleClick={() => handleDoubleClick(field, value)}
        className="text-[11px] font-bold text-slate-400 hover:text-blue-400 cursor-text transition-colors truncate"
      >
        {value || placeholder}
      </p>
    );
  };

  return (
    <div 
      onClick={() => onSelect(lead)}
      className={cn(
        "absolute top-0 left-0 w-full flex items-center border-b border-white/[0.02] hover:bg-white/[0.02] transition-all group cursor-pointer",
        isSelected && "bg-blue-500/5 border-blue-500/10"
      )}
      style={{
        height: `${virtualRow.size}px`,
        top: `${virtualRow.start}px`,
        position: 'absolute',
      }}
    >
      <div className="w-12 h-full flex items-center justify-center shrink-0 sticky left-0 z-10 bg-[#0a0f1e] border-r border-white/5 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.5)] group-hover:bg-[#161e31] transition-colors" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={() => onToggleSelect(lead.id)}
          className={cn("w-4 h-4 rounded border border-white/10 flex items-center justify-center transition-all", isSelected ? "bg-blue-600 border-blue-500" : "bg-white/5 group-hover:border-white/20")}
        >
          {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
        </button>
      </div>

      {visibleColumns.has("name") && (
        <div className="w-[250px] shrink-0 flex items-center gap-3 px-4 sticky left-12 z-20 bg-[#0a0f1e] border-r border-white/10 shadow-[8px_0_15px_-5px_rgba(0,0,0,0.6)] group-hover:bg-[#161e31] transition-colors">
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0", getAvatarColor(lead.first_name))}>
            {(lead.first_name || "?").charAt(0)}
          </div>
          <div 
            className="flex-1 cursor-pointer" 
            onDoubleClick={() => handleDoubleClick("name", `${lead.first_name} ${lead.last_name}`)}
          >
            {isEditing("name") ? (
              <input
                autoFocus
                onClick={(e) => e.stopPropagation()}
                className="bg-blue-500/10 border border-blue-500/50 text-white text-xs px-2 py-1 rounded w-full outline-none"
                defaultValue={`${lead.first_name} ${lead.last_name}`}
                onBlur={(e) => {
                  const [first, ...last] = e.target.value.split(" ");
                  onInlineUpdate(lead.id, "first_name", first || "");
                  onInlineUpdate(lead.id, "last_name", last.join(" ") || "");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const [first, ...last] = (e.target as HTMLInputElement).value.split(" ");
                    onInlineUpdate(lead.id, "first_name", first || "");
                    onInlineUpdate(lead.id, "last_name", last.join(" ") || "");
                    setEditingCell(null);
                  } else if (e.key === "Escape") setEditingCell(null);
                }}
              />
            ) : (
              <p className="text-xs font-bold text-white truncate hover:text-blue-400 transition-colors uppercase tracking-tight">
                {lead.first_name} {lead.last_name}
              </p>
            )}
          </div>
        </div>
      )}

      {visibleColumns.has("status") && (
        <div className="w-[160px] shrink-0 px-4" onClick={(e) => e.stopPropagation()}>
          <CustomSelect
            value={lead.status}
            onChange={(val) => onStatusUpdate(lead.id, val)}
            options={STATUS_OPTIONS.map((opt) => ({
              value: opt,
              label: STATUS_LABELS[opt] || opt,
              badgeClass: STATUS_BADGE_MAP[opt],
            }))}
            variant="badge"
            className="w-full"
          />
        </div>
      )}

      {visibleColumns.has("email") && (
        <div className="w-[220px] shrink-0 px-4 flex items-center">
            <p className="text-[11px] font-mono text-slate-500 truncate">{lead.original_email}</p>
        </div>
      )}

      {visibleColumns.has("phone") && (
        <div className="w-[180px] shrink-0 px-4 group/phone flex items-center justify-between gap-2">
          <div className="flex-1 overflow-hidden" onDoubleClick={() => handleDoubleClick("phone", lead.phone)}>
            {renderEditable("phone", lead.phone, "Sin teléfono")}
          </div>
          {lead.phone && (
            <a 
              href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} 
              target="_blank" 
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 opacity-0 group-hover/phone:opacity-100 hover:bg-emerald-500/20 transition-all"
              title="WhatsApp Directo"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      <div className="w-[100px] shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); onAction(lead); }}
          className="p-2 rounded-xl bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-slate-500 transition-all"
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

LeadRow.displayName = "LeadRow";
