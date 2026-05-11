"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { MoreVertical } from "lucide-react";
import { Lead } from "@/lib/api";
import { STATUS_LABELS, STATUS_COLORS } from "./constants";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
  status: string;
  leads: Lead[];
  onSelectLead: (leadId: string) => void;
}

export function KanbanColumn({ status, leads, onSelectLead }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
  });
  const label = STATUS_LABELS[status];
  const colorClass = STATUS_COLORS[status];

  return (
    <div className="flex flex-col w-80 shrink-0">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", colorClass.split(' ')[2])} />
          <h3 className="text-[11px] font-black text-white uppercase tracking-widest">{label}</h3>
          <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
            {leads.length}
          </span>
        </div>
        <button className="text-slate-600 hover:text-white transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      <SortableContext
        id={status}
        items={leads.map(l => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <div 
          ref={setNodeRef}
          className="flex-1 flex flex-col gap-3 p-2 rounded-2xl bg-white/[0.01] border border-white/[0.02] min-h-[500px] transition-colors"
        >
          {leads.map((lead) => (
            <KanbanCard key={lead.id} lead={lead} onSelect={onSelectLead} />
          ))}
          {leads.length === 0 && (
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/[0.02] rounded-xl py-10">
              <p className="text-[10px] font-bold text-slate-700 uppercase tracking-tighter">Arrastra aquí</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
