"use client";

import React, { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { 
  User, 
  Mail, 
  Phone, 
  Clock, 
  ChevronRight, 
  MoreVertical,
  Activity,
  Calendar
} from "lucide-react";
import { Lead } from "@/lib/api";
import { STATUS_OPTIONS, STATUS_LABELS, STATUS_COLORS } from "./constants";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface KanbanViewProps {
  leads: Lead[];
  onStatusUpdate: (leadId: string, newStatus: string) => Promise<void>;
  onSelectLead: (leadId: string) => void;
}

export default function KanbanView({ leads, onStatusUpdate, onSelectLead }: KanbanViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Agrupar leads por estado
  const columns = useMemo(() => {
    const cols: Record<string, Lead[]> = {};
    STATUS_OPTIONS.forEach(status => {
      cols[status] = leads.filter(l => l.status === status);
    });
    return cols;
  }, [leads]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Aquí podríamos manejar el movimiento entre columnas visualmente
    // Pero dnd-kit sortable lo maneja bien si las columnas son SortableContexts
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeLead = leads.find(l => l.id === active.id);
    const overId = over.id as string;
    
    // Si el 'over' es una columna (status) o un item en una columna
    let newStatus = overId;
    if (!STATUS_OPTIONS.includes(overId)) {
      const overLead = leads.find(l => l.id === overId);
      if (overLead) newStatus = overLead.status;
    }

    if (activeLead && activeLead.status !== newStatus && STATUS_OPTIONS.includes(newStatus)) {
      await onStatusUpdate(activeLead.id, newStatus);
    }
  };

  const activeLead = useMemo(() => leads.find(l => l.id === activeId), [activeId, leads]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-6 min-h-[600px] custom-scrollbar">
        {STATUS_OPTIONS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            leads={columns[status] || []}
            onSelectLead={onSelectLead}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: "0.5",
            },
          },
        }),
      }}>
        {activeId && activeLead ? (
          <KanbanCard lead={activeLead} isOverlay onSelect={() => {}} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface ColumnProps {
  status: string;
  leads: Lead[];
  onSelectLead: (leadId: string) => void;
}

function KanbanColumn({ status, leads, onSelectLead }: ColumnProps) {
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

interface CardProps {
  lead: Lead;
  isOverlay?: boolean;
  onSelect: (id: string) => void;
}

function KanbanCard({ lead, isOverlay, onSelect }: CardProps) {
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
          <div className="max-w-[70%]">
            <h4 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight truncate">
              {lead.first_name} {lead.last_name}
            </h4>
            <p className="text-[10px] text-slate-500 font-bold tracking-tight truncate flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3 h-3 opacity-30" />
              {lead.original_email}
            </p>
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
