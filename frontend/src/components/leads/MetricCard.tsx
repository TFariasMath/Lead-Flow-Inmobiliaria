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
      "relative group overflow-hidden rounded-[1.5rem] p-6 border transition-all duration-500",
      onClick ? "cursor-pointer hover:border-white/20 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]" : "cursor-default",
      active 
        ? "bg-gradient-to-br from-white/[0.08] to-transparent border-white/20 ring-1 ring-white/10 shadow-[0_0_30px_-5px_rgba(255,255,255,0.05)]" 
        : "bg-slate-900/40 backdrop-blur-xl border-white/[0.05]",
      alert && "border-red-500/30"
    )}
  >
    {/* Animated Gradient Background */}
    <div 
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
      style={{
        background: `radial-gradient(circle at center, ${color}15 0%, transparent 70%)`
      }}
    />

    {/* Top Right Fresnel Glow */}
    <div 
      className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 blur-[50px] pointer-events-none transition-all duration-700 group-hover:scale-150 group-hover:opacity-40" 
      style={{ backgroundColor: color }} 
    />

    <div className="relative z-10 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 shadow-lg" 
          style={{ 
            background: `linear-gradient(135deg, ${color}20, ${color}05)`, 
            border: `1px solid ${color}30`,
            boxShadow: active ? `0 0 20px ${color}20` : 'none'
          }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        {trend && (
          <div className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">{trend}</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-3xl font-black text-white tracking-tighter tabular-nums leading-none">
          {value}
        </p>
      </div>
    </div>

    {onClick && (
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
        <ArrowUpRight className="w-4 h-4 text-white/40" />
      </div>
    )}
  </div>
));

MetricCard.displayName = "MetricCard";
