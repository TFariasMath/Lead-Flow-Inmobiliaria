"use client";

import React, { useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { Lead } from "@/lib/api";
import { STATUS_OPTIONS } from "./constants";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { useKanbanDnd } from "@/hooks/useKanbanDnd";

interface KanbanViewProps {
  leads: Lead[];
  onStatusUpdate: (leadId: string, newStatus: string) => Promise<void>;
  onSelectLead: (leadId: string) => void;
}

export default function KanbanView({ leads, onStatusUpdate, onSelectLead }: KanbanViewProps) {
  const {
    activeId,
    activeLead,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useKanbanDnd(leads, onStatusUpdate);

  // Group leads by status for efficient rendering
  const columns = useMemo(() => {
    const cols: Record<string, Lead[]> = {};
    STATUS_OPTIONS.forEach(status => {
      cols[status] = leads.filter(l => l.status === status);
    });
    return cols;
  }, [leads]);

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
