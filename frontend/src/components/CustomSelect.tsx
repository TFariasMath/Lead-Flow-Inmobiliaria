/**
 * Lead Flow - Custom Premium Select
 * ================================
 * Un dropdown personalizado con estética glassmorphism, animaciones suaves
 * y control total sobre el renderizado de opciones.
 */

"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
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

  const selectedOption = options.find((opt) => opt.value === value);

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

  return (
    <div className={cn("relative min-w-[140px]", isOpen && "z-[60]", className)} ref={containerRef}>
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

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[500] glass-container rounded-xl overflow-hidden animate-fadeIn py-1 min-w-[200px] origin-top">
          <div className="max-h-[240px] overflow-auto custom-scrollbar">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "px-4 py-3 flex items-center justify-between cursor-pointer transition-all hover:bg-white/[0.05] group",
                  option.value === value && "bg-blue-500/10"
                )}
              >
                <div className="flex items-center gap-3">
                  {option.color && (
                    <div 
                      className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(var(--rgb),0.5)]" 
                      style={{ backgroundColor: option.color } as any}
                    />
                  )}
                  <span className={cn(
                    "text-xs font-bold transition-colors uppercase tracking-wider",
                    option.value === value ? "text-blue-400" : "text-slate-300 group-hover:text-white",
                    option.badgeClass && "px-2 py-0.5 rounded-full text-[10px]",
                    option.badgeClass
                  )}>
                    {option.label}
                  </span>
                </div>
                {option.value === value && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
