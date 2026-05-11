"use client";

import React from "react";
import { X, Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeadManagement } from "@/hooks/useLeadManagement";
import { LeadHeader } from "./leads/LeadHeader";
import { StatusPipeline } from "./leads/StatusPipeline";
import { PropertySection } from "./leads/PropertySection";
import { ContactInfo } from "./leads/ContactInfo";
import { ActivityHistory } from "./leads/ActivityHistory";

interface LeadDetailPanelProps {
  leadId: string | null;
  token: string | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function LeadDetailPanel({ leadId, token, onClose, onUpdate }: LeadDetailPanelProps) {
  const {
    lead,
    history,
    allProperties,
    loading,
    updatingStatus,
    handleStatusChange,
    toggleProperty
  } = useLeadManagement(leadId, token, onUpdate);

  if (!leadId) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/70 backdrop-blur-md z-[100] transition-opacity duration-300",
          leadId ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className={cn(
          "fixed top-3 right-3 bottom-3 w-full max-w-xl bg-[#060c1a] border border-white/[0.06] rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.6)] z-[101] transform transition-transform duration-500 ease-out flex flex-col overflow-hidden",
          leadId ? "translate-x-0" : "translate-x-[110%]"
        )}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent z-10" />

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-slate-600 font-bold uppercase tracking-[0.2em] text-[10px]">Cargando Lead...</p>
          </div>
        ) : lead ? (
          <>
            {/* Header & Status Section */}
            <div className="p-8 border-b border-white/[0.04] relative">
              <button 
                onClick={onClose} 
                className="absolute top-6 right-6 p-2 rounded-xl hover:bg-white/5 text-slate-600 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <LeadHeader lead={lead} history={history} />
              
              <StatusPipeline 
                lead={lead} 
                history={history} 
                updatingStatus={updatingStatus} 
                onStatusChange={handleStatusChange} 
              />
            </div>

            {/* Main Content Area (Scrollable) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
              <PropertySection 
                lead={lead} 
                allProperties={allProperties} 
                toggleProperty={toggleProperty} 
              />

              <ContactInfo lead={lead} />

              <ActivityHistory history={history} />
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/[0.04]">
              <button 
                onClick={onClose} 
                className="btn-ghost w-full py-3 flex items-center justify-center gap-2"
              >
                Cerrar Panel <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
