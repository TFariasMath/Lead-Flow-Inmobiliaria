"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Plus } from "lucide-react";

interface Benefit {
  id: string;
  icon: string;
  title: string;
}

interface BenefitEditorProps {
  benefits: Benefit[];
  onChange: (benefits: Benefit[]) => void;
}

function SortableItem({ benefit, onRemove, onUpdate }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: benefit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-white/5 border border-white/5 rounded-xl group"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-slate-600 hover:text-slate-400 transition-colors"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      
      <div className="flex flex-1 gap-2">
        <input
          type="text"
          value={benefit.icon}
          onChange={(e) => onUpdate(benefit.id, "icon", e.target.value)}
          placeholder="Icono"
          className="w-20 bg-black/30 border border-white/5 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
        <input
          type="text"
          value={benefit.title}
          onChange={(e) => onUpdate(benefit.id, "title", e.target.value)}
          placeholder="Descripción del beneficio"
          className="flex-1 bg-black/30 border border-white/5 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
      </div>

      <button
        onClick={() => onRemove(benefit.id)}
        className="p-2 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function BenefitEditor({ benefits, onChange }: BenefitEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = benefits.findIndex((b) => b.id === active.id);
      const newIndex = benefits.findIndex((b) => b.id === over.id);
      onChange(arrayMove(benefits, oldIndex, newIndex));
    }
  };

  const addBenefit = () => {
    const newBenefit: Benefit = {
      id: Math.random().toString(36).substr(2, 9),
      icon: "Building",
      title: "Nuevo Beneficio",
    };
    onChange([...benefits, newBenefit]);
  };

  const removeBenefit = (id: string) => {
    onChange(benefits.filter((b) => b.id !== id));
  };

  const updateBenefit = (id: string, field: keyof Benefit, value: string) => {
    onChange(
      benefits.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={benefits.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          {benefits.map((benefit) => (
            <SortableItem
              key={benefit.id}
              benefit={benefit}
              onRemove={removeBenefit}
              onUpdate={updateBenefit}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        onClick={addBenefit}
        className="w-full py-2 border border-dashed border-white/10 rounded-xl text-slate-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all text-xs flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Añadir Beneficio
      </button>
    </div>
  );
}
