import { memo } from "react";
import { ArrowUpRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  color: string;
  trend?: string;
  alert?: boolean;
  active?: boolean;
  onClick?: () => void;
}

export const MetricCard = memo(({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  trend, 
  alert, 
  active, 
  onClick 
}: MetricCardProps) => (
  <div 
    onClick={onClick}
    className={cn(
      "relative group overflow-hidden rounded-2xl p-5 border transition-all",
      onClick ? "cursor-pointer hover:border-white/10 hover:-translate-y-0.5" : "cursor-default",
      active ? "border-white/20 bg-white/5 ring-1 ring-white/10 shadow-2xl" : "glass-card border-white/5",
      alert && "border-red-500/20"
    )}
  >
    {/* Background Glow */}
    <div 
      className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10 blur-2xl pointer-events-none transition-opacity group-hover:opacity-20" 
      style={{ backgroundColor: color }} 
    />

    <div className="relative z-10 flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-black text-white">{value}</p>
          {trend && <span className="text-[9px] font-black text-emerald-400 uppercase">{trend}</span>}
        </div>
      </div>
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110" 
        style={{ 
          backgroundColor: `${color}15`, 
          border: `1px solid ${color}30` 
        }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
    </div>

    {onClick && (
      <ArrowUpRight className="absolute bottom-3 right-3 w-3 h-3 text-white/5 group-hover:text-white/30 transition-colors" />
    )}
  </div>
));

MetricCard.displayName = "MetricCard";
