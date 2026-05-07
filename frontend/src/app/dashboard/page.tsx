/**
 * Lead Flow - Dashboard Page
 * ==========================
 * Panel operacional con gráficos y métricas clave.
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDashboardStats, type DashboardStats } from "@/lib/api";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Webhook,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  Nuevo: "#6366f1",
  Contactado: "#06b6d4",
  "En Calificación": "#f59e0b",
  "Propuesta Enviada": "#8b5cf6",
  "Cierre Ganado": "#22c55e",
  "Cierre Perdido": "#ef4444",
};

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getDashboardStats(token)
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const statusData = Object.entries(stats.leads_by_status).map(
    ([name, value]) => ({
      name,
      value,
      fill: STATUS_COLORS[name] || "#6366f1",
    })
  );

  const webhookData = [
    { name: "Exitosos", value: stats.successful_webhooks, fill: "#22c55e" },
    { name: "Fallidos", value: stats.failed_webhooks, fill: "#ef4444" },
    {
      name: "Pendientes",
      value:
        stats.total_webhooks -
        stats.successful_webhooks -
        stats.failed_webhooks,
      fill: "#f59e0b",
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          Resumen operacional de tu pipeline comercial
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Leads"
          value={stats.total_leads}
          color="var(--color-primary)"
        />
        <StatCard
          icon={CheckCircle2}
          label="Convertidos"
          value={stats.leads_by_status["Cierre Ganado"] || 0}
          color="var(--color-success)"
        />
        {user?.isStaff && (
          <>
            <StatCard
              icon={Webhook}
              label="Total Webhooks"
              value={stats.total_webhooks}
              color="var(--color-accent)"
            />
            <StatCard
              icon={TrendingUp}
              label="Tasa de Éxito"
              value={`${stats.webhook_success_rate}%`}
              color={
                stats.webhook_success_rate >= 90
                  ? "var(--color-success)"
                  : "var(--color-warning)"
              }
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Chart */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-[var(--color-primary)]" />
            <h2 className="text-lg font-semibold text-white">
              Pipeline Comercial
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={statusData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#8b8fa3", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "#2a2d3a" }}
              />
              <YAxis
                tick={{ fill: "#8b8fa3", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "#2a2d3a" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1d27",
                  border: "1px solid #2a2d3a",
                  borderRadius: "8px",
                  color: "#e4e6eb",
                  fontSize: "13px",
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Webhooks Chart */}
        {user?.isStaff && (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="w-5 h-5 text-[var(--color-warning)]" />
              <h2 className="text-lg font-semibold text-white">
                Estado de Webhooks
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={webhookData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {webhookData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1d27",
                    border: "1px solid #2a2d3a",
                    borderRadius: "8px",
                    color: "#e4e6eb",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Source Breakdown */}
      {stats.leads_by_source.length > 0 && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Leads por Fuente
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.leads_by_source.map((s, i) => (
              <div
                key={i}
                className="bg-[var(--color-bg)] rounded-lg p-4 border border-[var(--color-border)]"
              >
                <p className="text-2xl font-bold text-white">{s.count}</p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  {s.first_source__name || "Sin fuente"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 hover:border-[color:var(--color-primary)]/30 transition-all duration-300 group">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
          <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}
