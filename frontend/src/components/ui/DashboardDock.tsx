"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ClientPortal } from "./ClientPortal";

type DockPosition = "top" | "bottom" | "left" | "right";

interface DashboardDockProps {
  position: DockPosition;
  children: React.ReactNode;
  triggerLabel?: string;
  className?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * DashboardDock
 * -------------
 * Componente universal para sidebars y drawers deslizantes.
 * Encapsula la lógica de portal, posicionamiento y estética.
 */
export function DashboardDock({
  position,
  children,
  className,
  isOpen: controlledIsOpen,
  onOpenChange,
}: DashboardDockProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const setIsOpen = (value: boolean) => {
    if (onOpenChange) onOpenChange(value);
    setInternalIsOpen(value);
  };

  // Mapeo de clases de posicionamiento para el Handle (Trigger)
  const triggerStyles: Record<DockPosition, string> = {
    top: "top-0 left-1/2 -translate-x-1/2 w-48 h-6 flex justify-center",
    bottom: "bottom-0 left-1/2 -translate-x-1/2 w-48 h-6 flex justify-center",
    left: "left-0 top-1/2 -translate-y-1/2 w-6 h-48 flex items-center",
    right: "right-0 top-1/2 -translate-y-1/2 w-6 h-48 flex items-center justify-end",
  };

  const handleStyles: Record<DockPosition, string> = {
    top: "w-24 h-2.5 mt-1 group-hover/trigger:w-40 group-hover/trigger:h-3",
    bottom: "w-24 h-2.5 mb-1 group-hover/trigger:w-40 group-hover/trigger:h-3",
    left: "h-24 w-2.5 ml-1 group-hover/trigger:h-40 group-hover/trigger:w-3",
    right: "h-24 w-2.5 mr-1 group-hover/trigger:h-40 group-hover/trigger:w-3",
  };

  // Mapeo de clases de posicionamiento para el Contenedor
  const containerStyles: Record<DockPosition, string> = {
    top: cn("top-0 left-0 right-0 border-b", isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"),
    bottom: cn("bottom-0 left-0 right-0 border-t", isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"),
    left: cn("top-3 bottom-3 left-3 w-[72px] border rounded-[2.5rem]", isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none"),
    right: cn("top-3 bottom-3 right-3 w-[72px] border rounded-[2.5rem]", isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"),
  };

  return (
    <ClientPortal>
      {/* ── INTERACTIVE TRIGGER AREA ── */}
      <div 
        className={cn("fixed z-[80] cursor-pointer group/trigger", triggerStyles[position])}
        onMouseEnter={() => setIsOpen(true)}
      >
        <div className={cn(
          "bg-orange-500/30 rounded-full border border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all duration-500 animate-pulse group-hover/trigger:bg-orange-500/50 group-hover/trigger:shadow-[0_0_30px_rgba(249,115,22,0.6)]",
          handleStyles[position]
        )} />
      </div>

      {/* ── THE DOCK CONTAINER ── */}
      <aside 
        className={cn(
          "fixed bg-[rgba(2,6,23,0.98)] backdrop-blur-3xl border-white/[0.08] z-[90] transition-all duration-700 ease-out shadow-[0_0_50px_rgba(0,0,0,0.5)]",
          containerStyles[position],
          className
        )}
        onMouseLeave={() => setIsOpen(false)}
      >
        {/* Top/Bottom Glow Accent */}
        <div className={cn(
          "absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent",
          position === "bottom" ? "top-0" : "top-0" // Default to top
        )} />

        <div className="h-full w-full relative">
          {children}
        </div>
      </aside>
    </ClientPortal>
  );
}
