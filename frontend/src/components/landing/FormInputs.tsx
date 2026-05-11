import React from "react";
import * as LucideIcons from "lucide-react";

interface DynamicIconProps {
  name: string;
  className?: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.HelpCircle;
  return <IconComponent className={className} />;
};

interface InputProps {
  label?: string;
  placeholder: string;
  type?: string;
  icon: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | false;
  required?: boolean;
  noLabel?: boolean;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  placeholder, 
  type = "text", 
  icon, 
  value, 
  onChange, 
  error,
  required = false, 
  noLabel = false 
}) => {
  return (
    <div className="space-y-2">
      {!noLabel && <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{label}</label>}
      <div className="relative group/input">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <DynamicIcon name={icon} className="h-4 w-4 text-slate-500 group-focus-within/input:text-white transition-colors" />
        </div>
        <input
          type={type} 
          placeholder={placeholder} 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          required={required}
          className={`w-full pl-12 pr-4 h-[52px] bg-white/5 border rounded-xl text-white text-sm focus:outline-none transition-all focus:bg-white/[0.08] ${error ? 'border-red-500/50 focus:ring-red-500/20' : 'border-white/10 focus:ring-white/20'}`}
        />
      </div>
      {error && <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider px-1">{error}</span>}
    </div>
  );
};
