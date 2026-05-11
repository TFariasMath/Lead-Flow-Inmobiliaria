import { Field, ErrorMessage } from "formik";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface FormFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  icon?: LucideIcon;
}

export const FormField = ({ name, label, placeholder, type = "text", icon: Icon }: FormFieldProps) => {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="input-icon-wrapper group">
        {Icon && (
          <Icon className="w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
        )}
        <Field
          name={name}
          type={type}
          placeholder={placeholder}
          className={cn("input-premium", Icon && "input-premium-icon")}
        />
      </div>
      <ErrorMessage name={name}>
        {(msg) => (
          <p className="text-[10px] font-bold text-red-500 ml-1 animate-slideDown">
            {msg}
          </p>
        )}
      </ErrorMessage>
    </div>
  );
};
