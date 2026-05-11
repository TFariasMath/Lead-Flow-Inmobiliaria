"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  User, 
  Mail, 
  ChevronRight, 
  Calendar,
  MessageCircle
} from "lucide-react";
import { Lead } from "@/lib/api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface KanbanCardProps {
  lead: Lead;
  isOverlay?: boolean;
  onSelect: (id: string) => void;
}

export function KanbanCard({ lead, isOverlay, onSelect }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const isHot = lead.score >= 80;
  const isCold = lead.score <= 30;

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="w-full h-36 rounded-2xl border-2 border-dashed border-blue-500/20 bg-blue-500/5 opacity-50"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(lead.id)}
      className={cn(
        "glass-card p-5 rounded-2xl cursor-grab active:cursor-grabbing hover:border-white/20 transition-all duration-300 group relative overflow-hidden",
        isOverlay && "shadow-2xl ring-2 ring-blue-500/50 border-blue-500/30 scale-105 rotate-1",
        isHot && "ring-1 ring-amber-500/30 border-amber-500/20"
      )}
    >
      {/* Score Glow Background */}
      <div 
        className={cn(
          "absolute -right-4 -top-4 w-16 h-16 blur-[30px] opacity-10 transition-opacity duration-500",
          isHot ? "bg-amber-500 opacity-20" : isCold ? "bg-slate-500" : "bg-blue-500"
        )} 
      />

      <div className="flex flex-col gap-4 relative z-10">
        <div className="flex justify-between items-start">
          <div className="max-w-[70%] flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-lg",
              getAvatarColor(lead.first_name)
            )}>
              {(lead.first_name || "?").charAt(0)}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight truncate">
                {lead.first_name} {lead.last_name}
              </h4>
              <p className="text-[10px] text-slate-500 font-bold tracking-tight truncate flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3 h-3 opacity-30" />
                {lead.original_email}
              </p>
            </div>
          </div>
          
          <div className={cn(
            "flex flex-col items-end px-2.5 py-1 rounded-xl border backdrop-blur-md transition-all",
            isHot ? "bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]" :
            isCold ? "bg-slate-500/10 border-slate-500/20 text-slate-400" :
            "bg-blue-500/10 border-blue-500/20 text-blue-400"
          )}>
            <span className="text-[10px] font-black uppercase tracking-tighter leading-none">Score</span>
            <span className="text-sm font-black leading-none mt-0.5">{lead.score}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {lead.assigned_to_name && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.25 rounded-lg bg-white/5 border border-white/[0.05] text-[9px] font-black text-slate-400 uppercase tracking-tighter">
              <User className="w-2.5 h-2.5 text-blue-400/60" />
              {lead.assigned_to_name}
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1.25 rounded-lg bg-white/5 border border-white/[0.05] text-[9px] font-black text-slate-400 uppercase tracking-tighter">
            <Calendar className="w-2.5 h-2.5 text-slate-500" />
            {format(new Date(lead.created_at), "dd MMM", { locale: es })}
          </div>
          {lead.phone && (
            <a 
              href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-2.5 py-1.25 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-tighter hover:bg-emerald-500/20 transition-all"
            >
              <MessageCircle className="w-2.5 h-2.5" />
              WhatsApp
            </a>
          )}
        </div>

        {/* Footer info with Source and detail trigger */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              {lead.source_name || "Directo"}
            </span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Ver Detalles</span>
            <ChevronRight className="w-4 h-4 text-blue-400" />
          </div>
        </div>
      </div>
      
      {/* Visual Priority Line */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 h-[2px] transition-all duration-500",
          isHot ? "w-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "w-0 bg-blue-500 group-hover:w-full"
        )} 
      />
    </div>
  );
}

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 
    'bg-pink-500', 'bg-emerald-500', 'bg-amber-500', 'bg-cyan-500'
  ];
  const charCode = (name || "?").charCodeAt(0);
  return colors[charCode % colors.length];
};
