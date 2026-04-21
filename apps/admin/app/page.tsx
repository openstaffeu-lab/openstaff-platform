import Link from "next/link";

export default function HomePage() {
  const quickLinks = [
    { title: "Go to Dashboard", path: "/dashboard", desc: "Executive overview and live alerts" },
    { title: "Open Projects", path: "/projects", desc: "Project portfolio and live progress" },
    { title: "Review Contracts", path: "/contracts", desc: "Contract registry and OTP status" },
    { title: "Open Financial", path: "/financial", desc: "Invoices, guarantees and payments" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-8">
      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-3xl bg-slate-900 p-6 md:p-8">
          <div className="text-sm uppercase tracking-[0.2em] text-cyan-400">Welcome</div>
          <h2 className="mt-2 text-3xl font-semibold">ASS JOBS Super Admin Panel</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            This control center manages the full ASS JOBS ecosystem, including employers,
            professionals, supervisors, contracts, financial flows, services, country rules,
            VAT logic, AI automation and operational monitoring across Europe.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {quickLinks.map((item) => (
              <Link key={item.title} href={item.path}>
                <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-5 transition hover:border-cyan-500/40 hover:bg-slate-800">
                  <div className="text-lg font-semibold">{item.title}</div>
                  <p className="mt-2 text-sm text-slate-400">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-900 p-6">
            <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Control</div>
            <h2 className="mt-2 text-2xl font-semibold">Core Areas</h2>
            <div className="mt-5 space-y-3">
              {[
                "Projects & contracts",
                "Professionals & supervisors",
                "Invoices, guarantees and advances",
                "Services and logistics",
                "Country, VAT and currency rules",
                "AI governance and automation",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-800 bg-slate-800/60 p-4 text-sm text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-6">
            <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">Next step</div>
            <h2 className="mt-2 text-2xl font-semibold">Build real modules</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              The next stage is to connect each page to reusable cards, tables, filters, forms
              and live business logic for ASS JOBS.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}