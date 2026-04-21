import SectionHeader from "../../components/SectionHeader";
import StatCard from "../../components/StatCard";

export default function DashboardPage() {
  const stats = [
    { title: "Active Projects", value: "18", subtitle: "6 in Finland, 4 in Germany" },
    { title: "Open Contracts", value: "124", subtitle: "12 pending signatures" },
    { title: "Live Professionals", value: "1,240", subtitle: "94 currently active" },
    { title: "Platform Revenue", value: "€82,400", subtitle: "Current invoiced cycle" },
  ];

  const alerts = [
    "2 contracts waiting for OTP signature completion",
    "5 VAT validations require review",
    "3 projects flagged for progress delay",
    "1 guarantee deposit pending confirmation",
  ];

  return (
    <div className="p-6 md:p-8">
      <SectionHeader
        eyebrow="Dashboard"
        title="Platform Executive Overview"
        description="Centralized visibility over projects, contracts, professionals, financial operations, guarantees, compliance and platform-wide alerts."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
          />
        ))}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl bg-slate-900 p-6">
          <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Live overview</div>
          <h3 className="mt-2 text-2xl font-semibold">Operational Snapshot</h3>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <StatCard title="Projects under supervision" value="18" />
            <StatCard title="Supervisors assigned" value="47" />
            <StatCard title="Invoices generated this cycle" value="216" />
            <StatCard title="Pending payments" value="31" />
          </div>
        </div>

        <div className="rounded-3xl bg-slate-900 p-6">
          <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Alerts</div>
          <h3 className="mt-2 text-2xl font-semibold">Control Queue</h3>
          <div className="mt-5 space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert}
                className="rounded-2xl border border-slate-800 bg-slate-800/60 p-4 text-sm text-slate-200"
              >
                {alert}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}