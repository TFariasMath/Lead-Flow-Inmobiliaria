/**
 * Lead Flow - Email Sandbox
 * =========================
 * Visor de correos electrónicos enviados para auditoría y pruebas.
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getSentEmails, SentEmail } from "@/lib/api";
import { 
  Mail, 
  Search, 
  ExternalLink, 
  Eye, 
  Calendar, 
  User, 
  CheckCircle2, 
  XCircle,
  ArrowLeft,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function EmailSandboxPage() {
  const { token } = useAuth();
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);

  useEffect(() => {
    if (token) {
      getSentEmails(token)
        .then(data => setEmails(data.results))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token]);

  const filteredEmails = emails.filter(e => 
    e.subject.toLowerCase().includes(search.toLowerCase()) ||
    e.to_email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Mail className="w-6 h-6 text-[var(--color-primary)]" />
            Email Sandbox
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            Auditoría de comunicaciones automáticas enviadas por el sistema.
          </p>
        </div>
      </div>

      {/* Stats & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Buscar por asunto o destinatario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
          />
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wider">Total</span>
          <span className="text-lg font-bold text-white">{filteredEmails.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
            <p className="text-sm text-[var(--color-text-muted)]">Cargando comunicaciones...</p>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-[var(--color-surface-hover)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-[var(--color-text-muted)]" />
            </div>
            <h3 className="text-lg font-medium text-white">No hay correos registrados</h3>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Las comunicaciones aparecerán aquí una vez que se activen los disparadores.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-[var(--color-border)]">
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Destinatario</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Asunto</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredEmails.map((email) => (
                  <tr 
                    key={email.id} 
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{email.to_email}</span>
                        {email.lead && (
                          <Link 
                            href={`/dashboard/leads/${email.lead}`}
                            className="text-[11px] text-[var(--color-primary)] hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <User className="w-3 h-3" /> Ver Lead
                          </Link>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">{email.subject}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(email.created_at), "dd MMM, HH:mm", { locale: es })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {email.status === "sent" ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">
                          <CheckCircle2 className="w-3 h-3" /> Enviado
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold uppercase">
                          <XCircle className="w-3 h-3" /> Fallido
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedEmail(email)}
                        className="p-2 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        title="Ver Contenido"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Preview */}
      {selectedEmail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedEmail(null)}
          />
          
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedEmail(null)}
                  className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="font-bold text-white text-lg leading-none">{selectedEmail.subject}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Para: {selectedEmail.to_email} • {format(new Date(selectedEmail.created_at), "PPP p", { locale: es })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] font-bold uppercase tracking-widest border border-[var(--color-primary)]/20">
                  SMTP Simulation
                </div>
              </div>
            </div>

            {/* Email Body */}
            <div className="flex-1 overflow-auto bg-white">
              {selectedEmail.body_html ? (
                <iframe 
                  srcDoc={selectedEmail.body_html}
                  className="w-full h-full border-none min-h-[500px]"
                  title="Email Preview"
                />
              ) : (
                <div className="p-8 text-gray-800 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                  {selectedEmail.body_text}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface)]">
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold tracking-widest">
                Sandbox Mode - No real email was sent
              </span>
              <button 
                onClick={() => setSelectedEmail(null)}
                className="px-6 py-2 bg-[var(--color-surface-hover)] hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
