"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>({});
  const [reluQueue, setReluQueue] = useState<any>({});

  useEffect(() => {
    Promise.all([
      adminApi.getJobStats().catch(() => ({})),
      adminApi.getActorStats().catch(() => ({})),
      adminApi.getReluQueue().catch(() => ({})),
    ]).then(([jobStats, actorStats, relu]) => {
      setStats({ ...(jobStats as Record<string, unknown>), ...(actorStats as Record<string, unknown>) });
      setReluQueue(relu);
    });
  }, []);

  const KPI = ({ label, value, color }: any) => (
    <div
      style={{
        background: "white",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div style={{ color: "#8892B0", fontSize: 13, marginBottom: 8 }}>{label}</div>
      <div style={{ color: "#1B2A6B", fontSize: 32, fontWeight: 800 }}>{value ?? "—"}</div>
    </div>
  );

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ color: "#1B2A6B", fontSize: 28, fontWeight: 800, marginBottom: 32 }}>
        Dashboard OpenStaff
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 20,
          marginBottom: 32,
        }}
      >
        <KPI label="Total actori" value={stats.totalActors} color="#1B2A6B" />
        <KPI label="Pending verificare" value={stats.pendingActors} color="#F59E0B" />
        <KPI label="Joburi active (LIVE)" value={stats.liveJobs} color="#00E87A" />
        <KPI label="Joburi pending" value={stats.pendingJobs} color="#F59E0B" />
        <KPI label="Relu AI azi" value={reluQueue.processedToday} color="#3B82F6" />
        <KPI label="Queue Relu" value={reluQueue.pendingJobs} color="#EF4444" />
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a
          href="/actors?verified=false"
          style={{
            background: "#1B2A6B",
            color: "white",
            padding: "12px 24px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          Actori de verificat ({stats.pendingActors || 0})
        </a>
        <a
          href="/jobs?status=PENDING_VERIFICATION"
          style={{
            background: "#00E87A",
            color: "#1B2A6B",
            padding: "12px 24px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          Joburi pending ({reluQueue.pendingJobs || 0})
        </a>
        <a
          href="/ai-config"
          style={{
            background: "white",
            color: "#1B2A6B",
            padding: "12px 24px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 14,
            border: "2px solid #1B2A6B",
          }}
        >
          Configurare AI
        </a>
      </div>
    </div>
  );
}
