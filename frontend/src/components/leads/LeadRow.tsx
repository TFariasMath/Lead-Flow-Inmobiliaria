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

  // Score Color Logic
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 50) return "text-amber-400";
    return "text-slate-500";
  };

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
          className="bg-blue-500/10 border border-blue-500/50 text-white text-xs px-2 py-1 rounded w-full outline-none focus:ring-1 focus:ring-blue-500 animate-in zoom-in-95 duration-200"
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
        "absolute top-0 left-0 w-full flex items-center border-b border-white/[0.03] transition-all duration-300 group cursor-pointer",
        isSelected ? "bg-blue-500/10" : "hover:bg-white/[0.03] hover:backdrop-blur-sm"
      )}
      style={{
        height: `${virtualRow.size}px`,
        top: `${virtualRow.start}px`,
        position: 'absolute',
      }}
    >
      {/* Checkbox Column */}
      <div className="w-12 h-full flex items-center justify-center shrink-0 sticky left-0 z-10 bg-[#080e1e] border-r border-white/5 transition-colors group-hover:bg-[#0c1428]" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={() => onToggleSelect(lead.id)}
          className={cn(
            "w-4 h-4 rounded-md border transition-all duration-300 flex items-center justify-center", 
            isSelected 
              ? "bg-blue-600 border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.4)]" 
              : "bg-white/5 border-white/10 group-hover:border-white/20"
          )}
        >
          {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Identity Column */}
      {visibleColumns.has("name") && (
        <div className="w-[280px] shrink-0 flex items-center gap-4 px-4 sticky left-12 z-20 bg-[#080e1e] border-r border-white/[0.08] group-hover:bg-[#0c1428] transition-colors">
          <div className="relative">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black text-white shrink-0 shadow-lg transition-transform duration-500 group-hover:scale-110", 
              getAvatarColor(lead.first_name)
            )}>
              {(lead.first_name || "?").charAt(0)}
            </div>
            {/* Score Ring */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
              <svg className="w-4 h-4 -rotate-90">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/5" />
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="transparent" 
                        strokeDasharray={38} strokeDashoffset={38 - (38 * (lead.score || 0)) / 100}
                        className={cn("transition-all duration-1000", getScoreColor(lead.score || 0))} />
              </svg>
            </div>
          </div>

          <div 
            className="flex-1 min-w-0" 
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
              <div className="flex flex-col">
                <p className="text-[13px] font-bold text-white truncate group-hover:text-blue-400 transition-colors tracking-tight">
                  {lead.first_name} {lead.last_name}
                </p>
                <div className="flex items-center gap-2">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">
                    Score: <span className={getScoreColor(lead.score || 0)}>{lead.score || 0}</span>
                  </p>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <p className="text-[9px] font-bold text-slate-500 uppercase truncate">ID: {lead.id.slice(0, 8)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Column */}
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
            className="w-full scale-95 group-hover:scale-100 transition-transform"
          />
        </div>
      )}

      {/* Email Column */}
      {visibleColumns.has("email") && (
        <div className="w-[220px] shrink-0 px-4 flex flex-col">
            <p className="text-[11px] font-mono text-slate-500 truncate group-hover:text-slate-300 transition-colors">{lead.original_email}</p>
            {lead.contact_email && lead.contact_email !== lead.original_email && (
               <p className="text-[9px] font-bold text-blue-500/60 uppercase tracking-tighter">Alias: {lead.contact_email.split('@')[0]}</p>
            )}
        </div>
      )}

      {/* Phone Column */}
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
              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 opacity-0 group-hover/phone:opacity-100 hover:bg-emerald-500/20 transition-all shadow-lg"
              title="WhatsApp Directo"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Actions Column */}
      <div className="w-[100px] shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
        <button 
          onClick={(e) => { e.stopPropagation(); onAction(lead); }}
          className="p-2 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-slate-400 hover:text-white transition-all shadow-lg"
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

LeadRow.displayName = "LeadRow";
