export default function AiControlPage() {
  const aiModules = [
    { module: "Contract interpretation", status: "Enabled", mode: "Human review required" },
    { module: "Professional matching", status: "Enabled", mode: "Auto suggestions" },
    { module: "Risk alerts", status: "Enabled", mode: "Real-time alerts" },
    { module: "Invoice automation", status: "Enabled", mode: "Contract-based logic" },
    { module: "Guarantee monitoring", status: "Enabled", mode: "Threshold alerts" },
  ];

  return (
    <div className="p-6 md:p-8">
      <section className="mb-8">
        <div className="text-sm uppercase tracking-[0.2em] text-cyan-400">AI Control</div>
        <h2 className="mt-2 text-3xl font-semibold">AI Governance & Automation Control</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Control AI document interpretation, matching logic, risk detection,
          workflow automation rules and human-in-the-loop approval checkpoints.
        </p>
      </section>

      <section className="rounded-3xl bg-slate-900 p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h3 className="text-2xl font-semibold">AI Modules</h3>
          <button className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950">
            Configure Rules
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/50 text-slate-400">
              <tr>
                <th className="p-4 font-medium">Module</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Mode</th>
              </tr>
            </thead>
            <tbody>
              {aiModules.map((item) => (
                <tr key={item.module} className="border-t border-slate-800">
                  <td className="p-4">{item.module}</td>
                  <td className="p-4">{item.status}</td>
                  <td className="p-4">{item.mode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}