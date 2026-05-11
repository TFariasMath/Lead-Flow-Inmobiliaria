import { useState, useMemo } from "react";
import {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Lead } from "@/lib/api";
import { STATUS_OPTIONS } from "@/components/leads/constants";

export function useKanbanDnd(
  leads: Lead[],
  onStatusUpdate: (leadId: string, newStatus: string) => Promise<void>
) {
  const [activeId, setActiveId] = useState<string | null>(null);

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
    // Optional: add visual feedback logic here if needed
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeLead = leads.find((l) => l.id === active.id);
    const overId = over.id as string;

    let newStatus = overId;
    if (!STATUS_OPTIONS.includes(overId)) {
      const overLead = leads.find((l) => l.id === overId);
      if (overLead) newStatus = overLead.status;
    }

    if (
      activeLead &&
      activeLead.status !== newStatus &&
      STATUS_OPTIONS.includes(newStatus)
    ) {
      await onStatusUpdate(activeLead.id, newStatus);
    }
  };

  const activeLead = useMemo(
    () => leads.find((l) => l.id === activeId),
    [activeId, leads]
  );

  return {
    activeId,
    activeLead,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
