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
      "glass-card rounded-2xl p-4 flex items-center justify-between group relative overflow-hidden transition-all duration-500", 
      alert && "border-red-500/20",
      active && "border-white/20 bg-white/5 ring-2 ring-white/10 scale-[1.02] shadow-2xl",
      onClick && "cursor-pointer hover:bg-white/[0.04] hover:scale-[1.02]"
    )}
  >
    {/* Dynamic Background Glow */}
    <div 
      className="absolute -right-4 -top-4 w-24 h-24 blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity duration-700" 
      style={{ backgroundColor: color }} 
    />
    
    <div className={cn("absolute top-0 left-0 w-1 h-full opacity-40 group-hover:opacity-100 transition-opacity", active && "opacity-100")} style={{ backgroundColor: color }} />
    
    <div className="flex items-center gap-4 relative z-10">
      <div 
        className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center text-slate-500 group-hover:rotate-[10deg] transition-all duration-500 border border-white/[0.05]" 
        style={{ color: alert || active ? (alert ? '#ef4444' : color) : color, boxShadow: active ? `0 0 20px ${color}33` : 'none' }}
      >
        <Icon className={cn("w-6 h-6", active && "animate-pulse")} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">{label}</p>
        <div className="flex items-end gap-2">
          <p className="text-2xl font-black text-white tracking-tight">{value}</p>
          {trend && <span className="text-[9px] font-black text-emerald-400 mb-1">{trend}</span>}
        </div>
      </div>
    </div>
    {onClick && <ArrowUpRight className="w-4 h-4 text-white/5 group-hover:text-white/40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
  </div>
));

MetricCard.displayName = "MetricCard";
