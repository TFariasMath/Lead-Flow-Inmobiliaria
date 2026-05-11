/**
 * Lead Flow - Custom Premium Select
 * ================================
 * Un dropdown personalizado con estética glassmorphism, animaciones suaves
 * y control total sobre el renderizado de opciones.
 */

"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
  color?: string;
  badgeClass?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  variant?: "default" | "badge";
  icon?: ReactNode;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  className,
  variant = "default",
  icon,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isMounted, setIsMounted] = useState(false);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [menuRect, setMenuRect] = useState<DOMRect | null>(null);
  const [openUpwards, setOpenUpwards] = useState(false);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMenuRect(rect);
      
      // Si el espacio hacia abajo es menor a 250px (altura aprox del menú), abrir hacia arriba
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpwards(spaceBelow < 250);
    }
  }, [isOpen]);

  return (
    <div className={cn("relative min-w-[140px]", className)} ref={containerRef}>
      {/* Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "input-premium cursor-pointer flex items-center justify-between gap-2 group select-none",
          isOpen && "border-blue-500/50 shadow-lg shadow-blue-500/10",
          variant === "badge" && selectedOption?.badgeClass && cn("py-1 h-auto", selectedOption.badgeClass),
          icon && "pl-12"
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-blue-400 transition-colors">
              {icon}
            </div>
          )}
          <span className={cn(
            "truncate",
            !selectedOption && "text-slate-500",
            variant === "badge" && "font-black"
          )}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-slate-500 transition-transform duration-300",
          isOpen && "rotate-180 text-blue-400"
        )} />
      </div>

      {/* Dropdown Menu Portal */}
      {isMounted && isOpen && menuRect && createPortal(
        <div 
          className={cn(
            "fixed z-[9999] glass-container rounded-xl overflow-hidden animate-fadeIn py-1 origin-top shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
            openUpwards ? "animate-slideUp origin-bottom" : "animate-fadeIn origin-top"
          )}
          style={{
            top: openUpwards ? "auto" : `${menuRect.bottom + 8}px`,
            bottom: openUpwards ? `${window.innerHeight - menuRect.top + 8}px` : "auto",
            left: `${menuRect.left}px`,
            width: `${menuRect.width}px`,
            minWidth: "200px"
          }}
        >
          <div className="max-h-[240px] overflow-auto custom-scrollbar">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "px-4 py-3 flex items-center justify-between cursor-pointer transition-all relative overflow-hidden group",
                  String(option.value) === String(value) 
                    ? "bg-blue-600/20 text-white" 
                    : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                )}
              >
                {/* Selection indicator gradient */}
                {String(option.value) === String(value) && (
                  <div className="absolute inset-y-0 left-0 w-1 bg-blue-500 shadow-[2px_0_10px_rgba(59,130,246,0.5)]" />
                )}
                
                <div className="flex items-center gap-3 relative z-10">
                  {option.color && (
                    <div 
                      className="w-2.5 h-2.5 rounded-full ring-2 ring-white/5" 
                      style={{ backgroundColor: option.color, boxShadow: `0 0 10px ${option.color}44` }}
                    />
                  )}
                  <span className={cn(
                    "text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                    String(option.value) === String(value) ? "translate-x-1" : "group-hover:translate-x-0.5",
                    option.badgeClass && "px-3 py-1 rounded-full text-[9px] border border-white/5",
                    option.badgeClass
                  )}>
                    {option.label}
                  </span>
                </div>
                {String(option.value) === String(value) && (
                  <div className="w-5 h-5 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30 animate-scaleIn">
                    <Check className="w-3 h-3 text-blue-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
